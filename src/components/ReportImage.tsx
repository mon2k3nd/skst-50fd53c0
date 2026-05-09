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
  return `${Math.round(n)}%`;
}
function deltaColor(n: number | null | undefined, positiveIsGood = true): string {
  if (n === null || n === undefined) return "var(--muted-foreground)";
  const good = positiveIsGood ? n >= 0 : n <= 0;
  return good ? "rgb(21,128,61)" : "rgb(190,30,40)";
}

/**
 * Visual report card themed with seasonal CSS variables.
 * Uses var(--brand) / color-mix so the card swaps appearance with the season.
 */
export const ReportImage = forwardRef<
  HTMLDivElement,
  { report: BiReport; storeOverride?: string; periodOverride?: string; title?: string; firstColLabel?: string }
>(function ReportImage(
  { report, storeOverride, periodOverride, title = "DOANH THU LUỸ KẾ", firstColLabel = "NGÀNH HÀNG" },
  ref,
) {
  const k = report.kpis;
  const store = storeOverride || report.store_name || "—";
  const period = periodOverride || report.period_label || "";

  const kpiCards: { label: string; value: string; tone: "brand" | "ok" | "warn" | "bad" | "info" }[] = [
    { label: "DOANH THU", value: fmt(k.doanh_thu, 0), tone: "brand" },
    { label: "MỤC TIÊU", value: fmt(k.muc_tieu, 0), tone: "info" },
    { label: "% HOÀN THÀNH", value: fmtPct(k.pct_hoan_thanh), tone: "warn" },
    { label: "DỰ KIẾN THÁNG", value: fmtPct(k.du_kien_thang), tone: "info" },
    { label: "+/- CÙNG KỲ", value: fmtPct(k.cung_ky), tone: (k.cung_ky ?? 0) >= 0 ? "ok" : "bad" },
    { label: "DỰ KIẾN HT LNTT", value: fmtPct(k.du_kien_ht_lntt), tone: "ok" },
    { label: "% TRẢ CHẬM H.TẠI", value: fmtPct(k.tra_cham_hien_tai), tone: "warn" },
    { label: "% TRẢ CHẬM/TARGET", value: fmtPct(k.tra_cham_target), tone: "bad" },
  ];

  const tone = (t: "brand" | "ok" | "warn" | "bad" | "info") => {
    switch (t) {
      case "ok":
        return { c: "rgb(21,128,61)", b: "color-mix(in oklab, rgb(21,128,61) 14%, var(--card))" };
      case "warn":
        return { c: "rgb(180,120,20)", b: "color-mix(in oklab, rgb(234,179,8) 16%, var(--card))" };
      case "bad":
        return { c: "rgb(190,30,40)", b: "color-mix(in oklab, rgb(220,38,38) 12%, var(--card))" };
      case "info":
        return { c: "var(--season-4)", b: "color-mix(in oklab, var(--season-4) 16%, var(--card))" };
      default:
        return { c: "var(--brand)", b: "color-mix(in oklab, var(--brand) 14%, var(--card))" };
    }
  };

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        padding: 28,
        background: "var(--card)",
        backgroundImage:
          "linear-gradient(135deg, color-mix(in oklab, var(--brand) 8%, var(--card)) 0%, var(--card) 55%)",
        border: "3px solid var(--brand)",
        borderRadius: 18,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--foreground)",
        boxSizing: "border-box",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: "var(--brand)", letterSpacing: 0.6 }}>{title}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 8,
            padding: "6px 22px",
            background: "var(--brand)",
            color: "var(--brand-foreground)",
            fontWeight: 800,
            borderRadius: 10,
            fontSize: 20,
          }}
        >
          {store}
        </div>
        {period && (
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)" }}>{period}</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 22 }}>
        {kpiCards.map((c) => {
          const t = tone(c.tone);
          return (
            <div
              key={c.label}
              style={{
                background: t.b,
                borderRadius: 12,
                padding: "14px 18px",
                textAlign: "center",
                border: `1px solid color-mix(in oklab, ${t.c} 30%, transparent)`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: t.c, letterSpacing: 0.5 }}>{c.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: t.c, marginTop: 6 }}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 22,
          border: "2px solid color-mix(in oklab, var(--brand) 35%, transparent)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 18 }}>
          <thead>
            <tr style={{ background: "color-mix(in oklab, var(--brand) 14%, var(--card))", color: "var(--brand)" }}>
              {[firstColLabel, "SL", "DTQĐ(TR)", "LÃI GỘP QĐ", "+/- CÙNG KỲ", "ĐƠN GIÁ", "% TRẢ CHẬM"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 12px",
                    textAlign: i === 0 ? "left" : "center",
                    fontWeight: 800,
                    borderBottom: "2px solid var(--brand)",
                    fontSize: 15,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.industries.map((r, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "transparent" : "color-mix(in oklab, var(--brand) 4%, var(--card))",
                  borderBottom: "1px solid color-mix(in oklab, var(--brand) 14%, transparent)",
                }}
              >
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>{r.ten}</td>
                <td style={{ padding: "12px 12px", textAlign: "center" }}>{fmt(r.sl, 0)}</td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: "var(--season-4)", fontWeight: 700 }}>
                  {fmt(r.dtqd)}
                </td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: "rgb(21,128,61)", fontWeight: 700 }}>
                  {fmt(r.lai_gop)}
                </td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: deltaColor(r.cung_ky_pct), fontWeight: 800 }}>
                  {fmtPct(r.cung_ky_pct)}
                </td>
                <td style={{ padding: "12px 12px", textAlign: "center" }}>{fmt(r.don_gia)}</td>
                <td style={{ padding: "12px 12px", textAlign: "center", color: deltaColor(r.tra_cham_pct, false), fontWeight: 800 }}>
                  {fmtPct(r.tra_cham_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "var(--muted-foreground)" }}>
        SỨC KHOẺ SIÊU THỊ REPORT · MetricHub
      </div>
    </div>
  );
});
