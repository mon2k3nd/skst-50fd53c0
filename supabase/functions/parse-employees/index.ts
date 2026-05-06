import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOOL = {
  type: "function",
  function: {
    name: "extract_employees",
    description: "Trích xuất danh sách nhân viên từ file/text dán vào.",
    parameters: {
      type: "object",
      properties: {
        employees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: { type: "string", description: "Mã nhân viên (nếu có)" },
              name: { type: "string", description: "Họ và tên nhân viên" },
              target: { type: ["number", "null"], description: "Target cá nhân, đơn vị triệu đồng. Nếu nguồn ghi đồng thì chia 1.000.000." },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
      },
      required: ["employees"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Thiếu 'text'." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY chưa cấu hình.");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Bạn là trợ lý trích xuất danh sách nhân viên từ nội dung Excel/CSV/text dán vào. Bỏ qua tiêu đề, dòng tổng, dòng trống. Trả về mã NV, họ tên, target (triệu đồng)." },
          { role: "user", content: text.slice(0, 20000) },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_employees" } },
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: resp.status === 429 ? "Vượt giới hạn AI." : resp.status === 402 ? "Cần nạp credits." : "AI gateway error" }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI không trả về dữ liệu." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-employees error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});