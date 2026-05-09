import { forwardRef } from "react";

export interface EmpRow {
  code?: string | null;
  name: string;
  target: number;
  actual: number;
  pct: number; // 0..100+ (current % = actual/target*100)
  /** projected end-of-month % based on day-of-month run-rate */
  projectedPct?: number;
  /** display date e.g. dd/MM/yyyy */
  dateLabel?: string;
  /** rank within the table, 1 = best */
  rank?: number;
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
function fmtPct(n: number | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Math.round(n)}%`;
}
function pctColor(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "var(--color-muted-foreground)";
  if (n >= 100) return "var(--color-success)";
  if (n >= 70) return "var(--color-warning)";
  return "var(--color-destructive)";
}

export const EmpReportImage = forwardRef<HTMLDivElement, EmpReportProps>(function EmpReportImage(
  { title, store, period, unit, summaryMode, totalIndustries, rows },
  ref,
) {
  const winners = rows.filter((r) => (r.projectedPct ?? r.pct) >= 100).length;
  return (
    <div
      ref={ref}
      style={{
        width: 1180,
        padding: 24,
        background: "var(--color-card)",
        border: "3px solid var(--color-primary)",
        borderRadius: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "var(--color-card-foreground)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: "var(--color-primary)",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </div>
        {store && (
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "5px 18px",
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              fontWeight: 800,
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            🏬 {store}
          </div>
        )}
        {period && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
            }}
          >
            {period}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
        <div
          style={{
            background: "var(--color-accent)",
            color: "var(--color-accent-foreground)",
            borderRadius: 10,
            padding: "8px 18px",
            minWidth: 200,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
            NV DỰ KIẾN ĐẠT
          </div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>
            {winners}/{rows.length}
          </div>
        </div>
        {summaryMode && totalIndustries !== undefined && (
          <div
            style={{
              background: "var(--color-secondary)",
              color: "var(--color-secondary-foreground)",
              borderRadius: 10,
              padding: "8px 18px",
              minWidth: 200,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
              NGÀNH HÀNG PHÂN TÍCH
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{totalIndustries}</div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          border: "2px solid var(--color-border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
          <thead>
            <tr
              style={{
                background: "var(--color-muted)",
                color: "var(--color-primary)",
              }}
            >
              <th style={th(true)}>#</th>
              <th style={th(true)}>NHÂN VIÊN</th>
              {summaryMode ? (
                <>
                  <th style={th()}>NGÀNH ĐẠT</th>
                  <th style={th()}>TỔNG NGÀNH</th>
                  <th style={th()}>% ĐẠT</th>
                  <th style={th()}>NGÀY</th>
                  <th style={th()}>XẾP HẠNG</th>
                </>
              ) : (
                <>
                  <th style={th()}>TARGET{unit ? ` (${unit})` : ""}</th>
                  <th style={th()}>THỰC HIỆN{unit ? ` (${unit})` : ""}</th>
                  <th style={th()}>% HT DỰ KIẾN</th>
                  <th style={th()}>NGÀY</th>
                  <th style={th()}>XẾP HẠNG</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rank = r.rank ?? i + 1;
              const projColor = pctColor(r.projectedPct ?? r.pct);
              const rankBg =
                rank === 1
                  ? "var(--color-warning)"
                  : rank === 2
                  ? "var(--color-secondary)"
                  : rank === 3
                  ? "var(--color-accent)"
                  : "transparent";
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: i % 2 === 0 ? "transparent" : "var(--color-muted)",
                  }}
                >
                  <td style={{ ...td(), fontWeight: 800 }}>{rank}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                    {r.code ? `${r.code} · ` : ""}
                    {r.name}
                  </td>
                  {summaryMode ? (
                    <>
                      <td style={td()}>
                        <span style={{ color: projColor, fontWeight: 800 }}>
                          {Math.round(r.target)}
                        </span>
                      </td>
                      <td style={td()}>{Math.round(r.actual)}</td>
                      <td style={{ ...td(), color: projColor, fontWeight: 800 }}>
                        {fmtPct(r.pct)}
                      </td>
                      <td style={td()}>{r.dateLabel ?? "—"}</td>
                      <td style={{ ...td(), background: rankBg, fontWeight: 800 }}>{rank}</td>
                    </>
                  ) : (
                    <>
                      <td style={td()}>{fmt(r.target)}</td>
                      <td style={td()}>{fmt(r.actual)}</td>
                      <td style={{ ...td(), color: projColor, fontWeight: 800 }}>
                        {fmtPct(r.projectedPct ?? r.pct)}
                      </td>
                      <td style={td()}>{r.dateLabel ?? "—"}</td>
                      <td style={{ ...td(), background: rankBg, fontWeight: 800 }}>{rank}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

function th(left = false): React.CSSProperties {
  return {
    padding: "12px 10px",
    textAlign: left ? "left" : "center",
    fontWeight: 800,
    borderBottom: "2px solid var(--color-primary)",
    fontSize: 14,
  };
}
function td(): React.CSSProperties {
  return { padding: "12px 10px", textAlign: "center" };
}
