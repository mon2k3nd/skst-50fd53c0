import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { BarChart3, TrendingUp, Calendar, Percent } from "lucide-react";

export const Route = createFileRoute("/luy-ke")({
  component: LuyKePage,
  head: () => ({
    meta: [
      { title: "Báo Cáo Doanh Thu Luỹ Kế — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Báo cáo doanh thu luỹ kế, lãi gộp, tỷ trọng trả chậm theo ngành hàng." },
    ],
  }),
});

function LuyKePage() {
  const [storeName, setStoreName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseTable(raw), [raw]);

  const summary = useMemo(() => {
    if (parsed.rows.length === 0) return null;
    const totalRow =
      parsed.rows.find((r) => String(Object.values(r)[0]).match(/Tổng|Total/i)) ?? null;
    const dtCol =
      parsed.headers.find((h) => /DTQĐ|Doanh thu|Quy đổi/i.test(h)) ?? parsed.headers[1];
    const targetCol = parsed.headers.find((h) => /Target/i.test(h)) ?? "";
    const htCol = parsed.headers.find((h) => /% HT|Hoàn thành/i.test(h)) ?? "";
    const traChamCol = parsed.headers.find((h) => /Trả chậm|Trả Góp/i.test(h)) ?? "";

    const dt = totalRow ? toNumber(totalRow[dtCol]) : parsed.rows.reduce((s, r) => s + toNumber(r[dtCol]), 0);
    const target = totalRow && targetCol ? toNumber(totalRow[targetCol]) : 0;
    const ht = totalRow && htCol ? toNumber(totalRow[htCol]) : target ? (dt / target) * 100 : 0;
    const traCham = totalRow && traChamCol ? toNumber(totalRow[traChamCol]) : 0;

    return { dt, target, ht, traCham, dtCol, htCol, targetCol };
  }, [parsed]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Báo Cáo Doanh Thu Luỹ Kế</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tên siêu thị</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="VD: ĐML 37 Cầu Diễn" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hết ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="VD: 7/12/2025" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <DataPasteCard
            title="Dán nội dung báo cáo DOANH THU (Luỹ Kế)"
            value={raw}
            onChange={setRaw}
            icon={<BarChart3 className="h-4 w-4" />}
            rows={10}
          />
        </div>

        {summary && (
          <>
            <Card className="mt-6 border-2 shadow-[var(--shadow-elevated)]">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-extrabold text-info">
                  BÁO CÁO DOANH THU LUỸ KẾ
                </CardTitle>
                <div className="mx-auto mt-2 inline-block rounded-md bg-info px-4 py-1 text-sm font-bold text-white">
                  {storeName || "—"}
                </div>
                {endDate && (
                  <div className="mt-2 text-xs text-muted-foreground">HẾT NGÀY: {endDate}</div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <KpiBlock color="bg-destructive/10 text-destructive" label="Doanh thu" value={formatNumber(summary.dt)} icon={<TrendingUp className="h-4 w-4" />} />
                  <KpiBlock color="bg-info/10 text-info" label="Mục tiêu" value={summary.target ? formatNumber(summary.target) : "—"} icon={<Calendar className="h-4 w-4" />} />
                  <KpiBlock color="bg-warning/15 text-warning" label="% Hoàn thành" value={summary.ht ? formatPercent(summary.ht) : "—"} icon={<Percent className="h-4 w-4" />} />
                  <KpiBlock color="bg-success/15 text-success" label="Tỷ trọng trả chậm" value={summary.traCham ? formatPercent(summary.traCham) : "—"} icon={<BarChart3 className="h-4 w-4" />} />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Chi tiết theo ngành hàng</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {parsed.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {parsed.headers.map((h) => (
                          <td key={h} className="px-3 py-2">
                            {typeof r[h] === "number" ? formatNumber(r[h] as number) : (r[h] as string)}
                          </td>
                        ))}
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

function KpiBlock({ color, label, value, icon }: { color: string; label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase">
        {icon} {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}