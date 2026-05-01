import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { BarChart3, TrendingUp, Calendar, Percent, Sparkles, ImageDown, Loader2 } from "lucide-react";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { Button } from "@/components/ui/button";
import { ReportImage, type BiReport } from "@/components/ReportImage";
import { downloadElementAsPng } from "@/lib/image";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const reportRef = useRef<HTMLDivElement>(null);
  const aiImageRef = useRef<HTMLDivElement>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReport, setAiReport] = useState<BiReport | null>(null);
  const [pngBusy, setPngBusy] = useState(false);

  async function runAi() {
    if (!raw.trim()) {
      toast.error("Hãy dán nội dung báo cáo trước.");
      return;
    }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-bi", {
        body: { text: raw },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setAiReport(data as BiReport);
      toast.success("AI đã phân tích xong.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không phân tích được dữ liệu.");
    } finally {
      setAiBusy(false);
    }
  }

  async function downloadPng() {
    setPngBusy(true);
    try {
      const fname = `LuyKe_${(storeName || aiReport?.store_name || "BaoCao").replace(/\s+/g, "_")}.png`;
      await downloadElementAsPng(aiImageRef.current, fname);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải ảnh được.");
    } finally {
      setPngBusy(false);
    }
  }

  const summary = useMemo(() => {
    if (parsed.rows.length === 0) return null;
    // Find the "Tổng / Total" row by scanning ALL string cells (not just first column)
    const totalRow =
      parsed.rows.find((r) =>
        Object.values(r).some(
          (v) => typeof v === "string" && /^\s*(tổng|tong|total|t\.cộng|cộng)/i.test(v),
        ),
      ) ?? null;
    const dtCol =
      parsed.headers.find((h) => /DTQĐ|Doanh thu|Quy đổi/i.test(h)) ?? parsed.headers[1];
    const targetCol = parsed.headers.find((h) => /Target/i.test(h)) ?? "";
    const htCol = parsed.headers.find((h) => /% HT|Hoàn thành/i.test(h)) ?? "";
    const traChamCol = parsed.headers.find((h) => /Trả chậm|Trả Góp/i.test(h)) ?? "";

    // Only fall back to summing if we have NO total row at all.
    const dt = totalRow
      ? toNumber(totalRow[dtCol])
      : parsed.rows.reduce((s, r) => s + toNumber(r[dtCol]), 0);
    const target =
      totalRow && targetCol
        ? toNumber(totalRow[targetCol])
        : targetCol
          ? parsed.rows.reduce((s, r) => s + toNumber(r[targetCol]), 0)
          : 0;
    const ht =
      totalRow && htCol
        ? toNumber(totalRow[htCol])
        : target
          ? (dt / target) * 100
          : 0;
    const traCham = totalRow && traChamCol ? toNumber(totalRow[traChamCol]) : 0;

    return { dt, target, ht, traCham, dtCol, htCol, targetCol, hasTotalRow: !!totalRow };
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={runAi} disabled={aiBusy || !raw.trim()}>
            {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {aiBusy ? "Đang phân tích..." : "Phân tích bằng AI & tạo ảnh báo cáo"}
          </Button>
          <span className="text-xs text-muted-foreground">
            AI sẽ tự bỏ menu / chữ thừa và xuất ảnh báo cáo giống mẫu.
          </span>
        </div>

        {aiReport && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap justify-end gap-2">
              <Button variant="default" onClick={downloadPng} disabled={pngBusy}>
                {pngBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
                {pngBusy ? "Đang tải..." : "Tải ảnh PNG"}
              </Button>
              <ExportPdfButton
                getElements={() => [aiImageRef.current]}
                filename={`LuyKe_${(storeName || aiReport.store_name || "BaoCao").replace(/\s+/g, "_")}.pdf`}
                label="Xuất PDF"
                variant="outline"
              />
            </div>
            <div className="overflow-x-auto rounded-lg bg-muted/30 p-4">
              <ReportImage
                ref={aiImageRef}
                report={aiReport}
                storeOverride={storeName || undefined}
                periodOverride={endDate ? `HẾT NGÀY: ${endDate}` : undefined}
              />
            </div>
          </div>
        )}

        {summary && (
          <>
            <div className="mt-6 flex justify-end">
              <ExportPdfButton
                getElements={() => [reportRef.current]}
                filename={`LuyKe_${(storeName || "BaoCao").replace(/\s+/g, "_")}.pdf`}
              />
            </div>
            {!summary.hasTotalRow && (
              <div className="mt-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
                ⚠ Không tìm thấy dòng "Tổng" trong dữ liệu — số liệu tổng quan đang được cộng từ các dòng ngành hàng. Hãy dán bảng có dòng Tổng để kết quả chính xác.
              </div>
            )}
            <div ref={reportRef}>
            <Card className="mt-4 border-2 shadow-[var(--shadow-elevated)]">
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
            </div>
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