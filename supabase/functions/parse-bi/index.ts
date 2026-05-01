import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích báo cáo BI bán lẻ tiếng Việt.
Người dùng dán nội dung copy thô (lẫn menu, tiêu đề, chữ thừa). Nhiệm vụ:
1) Bỏ qua mọi text thừa (menu, breadcrumb, tên user, tên các tab...).
2) Trích xuất KPI tổng quan + bảng theo ngành hàng.
3) Suy luận tên siêu thị (vd: "351 Cầu Giấy") và mốc thời gian nếu có.

QUAN TRỌNG về số liệu:
- Giữ nguyên đơn vị như trong nguồn (triệu, %, v.v).
- KPI "% Hoàn thành" = % HT Target (nếu có), nếu không thì doanh_thu/muc_tieu*100.
- Nếu nguồn có dòng "Tổng" thì lấy số ở dòng Tổng cho doanh_thu, mục tiêu, lãi gộp.
- Trường nào không có trong nguồn thì để null.`;

const TOOL = {
  type: "function",
  function: {
    name: "extract_bi_report",
    description: "Trích xuất báo cáo BI thành JSON có cấu trúc.",
    parameters: {
      type: "object",
      properties: {
        store_name: { type: "string", description: "Tên siêu thị / điểm bán" },
        period_label: { type: "string", description: "Mốc thời gian, vd 'HẾT NGÀY 20/4/2026' hoặc 'Tháng 03/2026'" },
        kpis: {
          type: "object",
          properties: {
            doanh_thu: { type: ["number", "null"] },
            muc_tieu: { type: ["number", "null"] },
            pct_hoan_thanh: { type: ["number", "null"], description: "%, ví dụ 90 nghĩa là 90%" },
            du_kien_thang: { type: ["number", "null"], description: "% dự kiến hoàn thành tháng" },
            cung_ky: { type: ["number", "null"], description: "% +/- so cùng kỳ, có thể âm" },
            du_kien_ht_lntt: { type: ["number", "null"], description: "% dự kiến HT LNTT" },
            tra_cham_hien_tai: { type: ["number", "null"], description: "% trả chậm hiện tại" },
            tra_cham_target: { type: ["number", "null"], description: "% trả chậm / target" },
            lai_gop: { type: ["number", "null"] },
          },
          required: [],
          additionalProperties: false,
        },
        industries: {
          type: "array",
          description: "Danh sách ngành hàng (KHÔNG bao gồm dòng Tổng)",
          items: {
            type: "object",
            properties: {
              ten: { type: "string", description: "Tên ngành hàng, vd 'NNH Điện thoại mới'" },
              sl: { type: ["number", "null"], description: "Số lượng" },
              dtqd: { type: ["number", "null"], description: "DTQĐ (triệu)" },
              lai_gop: { type: ["number", "null"] },
              cung_ky_pct: { type: ["number", "null"], description: "% +/- cùng kỳ" },
              don_gia: { type: ["number", "null"] },
              tra_cham_pct: { type: ["number", "null"], description: "% trả chậm" },
            },
            required: ["ten"],
            additionalProperties: false,
          },
        },
      },
      required: ["industries", "kpis"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Thiếu trường 'text'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình.");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_bi_report" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Đã vượt giới hạn AI, vui lòng thử lại sau." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Cần nạp credits cho Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI không trả về dữ liệu cấu trúc." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-bi error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});