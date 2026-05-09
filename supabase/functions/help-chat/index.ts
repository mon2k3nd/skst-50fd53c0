// Help chatbot — uses Lovable AI Gateway. Streams plain text via SSE.
const LOVABLE_AI_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `Bạn là "MetricHub Trợ Lý" — chatbot hướng dẫn sử dụng phần mềm MetricHub (Sức Khoẻ Siêu Thị) cho nhân viên/quản lý siêu thị TGDĐ.

Trả lời NGẮN GỌN, tiếng Việt, có dùng markdown (bullet, in đậm). Luôn trả lời chính xác dựa trên kiến thức dưới đây. Nếu người dùng hỏi ngoài phạm vi, lịch sự nói bạn chỉ hỗ trợ về MetricHub và đề xuất câu hỏi liên quan.

# Tổng quan
MetricHub là web app phân tích "sức khoẻ siêu thị" theo mùa (Xuân/Hạ/Thu/Đông — đổi giao diện qua footer). Người dùng dán dữ liệu thô từ hệ thống BI/báo cáo, AI sẽ trích xuất và xuất ảnh PNG/PDF báo cáo đẹp theo theme đã chọn.

# Các trang
1. **Trang chủ (/)** — Giới thiệu, link nhanh tới các công cụ.
2. **Doanh Thu (/doanh-thu)** — Phân tích doanh thu hôm nay theo ngành hàng. Dán bảng → bấm "Phân tích bằng AI & tạo ảnh báo cáo" → tải PNG/PDF.
3. **Thi Đua (/thi-dua)** — Theo dõi % hoàn thành target, ngành dự kiến về đích. Cùng workflow dán → AI → xuất ảnh.
4. **Luỹ Kế (/luy-ke)** — Doanh thu luỹ kế tháng theo ngành hàng (KPI: doanh thu, mục tiêu, % HT, dự kiến tháng, +/- cùng kỳ, lãi gộp, % trả chậm…).
5. **Nhân Viên (/nhan-vien)** — Phân tích thi đua từng nhân viên:
   - **Bước 1:** nhập **Tên cửa hàng** (vd "TGDĐ 351 Cầu Giấy") — bắt buộc.
   - **Bước 2:** dán đủ **3 ô**: ① Thi đua siêu thị (target/ngày), ② Thi đua nhân viên, ③ Doanh thu nhân viên.
   - **Bước 3:** bấm **Phân tích** → AI xác định danh sách NV + ngành hàng.
   - **Bước 4:** popup **Chọn ngành hàng** cần phân tích.
   - **Bước 5:** popup **Chia target** — mặc định chia đều 100%, có slider/ô số để chỉnh; ai chỉnh tay sẽ tự **🔒 khoá**, các NV chưa khoá tự co/giãn để giữ tổng = 100%. Một bộ tỉ lệ áp dụng cho **TẤT CẢ ngành**. Bấm 🔓 để mở khoá, "Chia đều lại" để reset.
   - **Bước 6:** Báo cáo gồm 1 bảng **TỔNG HỢP THI ĐUA NHÂN VIÊN** (% hoàn thành từng ngành) + mỗi ngành 1 bảng riêng (TARGET/ĐẠT/% HT/DỰ KIẾN cuối tháng).
   - Bấm **Tải ảnh** → chọn báo cáo cần xuất PNG; hoặc **Xuất PDF** để gộp tất cả.

# Công thức quan trọng
- Target nhân viên/ngành = (target_ngày × số_ngày_trong_tháng) × tỉ_lệ_NV%.
- % HT = đạt / target × 100.
- % Dự kiến cuối tháng = (đạt / ngày_hiện_tại × số_ngày_trong_tháng) / target × 100.
- Pill màu: **xanh ≥100% (Đã đạt)**, **vàng ≥70% (Dự kiến đạt)**, **đỏ <70% (Chưa đạt)**.

# Mẹo
- Bật "AI tự chạy" để tự động phân tích mỗi khi dán dữ liệu mới.
- Đổi mùa ở footer để báo cáo đổi tông màu (Xuân hồng-xanh, Hạ xanh-vàng, Thu cam-nâu, Đông xanh-bạc).
- Nếu AI parse sai, kiểm tra dữ liệu dán có đầy đủ cột không (tên ngành, target, đạt).
`;

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!LOVABLE_AI_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (upstream.status === 429)
      return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    if (upstream.status === 402)
      return new Response(JSON.stringify({ error: "Hết credits AI." }), {
        status: 402,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: t || "AI lỗi" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...cors,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
