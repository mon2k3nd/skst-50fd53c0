import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { Trophy, Target, CheckCircle2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/thi-dua")({
  component: ThiDuaPage,
  head: () => ({
    meta: [
      { title: "Thi Đua Siêu Thị — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Theo dõi % hoàn thành target, ngành hàng dự kiến về đích từ dữ liệu thi đua." },
    ],
  }),
});

function ThiDuaPage() {
  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseTable(raw), [raw]);

  const stats = useMemo(() => {
    if (parsed.rows.length === 0) return null;
    const pctCol =
      parsed.headers.find((h) => /% HT Target|%HT|Hoàn thành|HT Target/i.test(h)) ?? "";
    const expectedCol =
      parsed.headers.find((h) => /Dự kiến|% HT Dự kiến/i.test(h)) ?? "";
    let achieved = 0;
    let expected = 0;
    parsed.rows.forEach((r) => {
      if (pctCol && toNumber(r[pctCol]) >= 100) achieved++;
      if (expectedCol && toNumber(r[expectedCol]) >= 100) expected++;
    });
    const total = parsed.rows.length;
    const overshoot = expectedCol
      ? parsed.rows.reduce((s, r) => s + toNumber(r[expectedCol]), 0) / total - 100
      : 0;
    return { total, achieved, expected, overshoot, pctCol, expectedCol };
  }, [parsed]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Thi Đua Siêu Thị</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán bảng thi đua theo ngành hàng để xem dự kiến về đích.
        </p>

        <div className="mt-6">
          <DataPasteCard
            title="Dán nội dung báo cáo THI ĐUA"
            value={raw}
            onChange={setRaw}
            icon={<Trophy className="h-4 w-4" />}
            rows={10}
          />
        </div>

        {stats && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <BigStat
                label="Số ngành hàng dự kiến đạt"
                main={`${stats.expected}`}
                sub={`/ ${stats.total}`}
                gradient="var(--gradient-hero)"
                icon={<Target className="h-5 w-5" />}
              />
              <BigStat
                label="Số ngành hàng đã về đích"
                main={`${stats.achieved}`}
                sub={
                  stats.total
                    ? `${formatPercent((stats.achieved / stats.total) * 100)}`
                    : ""
                }
                gradient="var(--gradient-warning)"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <BigStat
                label="% vượt trội dự kiến"
                main={formatPercent(stats.overshoot)}
                sub=""
                gradient="var(--gradient-success)"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>

            <Card className="mt-6 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-info">Bảng thi đua chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-destructive text-destructive-foreground">
                      {parsed.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {parsed.headers.map((h) => {
                          const v = r[h];
                          const isPct = h === stats.pctCol || h === stats.expectedCol;
                          const num = typeof v === "number" ? v : null;
                          let cls = "";
                          if (isPct && num !== null) {
                            cls =
                              num >= 100
                                ? "bg-success/15 text-success font-semibold"
                                : num >= 50
                                ? "bg-warning/15 text-warning font-semibold"
                                : "text-muted-foreground";
                          }
                          return (
                            <td key={h} className={`px-3 py-2 ${cls}`}>
                              {typeof v === "number"
                                ? isPct
                                  ? formatPercent(v)
                                  : formatNumber(v)
                                : (v as string)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function BigStat({
  label,
  main,
  sub,
  gradient,
  icon,
}: {
  label: string;
  main: string;
  sub: string;
  gradient: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)]">
      <div className="p-5 text-white" style={{ background: gradient }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-90">
          {icon}
          {label}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold">{main}</span>
          <span className="text-lg font-medium opacity-90">{sub}</span>
        </div>
      </div>
    </Card>
  );
}