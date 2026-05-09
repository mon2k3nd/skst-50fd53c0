import { createFileRoute } from "@tanstack/react-router";
import { useSessionState } from "@/lib/useSessionState";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiReportSection } from "@/components/AiReportSection";

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
  const [storeName, setStoreName] = useSessionState("lk.storeName", "");
  const [endDate, setEndDate] = useSessionState("lk.endDate", "");
  const [raw, setRaw] = useSessionState("lk.raw", "");
  const [targetPct, setTargetPct] = useSessionState("lk.targetPct", 100);
  const presets = [100, 110, 120, 130, 140];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Báo Cáo Doanh Thu Luỹ Kế</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tên siêu thị</CardTitle></CardHeader>
            <CardContent>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="VD: TGDĐ 351 Cầu Giấy" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary" />
                Điều chỉnh Target: <span className="text-primary">{targetPct}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={targetPct}
                onChange={(e) => setTargetPct(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={targetPct === p ? "default" : "outline"}
                    onClick={() => setTargetPct(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
              <Input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="VD: 20/4/2026"
              />
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

        <AiReportSection
          raw={raw}
          kind="luy-ke"
          title="DOANH THU LUỸ KẾ"
          filenameBase="LuyKe"
          storeOverride={storeName || undefined}
          periodOverride={endDate ? `HẾT NGÀY: ${endDate}` : undefined}
          targetMultiplier={targetPct / 100}
        />
      </main>
    </div>
  );
}