import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store } from "lucide-react";
import { AiReportSection } from "@/components/AiReportSection";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Báo Cáo Doanh Thu Realtime</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dán nội dung báo cáo từ BI để AI phân tích.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tên siêu thị</CardTitle></CardHeader>
            <CardContent>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ví dụ Nhập TGDĐ 351 Cầu Giấy" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Target Quy Đổi (tr) — tuỳ chọn</CardTitle></CardHeader>
            <CardContent>
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Ví dụ Nhập TGDĐ 351 Cầu Giấy" inputMode="decimal" />
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

        <AiReportSection
          raw={raw}
          kind="doanh-thu"
          title="DOANH THU REALTIME"
          filenameBase="DoanhThu"
          storeOverride={storeName || undefined}
        />
      </main>
    </div>
  );
}