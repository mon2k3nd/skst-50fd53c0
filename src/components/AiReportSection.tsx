import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ImageDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ReportImage, type BiReport } from "@/components/ReportImage";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { downloadElementAsPng } from "@/lib/image";

interface Props {
  raw: string;
  kind: "luy-ke" | "doanh-thu" | "thi-dua" | "nhan-vien";
  title: string;
  firstColLabel?: string;
  filenameBase: string;
  storeOverride?: string;
  periodOverride?: string;
}

export function AiReportSection({ raw, kind, title, firstColLabel, filenameBase, storeOverride, periodOverride }: Props) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [pngBusy, setPngBusy] = useState(false);
  const [report, setReport] = useState<BiReport | null>(null);

  async function runAi() {
    if (!raw.trim()) {
      toast.error("Hãy dán nội dung báo cáo trước.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-bi", {
        body: { text: raw, kind },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setReport(data as BiReport);
      toast.success("AI đã phân tích xong.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không phân tích được dữ liệu.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadPng() {
    setPngBusy(true);
    try {
      const fname = `${filenameBase}_${(storeOverride || report?.store_name || "BaoCao").replace(/\s+/g, "_")}.png`;
      await downloadElementAsPng(imageRef.current, fname);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải ảnh được.");
    } finally {
      setPngBusy(false);
    }
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={runAi} disabled={busy || !raw.trim()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {busy ? "Đang phân tích..." : "Phân tích bằng AI & tạo ảnh báo cáo"}
        </Button>
        <span className="text-xs text-muted-foreground">
          AI sẽ tự bỏ menu / chữ thừa và xuất ảnh báo cáo giống mẫu.
        </span>
      </div>

      {report && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <Button variant="default" onClick={downloadPng} disabled={pngBusy}>
              {pngBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
              {pngBusy ? "Đang tải..." : "Tải ảnh PNG"}
            </Button>
            <ExportPdfButton
              getElements={() => [imageRef.current]}
              filename={`${filenameBase}_${(storeOverride || report.store_name || "BaoCao").replace(/\s+/g, "_")}.pdf`}
              label="Xuất PDF"
              variant="outline"
            />
          </div>
          <div className="overflow-x-auto rounded-lg bg-muted/30 p-4">
            <ReportImage
              ref={imageRef}
              report={report}
              storeOverride={storeOverride}
              periodOverride={periodOverride}
              title={title}
              firstColLabel={firstColLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}