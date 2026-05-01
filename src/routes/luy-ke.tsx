import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BarChart3 } from "lucide-react";
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
  const [storeName, setStoreName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [raw, setRaw] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Báo Cáo Doanh Thu Luỹ Kế</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tên siêu thị</CardTitle></CardHeader>
            <CardContent>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="VD: ĐML 37 Cầu Diễn" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Hết ngày</CardTitle></CardHeader>
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

        <AiReportSection
          raw={raw}
          kind="luy-ke"
          title="DOANH THU LUỸ KẾ"
          filenameBase="LuyKe"
          storeOverride={storeName || undefined}
          periodOverride={endDate ? `HẾT NGÀY: ${endDate}` : undefined}
        />
      </main>
    </div>
  );
}