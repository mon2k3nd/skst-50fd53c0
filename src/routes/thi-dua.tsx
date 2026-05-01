import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Trophy } from "lucide-react";
import { AiReportSection } from "@/components/AiReportSection";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Thi Đua Siêu Thị</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dán bảng thi đua theo ngành hàng để AI phân tích & xuất ảnh báo cáo.</p>

        <div className="mt-6">
          <DataPasteCard
            title="Dán nội dung báo cáo THI ĐUA"
            value={raw}
            onChange={setRaw}
            icon={<Trophy className="h-4 w-4" />}
            rows={10}
          />
        </div>

        <AiReportSection
          raw={raw}
          kind="thi-dua"
          title="THI ĐUA NGÀNH HÀNG"
          filenameBase="ThiDua"
        />
      </main>
    </div>
  );
}