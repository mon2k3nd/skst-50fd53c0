import { forwardRef } from "react";

export interface BiKpis {
  doanh_thu: number | null;
  muc_tieu: number | null;
  pct_hoan_thanh: number | null;
  du_kien_thang: number | null;
  cung_ky: number | null;
  du_kien_ht_lntt: number | null;
  tra_cham_hien_tai: number | null;
  tra_cham_target: number | null;
  lai_gop: number | null;
}

export interface BiIndustry {
  ten: string;
  sl: number | null;
  dtqd: number | null;
  lai_gop: number | null;
  cung_ky_pct: number | null;
  don_gia: number | null;
  tra_cham_pct: number | null;
}

export interface BiReport {
  store_name?: string;
  period_label?: string;
  kpis: BiKpis;
  industries: BiIndustry[];
}

function fmt(n: number | null | undefined, d = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: d });
}
function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = Math.round(n);
  return `${v}%`;
}
function pctColor(n: number | null | undefined, good = true): string {
  if (n === null || n === undefined) return "rgb(120,120,120)";
  if (good) return n >= 0 ? "rgb(22,128,55)" : "rgb(200,30,30)";
  return n >= 0 ? "rgb(22,128,55)" : "rgb(200,30,30)";
}

/**
 * Visual report card matching the user's reference image.
 * Uses inline rgb() styles only (no oklch / tailwind tokens) so html2canvas
 * can rasterize it cleanly into PNG.
 */
export const ReportImage = forwardRef<HTMLDivElement, { report: BiReport; storeOverride?: string; periodOverride?: string; title?: string; firstColLabel?: string }>(
  function ReportImage({ report, storeOverride, periodOverride, title = "DOANH THU LUỸ KẾ", firstColLabel = "NGÀNH HÀNG" }, ref) {
    const k = report.kpis;
    const store = storeOverride || report.store_name || "—";
    const period = periodOverride || report.period_label || "";

    const kpiCards = [
      { label: "DOANH THU", value: fmt(k.doanh_thu, 0), bg: "rgb(255,232,232)", color: "rgb(200,30,30)" },
      { label: "MỤC TIÊU", value: fmt(k.muc_tieu, 0), bg: "rgb(225,239,255)", color: "rgb(28,60,140)" },
      { label: "% HOÀN THÀNH", value: fmtPct(k.pct_hoan_thanh), bg: "rgb(255,243,210)", color: "rgb(220,120,30)" },
      { label: "DỰ KIẾN THÁNG", value: fmtPct(k.du_kien_thang), bg: "rgb(220,234,255)", color: "rgb(28,60,140)" },
      { label: "+/- CÙNG KỲ", value: fmtPct(k.cung_ky), bg: "rgb(255,238,220)", color: pctColor(k.cung_ky) },
      { label: "DỰ KIẾN HT LNTT", value: fmtPct(k.du_kien_ht_lntt), bg: "rgb(220,245,225)", color: "rgb(20,110,55)" },
      { label: "% TRẢ CHẬM H.TẠI", value: fmtPct(k.tra_cham_hien_tai), bg: "rgb(238,228,255)", color: "rgb(95,55,180)" },
      { label: "% TRẢ CHẬM/TARGET", value: fmtPct(k.tra_cham_target), bg: "rgb(255,225,232)", color: "rgb(170,40,80)" },
    ];

    return (
      <div
        ref={ref}
        style={{
          width: 1200,
          padding: 28,
          background: "rgb(255,255,255)",
          border: "3px solid rgb(255,158,196)",
          borderRadius: 18,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "rgb(30,30,30)",
          boxSizing: "border-box",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: "rgb(225,40,110)", letterSpacing: 1 }}>
            {title}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "6px 22px",
              background: "rgb(225,40,110)",
              color: "white",
              fontWeight: 800,
              borderRadius: 10,
              fontSize: 22,
            }}
          >
            {store}
          </div>
          {period && (
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "rgb(60,60,60)" }}>{period}</div>
          )}
        </div>

        {/* KPI grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 22,
          }}
        >
          {kpiCards.map((c) => (
            <div
              key={c.label}
              style={{
                background: c.bg,
                borderRadius: 12,
                padding: "14px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgb(80,80,80)", letterSpacing: 0.5 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Industries table */}
        <div
          style={{
            marginTop: 22,
            border: "2px solid rgb(255,200,220)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "rgb(255,235,243)", color: "rgb(180,30,90)" }}>
                {[firstColLabel, "SL", "DTQĐ(TR)", "LÃI GỘP QĐ", "+/- CÙNG KỲ", "ĐƠN GIÁ", "% TRẢ CHẬM"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 10px",
                      textAlign: i === 0 ? "left" : "center",
                      fontWeight: 800,
                      borderBottom: "2px solid rgb(225,40,110)",
                      fontSize: 12,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.industries.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgb(255,220,232)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{r.ten}</td>
                  <td style={{ padding: "10px 10px", textAlign: "center" }}>{fmt(r.sl, 0)}</td>
                  <td style={{ padding: "10px 10px", textAlign: "center", color: "rgb(28,60,140)", fontWeight: 700 }}>
                    {fmt(r.dtqd)}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center", color: "rgb(20,110,55)", fontWeight: 700 }}>
                    {fmt(r.lai_gop)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      textAlign: "center",
                      color: pctColor(r.cung_ky_pct),
                      fontWeight: 800,
                    }}
                  >
                    {fmtPct(r.cung_ky_pct)}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center" }}>{fmt(r.don_gia)}</td>
                  <td
                    style={{
                      padding: "10px 10px",
                      textAlign: "center",
                      color: pctColor(r.tra_cham_pct, false),
                      fontWeight: 800,
                    }}
                  >
                    {fmtPct(r.tra_cham_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "rgb(140,140,140)" }}>
          SỨC KHOẺ SIÊU THỊ REPORT
        </div>
      </div>
    );
  },
);