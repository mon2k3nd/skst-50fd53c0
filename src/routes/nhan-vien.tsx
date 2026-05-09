import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  Sparkles,
  Loader2,
  ImageDown,
  Users,
  BarChart3,
  Store as StoreIcon,
} from "lucide-react";
import { EmpReportImage } from "@/components/EmpReportImage";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { downloadElementAsPng } from "@/lib/image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nhan-vien")({
  component: NhanVienPage,
  head: () => ({
    meta: [
      { title: "Thi Đua Nhân Viên — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Phân tích thi đua nhân viên theo từng ngành hàng." },
    ],
  }),
});

interface ParsedIndustry { name: string; unit: "DT" | "SL"; target: number | null; achieved_total: number | null; }
interface ParsedEmpAch { industry: string; value: number; }
interface ParsedEmployee { code?: string | null; name: string; achieved: ParsedEmpAch[]; }
interface ParsedData { store_name?: string | null; period_label?: string | null; industries: ParsedIndustry[]; employees: ParsedEmployee[]; }

function NhanVienPage() {
  const [block1, setBlock1] = useState("");
  const [block2, setBlock2] = useState("");
  const [block3, setBlock3] = useState("");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const lastSigRef = useRef<string>("");

  // Dialog state: idle | industries
  const [step, setStep] = useState<"idle" | "industries">("idle");

  // shareMatrix[empIdx][indIdx]
  const [shareMatrix, setShareMatrix] = useState<number[][]>([]);

  // Industry selection
  const [selectedInds, setSelectedInds] = useState<Set<number>>(new Set());

  // Render & download
  const [rendered, setRendered] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const indRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [pickedReports, setPickedReports] = useState<Set<string>>(new Set());

  async function runAi() {
    if (!shopName.trim()) {
      toast.error("Vui lòng nhập Tên Shop trước khi phân tích.");
      return;
    }
    if (!block1.trim() || !block2.trim() || !block3.trim()) {
      toast.error("Hãy dán đủ 3 ô dữ liệu.");
      return;
    }
    setBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("parse-thidua-nv", {
        body: { block1, block2, block3 },
      });
      if (error) throw error;
      if ((res as { error?: string })?.error) throw new Error((res as { error: string }).error);
      const p = res as ParsedData;
      // Override store with the user-entered shop name
      p.store_name = shopName.trim();
      setData(p);
      const empN = p.employees.length;
      const indN = p.industries.length;
      const equal = empN > 0 ? +(100 / empN).toFixed(2) : 0;
      setShareMatrix(Array.from({ length: empN }, () => Array(indN).fill(equal)));
      setSelectedInds(new Set(p.industries.map((_, i) => i)));
      setRendered(false);
      setStep("industries");
      toast.success(`AI xong: ${empN} NV × ${indN} ngành.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI lỗi.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoRun) return;
    if (!shopName.trim()) return;
    if (!block1.trim() || !block2.trim() || !block3.trim()) return;
    const sig = `${block1.length}|${block2.length}|${block3.length}|${block1.slice(0, 40)}|${block2.slice(0, 40)}|${block3.slice(0, 40)}`;
    if (sig === lastSigRef.current) return;
    const t = setTimeout(() => {
      lastSigRef.current = sig;
      runAi();
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block1, block2, block3, autoRun, shopName]);

  // Compute per-employee per-industry numbers
  const empSummary = useMemo(() => {
    if (!data) return [];
    return data.employees.map((emp, ei) => {
      const achMap = new Map<string, number>();
      emp.achieved.forEach((a) => achMap.set(a.industry, a.value));
      const perInd = data.industries.map((ind, ii) => {
        const sharePct = shareMatrix[ei]?.[ii] ?? 0;
        const target = ((ind.target ?? 0) * sharePct) / 100;
        const actual = achMap.get(ind.name) ?? 0;
        return { ind, sharePct, target, actual, pct: target > 0 ? (actual / target) * 100 : 0 };
      });
      const totalTarget = perInd.reduce((s, x) => s + x.target, 0);
      const totalActual = perInd.reduce((s, x) => s + x.actual, 0);
      const totalPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
      return { emp, perInd, totalTarget, totalActual, totalPct };
    });
  }, [data, shareMatrix]);

  // Date + projection helpers
  const todayInfo = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dd = String(dayOfMonth).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return {
      dateLabel: `${dd}/${mm}/${yyyy}`,
      ratio: daysInMonth / dayOfMonth,
    };
  }, [rendered]);

  // Selected industries to render (in order)
  const selectedIndList = useMemo(() => {
    if (!data) return [] as { idx: number; ind: ParsedIndustry }[];
    return data.industries
      .map((ind, idx) => ({ idx, ind }))
      .filter(({ idx }) => selectedInds.has(idx));
  }, [data, selectedInds]);

  // Per-industry rows (one table per selected industry)
  const perIndustryReports = useMemo(() => {
    return selectedIndList.map(({ idx, ind }) => ({
      ind,
      idx,
      rows: (() => {
        const base = empSummary.map((e) => {
          const pi = e.perInd[idx];
          const pct = pi.pct;
          const projectedPct = pi.target > 0 ? (pi.actual / pi.target) * todayInfo.ratio * 100 : 0;
          return {
            code: e.emp.code,
            name: e.emp.name,
            target: pi.target,
            actual: pi.actual,
            pct,
            projectedPct,
            dateLabel: todayInfo.dateLabel,
          };
        });
        // Sort best -> worst by projectedPct, then assign rank
        base.sort((a, b) => (b.projectedPct ?? 0) - (a.projectedPct ?? 0));
        return base.map((r, i) => ({ ...r, rank: i + 1 }));
      })(),
    }));
  }, [selectedIndList, empSummary, todayInfo]);

  // Top summary rows: each emp -> achieved x of N selected industries
  const summaryRows = useMemo(() => {
    const base = empSummary.map((e) => {
      let won = 0;
      selectedIndList.forEach(({ idx }) => {
        const pi = e.perInd[idx];
        const proj = pi && pi.target > 0 ? (pi.actual / pi.target) * todayInfo.ratio * 100 : 0;
        if (proj >= 100) won += 1;
      });
      const pct = selectedIndList.length > 0 ? (won / selectedIndList.length) * 100 : 0;
      return {
        code: e.emp.code,
        name: e.emp.name,
        target: won, // reuse field — will display as count
        actual: selectedIndList.length,
        pct,
        projectedPct: pct,
        dateLabel: todayInfo.dateLabel,
      };
    });
    base.sort((a, b) => b.pct - a.pct);
    return base.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [empSummary, selectedIndList, todayInfo]);

  function confirmIndustriesAndRender() {
    if (selectedInds.size === 0) {
      toast.error("Chọn ít nhất 1 ngành hàng.");
      return;
    }
    setRendered(true);
    setStep("idle");
    // Default-pick all reports for download
    const keys = ["summary", ...Array.from(selectedInds).map((i) => `ind-${i}`)];
    setPickedReports(new Set(keys));
  }

  async function downloadPicked() {
    const tasks: { ref: HTMLDivElement | null; name: string }[] = [];
    if (pickedReports.has("summary")) {
      tasks.push({ ref: summaryRef.current, name: "00_TongHop.png" });
    }
    selectedIndList.forEach(({ idx, ind }, i) => {
      if (pickedReports.has(`ind-${idx}`)) {
        const safe = ind.name.replace(/[^\p{L}\p{N}]+/gu, "_").slice(0, 40);
        tasks.push({ ref: indRefs.current[i], name: `${String(i + 1).padStart(2, "0")}_${safe}.png` });
      }
    });
    if (tasks.length === 0) {
      toast.error("Chưa chọn báo cáo nào.");
      return;
    }
    setDownloadOpen(false);
    for (const t of tasks) {
      try {
        await downloadElementAsPng(t.ref, t.name);
      } catch (e) {
        toast.error(`Lỗi: ${t.name}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl border bg-gradient-to-br from-brand/15 via-background to-brand/5 p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand">Thi Đua Nhân Viên</h1>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="accent-brand"
              />
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              AI tự chạy
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand">
                <StoreIcon className="h-3.5 w-3.5" /> Tên Shop (bắt buộc)
              </label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="VD: Siêu Thị Hải Phòng 1"
                maxLength={100}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <DataPasteCard
            title="① Thi đua siêu thị"
            value={block1}
            onChange={setBlock1}
            icon={<Trophy className="h-4 w-4" />}
            placeholder="Dán bảng thi đua siêu thị (luỹ kế)..."
            rows={9}
          />
          <DataPasteCard
            title="② Thi đua nhân viên"
            value={block2}
            onChange={setBlock2}
            icon={<Users className="h-4 w-4" />}
            placeholder="Dán bảng thi đua nhân viên..."
            rows={9}
          />
          <DataPasteCard
            title="③ Doanh thu nhân viên"
            value={block3}
            onChange={setBlock3}
            icon={<BarChart3 className="h-4 w-4" />}
            placeholder="Dán bảng doanh thu nhân viên..."
            rows={9}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={runAi} disabled={busy} className="bg-brand text-brand-foreground hover:bg-brand/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? "Đang phân tích..." : "Phân tích"}
          </Button>
        </div>

        {/* Rendered reports */}
        {rendered && data && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("industries")}>
                Chọn lại ngành hàng
              </Button>
              <Button onClick={() => setDownloadOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand/90">
                <ImageDown className="mr-2 h-4 w-4" /> Tải ảnh
              </Button>
              <ExportPdfButton
                getElements={() => [summaryRef.current, ...indRefs.current]}
                filename="ThiDua_NhanVien.pdf"
                label="Xuất PDF"
                variant="outline"
              />
            </div>

            <div className="overflow-x-auto rounded-lg bg-muted/30 p-4">
              <EmpReportImage
                ref={summaryRef}
                title="TỔNG HỢP THI ĐUA NHÂN VIÊN"
                store={data.store_name ?? undefined}
                period={data.period_label ?? undefined}
                summaryMode
                totalIndustries={selectedIndList.length}
                rows={summaryRows}
              />
            </div>

            {perIndustryReports.map((r, i) => (
              <div key={r.idx} className="overflow-x-auto rounded-lg bg-muted/30 p-4">
                <EmpReportImage
                  ref={(el) => {
                    indRefs.current[i] = el;
                  }}
                  title={r.ind.name.toUpperCase()}
                  store={data.store_name ?? undefined}
                  period={data.period_label ?? undefined}
                  unit={r.ind.unit}
                  rows={r.rows}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Industry picker */}
      <Dialog
        open={step === "industries"}
        onOpenChange={(o) => {
          if (!o) setStep("idle");
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand">Chọn ngành hàng cần phân tích</DialogTitle>
            <DialogDescription>
              Mỗi ngành hàng được chọn sẽ ra 1 bảng riêng.
            </DialogDescription>
          </DialogHeader>

          {data && (
            <div className="space-y-1">
              <div className="mb-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInds(new Set(data.industries.map((_, i) => i)))}
                >
                  Chọn tất cả
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedInds(new Set())}>
                  Bỏ chọn
                </Button>
              </div>
              {data.industries.map((ind, i) => {
                const checked = selectedInds.has(i);
                return (
                  <label
                    key={i}
                    className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setSelectedInds((s) => {
                          const ns = new Set(s);
                          if (v) ns.add(i);
                          else ns.delete(i);
                          return ns;
                        });
                      }}
                    />
                    <span className="flex-1 font-medium">{ind.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ind.unit} · target {ind.target ?? "—"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("idle")}>
              Đóng
            </Button>
            <Button
              onClick={confirmIndustriesAndRender}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              Tạo báo cáo ({selectedInds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download picker */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand">Chọn báo cáo cần tải</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2">
              <Checkbox
                checked={pickedReports.has("summary")}
                onCheckedChange={(v) => {
                  setPickedReports((s) => {
                    const ns = new Set(s);
                    if (v) ns.add("summary");
                    else ns.delete("summary");
                    return ns;
                  });
                }}
              />
              <span className="font-medium">Bảng tổng hợp</span>
            </label>
            {selectedIndList.map(({ idx, ind }) => {
              const key = `ind-${idx}`;
              return (
                <label
                  key={idx}
                  className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <Checkbox
                    checked={pickedReports.has(key)}
                    onCheckedChange={(v) => {
                      setPickedReports((s) => {
                        const ns = new Set(s);
                        if (v) ns.add(key);
                        else ns.delete(key);
                        return ns;
                      });
                    }}
                  />
                  <span className="font-medium">{ind.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{ind.unit}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={downloadPicked} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <ImageDown className="mr-2 h-4 w-4" /> Tải ({pickedReports.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
