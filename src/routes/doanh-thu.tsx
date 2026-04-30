import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { Store, TrendingUp, Target, DollarSign } from "lucide-react";
import { ExportPdfButton } from "@/components/ExportPdfButton";

export const Route = createFileRoute("/doanh-thu")({
  component: DoanhThuPage,
  head: () => ({
    meta: [
      { title: "Doanh Thu Realtime — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Phân tích doanh thu realtime theo siêu thị và ngành hàng từ dữ liệu BI dán vào." },
    ],
  }),
});

function DoanhThuPage() {
  const [storeName, setStoreName] = useState("");
  const [target, setTarget] = useState("");
  const [raw, setRaw] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseTable(raw), [raw]);
  const summary = useMemo(() => {
    if (parsed.rows.length === 0) return null;
    // try to detect a "Tổng" row, else sum DTQĐ-like column
    const numCol = parsed.headers.find((h) => /DTQĐ|Doanh|Quy đổi|Số lượng/i.test(h)) ?? parsed.headers[1];
    const total = parsed.rows.reduce((s, r) => s + toNumber(r[numCol]), 0);
    const targetN = toNumber(target);
    const pct = targetN > 0 ? (total / targetN) * 100 : 0;
    return { numCol, total, targetN, pct, count: parsed.rows.length };
  }, [parsed, target]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Báo Cáo Doanh Thu Realtime</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán nội dung báo cáo từ BI để phân tích.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tên siêu thị</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="VD: ĐML 37 Cầu Diễn"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Target Quy Đổi (tr)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="VD: 1207"
                inputMode="decimal"
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <DataPasteCard
            title="Dán nội dung báo cáo DOANH THU (Realtime)"
            value={raw}
            onChange={setRaw}
            icon={<Store className="h-4 w-4" />}
            rows={10}
          />
        </div>

        {summary && (
          <>
            <div className="mt-6 flex justify-end">
              <ExportPdfButton
                getElements={() => [reportRef.current]}
                filename={`DoanhThu_${(storeName || "BaoCao").replace(/\s+/g, "_")}.pdf`}
              />
            </div>
            <div ref={reportRef}>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <StatCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Doanh thu"
                value={formatNumber(summary.total)}
                gradient="var(--gradient-info)"
              />
              <StatCard
                icon={<Target className="h-5 w-5" />}
                label="Mục tiêu"
                value={summary.targetN ? formatNumber(summary.targetN) : "—"}
                gradient="var(--gradient-warning)"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="% Hoàn thành"
                value={summary.targetN ? formatPercent(summary.pct) : "—"}
                gradient="var(--gradient-success)"
              />
              <StatCard
                icon={<Store className="h-5 w-5" />}
                label="Số dòng"
                value={String(summary.count)}
                gradient="var(--gradient-hero)"
              />
            </div>

            <Card className="mt-6 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-info">
                  {storeName || "Báo cáo doanh thu"}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {parsed.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {parsed.headers.map((h) => (
                          <td key={h} className="px-3 py-2">
                            {typeof r[h] === "number"
                              ? formatNumber(r[h] as number)
                              : (r[h] as string)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 p-4 text-white" style={{ background: gradient }}>
        <div className="rounded-md bg-white/20 p-2">{icon}</div>
        <div>
          <div className="text-xs font-medium opacity-90">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}