import { forwardRef } from "react";

export interface EmpRow {
  code?: string | null;
  name: string;
  target: number;
  actual: number;
  pct: number; // 0..100+
  projectedPct?: number; // dự kiến cuối tháng
}

export interface EmpReportProps {
  title: string;
  store?: string;
  period?: string;
  unit?: "DT" | "SL" | "" | string;
  rows: EmpRow[];
}

function fmt(n: number, d = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: d });
}
function fmtPct(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Math.round(n)}%`;
}

/** Status color set: đã đạt (>=100), dự kiến đạt (>=70), chưa đạt (<70) */
function statusStyle(pct: number): { color: string; bg: string; label: string } {
  if (pct >= 100)
    return {
      color: "rgb(21,128,61)",
      bg: "color-mix(in oklab, rgb(21,128,61) 14%, var(--card))",
      label: "Đã đạt",
    };
  if (pct >= 70)
    return {
      color: "rgb(180,120,20)",
      bg: "color-mix(in oklab, rgb(234,179,8) 16%, var(--card))",
      label: "Dự kiến",
    };
  return {
    color: "rgb(190,30,40)",
    bg: "color-mix(in oklab, rgb(220,38,38) 12%, var(--card))",
    label: "Chưa đạt",
  };
}

function Pill({ pct }: { pct: number }) {
  const s = statusStyle(pct);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 14,
        color: s.color,
        background: s.bg,
        border: `1px solid color-mix(in oklab, ${s.color} 35%, transparent)`,
        minWidth: 56,
        textAlign: "center",
      }}
    >
      {fmtPct(pct)}
    </span>
  );
}

export const EmpReportImage = forwardRef<HTMLDivElement, EmpReportProps>(function EmpReportImage(
  { title, store, period, unit, rows },
  ref,
) {
  const winners = rows.filter((r) => r.pct >= 100).length;
  const projected = rows.filter((r) => r.pct < 100 && (r.projectedPct ?? 0) >= 100).length;
  const fail = rows.length - winners - projected;
  const totalQty = rows.reduce((s, r) => s + (r.actual || 0), 0);
  return (
    <div
      ref={ref}
      style={{
        width: 1100,
        padding: 24,
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
      <Header title={title} store={store} period={period} />

      <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        <Stat label="ĐÃ ĐẠT" value={`${winners}`} tone="ok" />
        <Stat label="DỰ KIẾN ĐẠT" value={`${projected}`} tone="warn" />
        <Stat label="CHƯA ĐẠT" value={`${fail}`} tone="bad" />
        <Stat label={`TỔNG SỐ LƯỢNG${unit ? ` (${unit})` : ""}`} value={fmt(totalQty)} tone="brand" />
      </div>

      <div
        style={{
          marginTop: 16,
          border: "2px solid color-mix(in oklab, var(--brand) 35%, transparent)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17 }}>
          <thead>
            <tr style={{ background: "color-mix(in oklab, var(--brand) 14%, var(--card))", color: "var(--brand)" }}>
              <th style={th(true)}>NHÂN VIÊN</th>
              <th style={th()}>TARGET{unit ? ` (${unit})` : ""}</th>
              <th style={th()}>ĐẠT{unit ? ` (${unit})` : ""}</th>
              <th style={th()}>% HT</th>
              <th style={th()}>DỰ KIẾN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "transparent" : "color-mix(in oklab, var(--brand) 4%, var(--card))",
                  borderBottom: "1px solid color-mix(in oklab, var(--brand) 14%, transparent)",
                }}
              >
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                  {r.code ? `${r.code} · ` : ""}
                  {r.name}
                </td>
                <td style={td()}>{fmt(r.target)}</td>
                <td style={td()}>{fmt(r.actual)}</td>
                <td style={td()}><Pill pct={r.pct} /></td>
                <td style={td()}>
                  {r.projectedPct !== undefined ? <Pill pct={r.projectedPct} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

/* ---------- Summary matrix component ---------- */

export interface EmpSummaryRow {
  code?: string | null;
  name: string;
  totalAchieved: number;
  totalPct: number;
  perInd: { name: string; unit?: string; pct: number; achieved: number }[];
}

export interface EmpSummaryMatrixProps {
  title: string;
  store?: string;
  period?: string;
  industries: { name: string; unit?: string }[];
  rows: EmpSummaryRow[];
}

export const EmpSummaryMatrixImage = forwardRef<HTMLDivElement, EmpSummaryMatrixProps>(
  function EmpSummaryMatrixImage({ title, store, period, industries, rows }, ref) {
    const winners = rows.filter((r) => r.totalPct >= 100).length;
    return (
      <div
        ref={ref}
        style={{
          width: Math.max(1100, 380 + industries.length * 110),
          padding: 24,
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
        <Header title={title} store={store} period={period} />

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <Stat label="NV ĐẠT TỔNG" value={`${winners}/${rows.length}`} tone="ok" />
          <Stat label="NGÀNH PHÂN TÍCH" value={`${industries.length}`} tone="brand" />
        </div>

        <div
          style={{
            marginTop: 16,
            border: "2px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "color-mix(in oklab, var(--brand) 14%, var(--card))", color: "var(--brand)" }}>
                <th style={th(true)}>NHÂN VIÊN</th>
                {industries.map((ind, i) => (
                  <th key={i} style={th()}>{ind.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "transparent" : "color-mix(in oklab, var(--brand) 4%, var(--card))",
                    borderBottom: "1px solid color-mix(in oklab, var(--brand) 14%, transparent)",
                  }}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {r.code ? `${r.code} · ` : ""}
                    {r.name}
                  </td>
                  {r.perInd.map((p, j) => (
                    <td key={j} style={td()}><Pill pct={p.pct} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

/* ---------- shared bits ---------- */

function Header({ title, store, period }: { title: string; store?: string; period?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--brand)", letterSpacing: 0.5 }}>{title}</div>
      {store && (
        <div
          style={{
            display: "inline-block",
            marginTop: 6,
            padding: "5px 18px",
            background: "var(--brand)",
            color: "var(--brand-foreground)",
            fontWeight: 800,
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          {store}
        </div>
      )}
      {period && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)" }}>{period}</div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "bad" | "brand" }) {
  const palette = {
    ok: { c: "rgb(21,128,61)", b: "color-mix(in oklab, rgb(21,128,61) 14%, var(--card))" },
    warn: { c: "rgb(180,120,20)", b: "color-mix(in oklab, rgb(234,179,8) 16%, var(--card))" },
    bad: { c: "rgb(190,30,40)", b: "color-mix(in oklab, rgb(220,38,38) 12%, var(--card))" },
    brand: { c: "var(--brand)", b: "color-mix(in oklab, var(--brand) 14%, var(--card))" },
  }[tone];
  return (
    <div
      style={{
        background: palette.b,
        borderRadius: 12,
        padding: "8px 18px",
        minWidth: 140,
        border: `1px solid color-mix(in oklab, ${palette.c} 30%, transparent)`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: palette.c, letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: palette.c }}>{value}</div>
    </div>
  );
}

function th(left = false): React.CSSProperties {
  return {
    padding: "12px 12px",
    textAlign: left ? "left" : "center",
    fontWeight: 800,
    borderBottom: "2px solid var(--brand)",
    fontSize: 14,
    whiteSpace: "nowrap",
  };
}
function td(): React.CSSProperties {
  return { padding: "10px 12px", textAlign: "center" };
}
