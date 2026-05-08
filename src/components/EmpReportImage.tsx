import { forwardRef } from "react";

export interface EmpRow {
  code?: string | null;
  name: string;
  target: number;
  actual: number;
  pct: number; // 0..100+
}

export interface EmpReportProps {
  title: string;
  store?: string;
  period?: string;
  unit?: "DT" | "SL" | "" | string;
  /** Show count column "Đạt x/y ngành" instead of target/actual numbers */
  summaryMode?: boolean;
  totalIndustries?: number;
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
function pctColor(n: number): string {
  if (n >= 100) return "rgb(22,128,55)";
  if (n >= 70) return "rgb(220,140,30)";
  return "rgb(200,30,30)";
}

export const EmpReportImage = forwardRef<HTMLDivElement, EmpReportProps>(function EmpReportImage(
  { title, store, period, unit, summaryMode, totalIndustries, rows },
  ref,
) {
  const winners = rows.filter((r) => r.pct >= 100).length;
  return (
    <div
      ref={ref}
      style={{
        width: 1100,
        padding: 24,
        background: "rgb(255,255,255)",
        border: "3px solid rgb(255,158,196)",
        borderRadius: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "rgb(30,30,30)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "rgb(225,40,110)", letterSpacing: 0.5 }}>{title}</div>
        {store && (
          <div
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "5px 18px",
              background: "rgb(225,40,110)",
              color: "white",
              fontWeight: 800,
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            {store}
          </div>
        )}
        {period && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "rgb(80,80,80)" }}>{period}</div>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
        <div style={{ background: "rgb(255,232,238)", borderRadius: 10, padding: "8px 18px", minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgb(120,30,70)" }}>SỐ NV ĐẠT</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "rgb(225,40,110)" }}>
            {winners}/{rows.length}
          </div>
        </div>
        {summaryMode && totalIndustries !== undefined && (
          <div style={{ background: "rgb(225,239,255)", borderRadius: 10, padding: "8px 18px", minWidth: 180 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgb(28,60,140)" }}>NGÀNH HÀNG PHÂN TÍCH</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "rgb(28,60,140)" }}>{totalIndustries}</div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "2px solid rgb(255,200,220)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 18 }}>
          <thead>
            <tr style={{ background: "rgb(255,235,243)", color: "rgb(180,30,90)" }}>
              <th style={th(true)}>NHÂN VIÊN</th>
              {summaryMode ? (
                <>
                  <th style={th()}>NGÀNH ĐẠT</th>
                  <th style={th()}>TỔNG NGÀNH</th>
                  <th style={th()}>% ĐẠT</th>
                </>
              ) : (
                <>
                  <th style={th()}>TARGET{unit ? ` (${unit})` : ""}</th>
                  <th style={th()}>ĐẠT{unit ? ` (${unit})` : ""}</th>
                  <th style={th()}>% HOÀN THÀNH</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgb(255,220,232)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                  {r.code ? `${r.code} · ` : ""}
                  {r.name}
                </td>
                {summaryMode ? (
                  <>
                    <td style={td()}>
                      <span style={{ color: pctColor(r.pct), fontWeight: 800 }}>{Math.round(r.target)}</span>
                    </td>
                    <td style={td()}>{Math.round(r.actual)}</td>
                    <td style={{ ...td(), color: pctColor(r.pct), fontWeight: 800 }}>{fmtPct(r.pct)}</td>
                  </>
                ) : (
                  <>
                    <td style={td()}>{fmt(r.target)}</td>
                    <td style={td()}>{fmt(r.actual)}</td>
                    <td style={{ ...td(), color: pctColor(r.pct), fontWeight: 800 }}>{fmtPct(r.pct)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

function th(left = false): React.CSSProperties {
  return {
    padding: "12px 12px",
    textAlign: left ? "left" : "center",
    fontWeight: 800,
    borderBottom: "2px solid rgb(225,40,110)",
    fontSize: 16,
  };
}
function td(): React.CSSProperties {
  return { padding: "12px 12px", textAlign: "center" };
}