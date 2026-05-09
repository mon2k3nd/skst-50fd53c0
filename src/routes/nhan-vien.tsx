import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  Target,
  Lock,
  LockOpen,
  RotateCcw,
} from "lucide-react";
import { EmpReportImage, EmpSummaryMatrixImage, type EmpSummaryRow } from "@/components/EmpReportImage";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { downloadElementAsPng } from "@/lib/image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessionState } from "@/lib/useSessionState";

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
interface ParsedEmployee { code?: string | null; name: string; achieved: ParsedEmpAch[]; targets?: ParsedEmpAch[]; }
interface ParsedData { store_name?: string | null; period_label?: string | null; industries: ParsedIndustry[]; employees: ParsedEmployee[]; }

type Step = "idle" | "industries" | "targets";

function NhanVienPage() {
  const [storeName, setStoreName] = useSessionState("nv.storeName", "");
  const [block1, setBlock1] = useSessionState("nv.block1", "");
  const [block2, setBlock2] = useSessionState("nv.block2", "");
  const [block3, setBlock3] = useSessionState("nv.block3", "");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const lastSigRef = useRef<string>("");

  const [step, setStep] = useState<Step>("idle");

  // Per-employee share (single vector, applied to ALL industries). Sum = 100.
  const [empShares, setEmpShares] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean[]>([]);

  const [selectedInds, setSelectedInds] = useState<Set<number>>(new Set());

  const [rendered, setRendered] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const indRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [pickedReports, setPickedReports] = useState<Set<string>>(new Set());

  // Hydration-safe date (client only)
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);
  const daysInMonth = today ? new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() : 30;
  const dayOfMonth = today ? today.getDate() : 1;
  const todayLabel = today
    ? `${String(dayOfMonth).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
    : "—";

  async function runAi() {
    if (!storeName.trim()) {
      toast.error("Nhập tên cửa hàng trước (vd: TGDĐ 351 Cầu Giấy).");
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
      setData(p);
      const empN = p.employees.length;
      const eq = empN > 0 ? +(100 / empN).toFixed(2) : 0;
      setEmpShares(Array(empN).fill(eq));
      setLocked(Array(empN).fill(false));
      setSelectedInds(new Set(p.industries.map((_, i) => i)));
      setRendered(false);
      setStep("industries");
      toast.success(`AI xong: ${empN} NV × ${p.industries.length} ngành.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI lỗi.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoRun) return;
    if (!block1.trim() || !block2.trim() || !block3.trim()) return;
    const sig = `${block1.length}|${block2.length}|${block3.length}|${block1.slice(0, 40)}|${block2.slice(0, 40)}|${block3.slice(0, 40)}`;
    if (sig === lastSigRef.current) return;
    const t = setTimeout(() => {
      lastSigRef.current = sig;
      runAi();
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block1, block2, block3, autoRun]);

  /** Update one employee's share. Lock that employee. Redistribute delta across UNLOCKED others proportionally. */
  function updateShare(idx: number, raw: number) {
    setEmpShares((prev) => {
      const n = prev.length;
      if (n === 0) return prev;
      const next = [...prev];
      const newVal = Math.max(0, Math.min(100, +raw.toFixed(2)));
      const delta = newVal - next[idx];
      next[idx] = newVal;

      // others available = unlocked AND not idx
      const others: number[] = [];
      for (let i = 0; i < n; i++) {
        if (i !== idx && !locked[i]) others.push(i);
      }

      if (others.length === 0) {
        // nothing to redistribute → keep sum off; clamp to 100 by giving rest to nothing
        return next;
      }

      // Distribute -delta proportional to current weights of others
      const sumOthers = others.reduce((s, i) => s + next[i], 0);
      if (sumOthers + (-delta) <= 0 || sumOthers === 0) {
        // fall back to equal distribution
        const target = Math.max(0, sumOthers - delta);
        const per = +(target / others.length).toFixed(2);
        others.forEach((i) => (next[i] = per));
      } else {
        const factor = (sumOthers - delta) / sumOthers;
        others.forEach((i) => (next[i] = Math.max(0, +(next[i] * factor).toFixed(2))));
      }

      // Re-normalize all-unlocked to make total exactly 100 (including idx since user just set it but we lock it after)
      // We treat idx+locked as fixed.
      const fixedSum = next.reduce((s, v, i) => (i === idx || locked[i] ? s + v : s), 0);
      const remaining = Math.max(0, 100 - fixedSum);
      const adjustable = others;
      const adjSum = adjustable.reduce((s, i) => s + next[i], 0);
      if (adjustable.length > 0) {
        if (adjSum > 0) {
          const k = remaining / adjSum;
          adjustable.forEach((i) => (next[i] = +(next[i] * k).toFixed(2)));
        } else {
          const per = +(remaining / adjustable.length).toFixed(2);
          adjustable.forEach((i) => (next[i] = per));
        }
      }
      return next;
    });
    // mark this employee as locked after manual edit
    setLocked((l) => l.map((v, i) => (i === idx ? true : v)));
  }

  function toggleLock(idx: number) {
    setLocked((l) => l.map((v, i) => (i === idx ? !v : v)));
  }

  function resetShares() {
    const n = empShares.length;
    if (n === 0) return;
    const eq = +(100 / n).toFixed(2);
    setEmpShares(Array(n).fill(eq));
    setLocked(Array(n).fill(false));
  }

  const sharesTotal = useMemo(() => empShares.reduce((s, v) => s + v, 0), [empShares]);

  // Per-employee per-industry numbers using empShares.
  const empSummary = useMemo(() => {
    if (!data) return [];
    return data.employees.map((emp, ei) => {
      const sharePct = empShares[ei] ?? 0;
      const achMap = new Map<string, number>();
      emp.achieved.forEach((a) => achMap.set(a.industry, a.value));
      const perInd = data.industries.map((ind) => {
        const monthlyTarget = (ind.target ?? 0) * daysInMonth; // tổng target tháng của ngành
        const target = monthlyTarget * (sharePct / 100);
        const actual = achMap.get(ind.name) ?? 0;
        const pct = target > 0 ? (actual / target) * 100 : 0;
        const projectedActual = dayOfMonth > 0 ? (actual / dayOfMonth) * daysInMonth : actual;
        const projectedPct = target > 0 ? (projectedActual / target) * 100 : 0;
        return { ind, target, actual, pct, projectedPct };
      });
      return { emp, perInd };
    });
  }, [data, empShares, daysInMonth, dayOfMonth]);

  const selectedIndList = useMemo(() => {
    if (!data) return [] as { idx: number; ind: ParsedIndustry }[];
    return data.industries
      .map((ind, idx) => ({ idx, ind }))
      .filter(({ idx }) => selectedInds.has(idx));
  }, [data, selectedInds]);

  const perIndustryReports = useMemo(() => {
    return selectedIndList.map(({ idx, ind }) => ({
      ind,
      idx,
      rows: empSummary.map((e) => {
        const pi = e.perInd[idx];
        return {
          code: e.emp.code,
          name: e.emp.name,
          target: pi.target,
          actual: pi.actual,
          pct: pi.pct,
          projectedPct: pi.projectedPct,
        };
      }),
    }));
  }, [selectedIndList, empSummary]);

  const summaryRows: EmpSummaryRow[] = useMemo(() => {
    return empSummary.map((e) => {
      const cells = selectedIndList.map(({ idx, ind }) => {
        const pi = e.perInd[idx];
        return { name: ind.name, unit: ind.unit, pct: pi.pct, achieved: pi.actual };
      });
      const totalAchieved = cells.reduce((s, c) => s + c.achieved, 0);
      const totalTarget = selectedIndList.reduce((s, { idx }) => s + (e.perInd[idx].target || 0), 0);
      const totalPct = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
      return {
        code: e.emp.code,
        name: e.emp.name,
        totalAchieved,
        totalPct,
        perInd: cells,
      };
    });
  }, [empSummary, selectedIndList]);

  function nextFromIndustries() {
    if (selectedInds.size === 0) {
      toast.error("Chọn ít nhất 1 ngành hàng.");
      return;
    }
    setStep("targets");
  }

  function confirmTargetsAndRender() {
    setRendered(true);
    setStep("idle");
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
      } catch {
        toast.error(`Lỗi: ${t.name}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl border bg-gradient-to-br from-brand/15 via-background to-brand/5 p-5 shadow-card transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand">Thi Đua Nhân Viên</h1>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-background">
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
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <DataPasteCard title="① Thi đua siêu thị" value={block1} onChange={setBlock1} icon={<Trophy className="h-4 w-4" />} placeholder="Dán bảng thi đua siêu thị (luỹ kế)..." rows={9} />
          <DataPasteCard title="② Thi đua nhân viên" value={block2} onChange={setBlock2} icon={<Users className="h-4 w-4" />} placeholder="Dán bảng thi đua nhân viên..." rows={9} />
          <DataPasteCard title="③ Doanh thu nhân viên" value={block3} onChange={setBlock3} icon={<BarChart3 className="h-4 w-4" />} placeholder="Dán bảng doanh thu nhân viên..." rows={9} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Tên cửa hàng (vd: TGDĐ 351 Cầu Giấy)"
            className="h-9 min-w-[280px] flex-1 rounded-md border bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
            Ngày báo cáo: <strong>{todayLabel}</strong> ({dayOfMonth}/{daysInMonth})
          </span>
          <Button onClick={runAi} disabled={busy} className="bg-brand text-brand-foreground transition hover:bg-brand/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? "Đang phân tích..." : "Phân tích"}
          </Button>
        </div>

        {rendered && data && (
          <div className="mt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("industries")}>
                Chọn lại ngành hàng
              </Button>
              <Button variant="outline" onClick={() => setStep("targets")}>
                <Target className="mr-2 h-4 w-4" /> Chỉnh target NV
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

            <div className="overflow-x-auto rounded-xl border bg-muted/30 p-4 shadow-card">
              <EmpSummaryMatrixImage
                ref={summaryRef}
                title="TỔNG HỢP THI ĐUA NHÂN VIÊN"
                store={storeName || data.store_name || undefined}
                period={`Ngày ${todayLabel} · ${dayOfMonth}/${daysInMonth} ngày${data.period_label ? ` · ${data.period_label}` : ""}`}
                industries={selectedIndList.map(({ ind }) => ({ name: ind.name, unit: ind.unit }))}
                rows={summaryRows}
              />
            </div>

            {perIndustryReports.map((r, i) => (
              <div key={r.idx} className="overflow-x-auto rounded-xl border bg-muted/30 p-4 shadow-card">
                <EmpReportImage
                  ref={(el) => {
                    indRefs.current[i] = el;
                  }}
                  title={r.ind.name.toUpperCase()}
                  store={storeName || data.store_name || undefined}
                  period={`Ngày ${todayLabel} · ${dayOfMonth}/${daysInMonth} ngày${data.period_label ? ` · ${data.period_label}` : ""}`}
                  unit={r.ind.unit}
                  rows={r.rows}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Step 1: Industries */}
      <Dialog open={step === "industries"} onOpenChange={(o) => { if (!o) setStep("idle"); }}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand">Chọn ngành hàng cần phân tích</DialogTitle>
            <DialogDescription>Mỗi ngành hàng được chọn sẽ ra 1 bảng riêng.</DialogDescription>
          </DialogHeader>

          {data && (
            <div className="space-y-1">
              <div className="mb-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedInds(new Set(data.industries.map((_, i) => i)))}>Chọn tất cả</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedInds(new Set())}>Bỏ chọn</Button>
              </div>
              {data.industries.map((ind, i) => {
                const checked = selectedInds.has(i);
                return (
                  <label key={i} className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2 transition hover:bg-muted/60">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setSelectedInds((s) => {
                          const ns = new Set(s);
                          if (v) ns.add(i); else ns.delete(i);
                          return ns;
                        });
                      }}
                    />
                    <span className="flex-1 font-medium">{ind.name}</span>
                    <span className="text-xs text-muted-foreground">{ind.unit} · target {ind.target ?? "—"}</span>
                  </label>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("idle")}>Đóng</Button>
            <Button onClick={nextFromIndustries} className="bg-brand text-brand-foreground hover:bg-brand/90">
              Tiếp · Chia target ({selectedInds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Targets */}
      <Dialog open={step === "targets"} onOpenChange={(o) => { if (!o) setStep("idle"); }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand flex items-center gap-2">
              <Target className="h-5 w-5" /> Chia target cho nhân viên
            </DialogTitle>
            <DialogDescription>
              Tổng = 100%. Mặc định chia đều. Khi chỉnh 1 NV, các NV chưa khoá sẽ tự co/giãn để giữ tổng = 100. NV đã chỉnh tay sẽ tự khoá — bấm 🔒 để mở khoá. Tỉ lệ này áp dụng cho tất cả ngành hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-3 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <div>
              Tổng:{" "}
              <strong className={Math.abs(sharesTotal - 100) < 0.5 ? "text-brand" : "text-destructive"}>
                {sharesTotal.toFixed(1)}%
              </strong>
              <span className="ml-2 text-muted-foreground">(cần ≈ 100%)</span>
            </div>
            <Button size="sm" variant="outline" onClick={resetShares}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Chia đều lại
            </Button>
          </div>

          {data && (
            <div className="space-y-2">
              {data.employees.map((emp, i) => {
                const v = empShares[i] ?? 0;
                const isLocked = locked[i];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition ${
                      isLocked ? "ring-1 ring-brand/40" : "hover:bg-muted/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLock(i)}
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                        isLocked ? "bg-brand text-brand-foreground border-brand" : "bg-background hover:bg-muted"
                      }`}
                      title={isLocked ? "Bỏ khoá" : "Khoá"}
                    >
                      {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                    </button>
                    <div className="min-w-[180px] flex-shrink-0 text-sm font-medium">
                      {emp.code ? <span className="text-muted-foreground">{emp.code} · </span> : null}
                      {emp.name}
                    </div>
                    <div className="flex-1">
                      <Slider
                        value={[v]}
                        min={0}
                        max={100}
                        step={0.5}
                        onValueChange={(arr) => updateShare(i, arr[0])}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={v}
                        onChange={(e) => updateShare(i, parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 rounded-md border bg-background px-2 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("industries")}>← Quay lại</Button>
            <Button onClick={confirmTargetsAndRender} className="bg-brand text-brand-foreground hover:bg-brand/90">
              Tạo báo cáo
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
            <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2 transition hover:bg-muted/50">
              <Checkbox
                checked={pickedReports.has("summary")}
                onCheckedChange={(v) => {
                  setPickedReports((s) => {
                    const ns = new Set(s);
                    if (v) ns.add("summary"); else ns.delete("summary");
                    return ns;
                  });
                }}
              />
              <span className="font-medium">Bảng tổng hợp</span>
            </label>
            {selectedIndList.map(({ idx, ind }) => {
              const key = `ind-${idx}`;
              return (
                <label key={idx} className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2 transition hover:bg-muted/50">
                  <Checkbox
                    checked={pickedReports.has(key)}
                    onCheckedChange={(v) => {
                      setPickedReports((s) => {
                        const ns = new Set(s);
                        if (v) ns.add(key); else ns.delete(key);
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
            <Button variant="outline" onClick={() => setDownloadOpen(false)}>Huỷ</Button>
            <Button onClick={downloadPicked} className="bg-brand text-brand-foreground hover:bg-brand/90">
              <ImageDown className="mr-2 h-4 w-4" /> Tải ({pickedReports.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
