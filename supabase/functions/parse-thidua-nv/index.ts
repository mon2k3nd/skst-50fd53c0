import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích báo cáo BI bán lẻ tiếng Việt cho chuỗi siêu thị MWG/TGDĐ/ĐMX.
Người dùng dán 3 khối dữ liệu thô:
- block1 = "Thi đua siêu thị (luỹ kế)" theo ngành hàng (DT/SL Realtime, Target Ngày, %HT...).
- block2 = "Thi đua nhân viên" — bảng pivot: cột là ngành hàng, dòng là nhân viên, giá trị là DTLK / SLLK đã làm được.
- block3 = "Doanh thu nhân viên" — danh sách doanh thu thực hiện theo từng nhân viên (có thể có ngành hàng kèm).

Nhiệm vụ:
1) Suy luận tên siêu thị (nếu có) và mốc thời gian.
2) Trích xuất danh sách NGÀNH HÀNG từ block1: tên ngành hàng, đơn vị (DT hay SL), target ngày của ngành hàng đó.
3) Trích xuất danh sách NHÂN VIÊN từ block2 + block3 (gộp lại, loại bỏ dòng "Tổng" và dòng nhóm "BP ..."). Mỗi nhân viên: code (mã nếu có), name, và "achieved" theo từng ngành hàng (map theo tên ngành hàng giống block1).
4) Số liệu giữ nguyên đơn vị nguồn (triệu cho DT, cái cho SL). Dùng dấu chấm thập phân.
5) KHÔNG bịa nhân viên không có trong nguồn.`;

const TOOL = {
  type: "function",
  function: {
    name: "extract_thidua_nv",
    description: "Trích xuất thi đua nhân viên có cấu trúc.",
    parameters: {
      type: "object",
      properties: {
        store_name: { type: ["string", "null"] },
        period_label: { type: ["string", "null"] },
        industries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Tên ngành hàng đầy đủ" },
              unit: { type: "string", enum: ["DT", "SL"], description: "DT = doanh thu (triệu), SL = số lượng" },
              target: { type: ["number", "null"], description: "Target Ngày của ngành hàng (tổng siêu thị)" },
              achieved_total: { type: ["number", "null"], description: "Tổng đã đạt của siêu thị (Realtime)" },
            },
            required: ["name", "unit"],
            additionalProperties: false,
          },
        },
        employees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: { type: ["string", "null"] },
              name: { type: "string" },
              achieved: {
                type: "array",
                description: "Doanh thu/số lượng đã làm theo từng ngành hàng. Tên ngành hàng phải khớp với industries[].name.",
                items: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    value: { type: "number" },
                  },
                  required: ["industry", "value"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "achieved"],
            additionalProperties: false,
          },
        },
      },
      required: ["industries", "employees"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { block1, block2, block3 } = await req.json();
    const userMsg = `# BLOCK 1 — Thi đua siêu thị (luỹ kế)\n${block1 ?? ""}\n\n# BLOCK 2 — Thi đua nhân viên (pivot)\n${block2 ?? ""}\n\n# BLOCK 3 — Doanh thu nhân viên\n${block3 ?? ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình.");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_thidua_nv" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Đã vượt giới hạn AI." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Cần nạp credits Lovable AI." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI không trả dữ liệu cấu trúc." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("parse-thidua-nv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});