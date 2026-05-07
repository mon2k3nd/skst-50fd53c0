import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trophy, Sparkles, Loader2, ImageDown, ChevronDown, ChevronUp, Users, BarChart3, Target } from "lucide-react";
import { ReportImage, type BiReport } from "@/components/ReportImage";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { downloadElementAsPng } from "@/lib/image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nhan-vien")({
  component: NhanVienPage,
  head: () => ({
    meta: [
      { title: "Thi Đua Nhân Viên — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Dán 3 khối dữ liệu thi đua, AI phân tích & chia target từng nhân viên." },
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
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);
  // shareMatrix[empIdx][indIdx] = % share (0..100+) on that industry's target
  const [shareMatrix, setShareMatrix] = useState<number[][]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const [pngBusy, setPngBusy] = useState(false);

  async function runAi() {
    if (!block1.trim() || !block2.trim() || !block3.trim()) {
      toast.error("Hãy dán đủ cả 3 ô dữ liệu.");
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
      // init: chia đều
      const empN = p.employees.length;
      const indN = p.industries.length;
      const equal = empN > 0 ? +(100 / empN).toFixed(2) : 0;
      const matrix = Array.from({ length: empN }, () => Array(indN).fill(equal));
      setShareMatrix(matrix);
      setExpanded({});
      toast.success(`AI phân tích xong: ${empN} NV × ${indN} ngành hàng.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI lỗi.");
    } finally {
      setBusy(false);
    }
  }

  // % tổng = trung bình theo target (weight). Đơn giản: trung bình các % theo trọng số target.
  const empSummary = useMemo(() => {
    if (!data) return [];
    return data.employees.map((emp, ei) => {
      // achieved theo từng ngành hàng (map theo tên)
      const achMap = new Map<string, number>();
      emp.achieved.forEach((a) => achMap.set(a.industry, a.value));
      let totalTarget = 0;
      let totalActual = 0;
      const perInd = data.industries.map((ind, ii) => {
        const sharePct = shareMatrix[ei]?.[ii] ?? 0;
        const target = ((ind.target ?? 0) * sharePct) / 100;
        const actual = achMap.get(ind.name) ?? 0;
        totalTarget += target;
        totalActual += actual;
        return { ind, sharePct, target, actual, pct: target > 0 ? (actual / target) * 100 : 0 };
      });
      const totalPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
      return { emp, perInd, totalTarget, totalActual, totalPct };
    });
  }, [data, shareMatrix]);

  // Tổng share toàn đội theo từng ngành hàng (có thể >100)
  const indShareSum = useMemo(() => {
    if (!data) return [];
    return data.industries.map((_, ii) =>
      shareMatrix.reduce((s, row) => s + (row[ii] ?? 0), 0),
    );
  }, [data, shareMatrix]);

  function setEmpTotalShare(empIdx: number, newTotal: number) {
    setShareMatrix((mat) => {
      const row = [...(mat[empIdx] ?? [])];
      const oldTotal = row.reduce((s, v) => s + v, 0);
      if (oldTotal <= 0) {
        const each = newTotal / row.length;
        const newRow = row.map(() => +each.toFixed(2));
        return mat.map((r, i) => (i === empIdx ? newRow : r));
      }
      const ratio = newTotal / oldTotal;
      const newRow = row.map((v) => +(v * ratio).toFixed(2));
      return mat.map((r, i) => (i === empIdx ? newRow : r));
    });
  }

  function setEmpIndShare(empIdx: number, indIdx: number, val: number) {
    setShareMatrix((mat) =>
      mat.map((r, i) => (i === empIdx ? r.map((v, j) => (j === indIdx ? +val.toFixed(2) : v)) : r)),
    );
  }

  // Build BiReport for visual export
  const biReport: BiReport | null = useMemo(() => {
    if (!data || empSummary.length === 0) return null;
    const winners = empSummary.filter((e) => e.totalPct >= 100).length;
    const totalActual = empSummary.reduce((s, e) => s + e.totalActual, 0);
    const totalTarget = empSummary.reduce((s, e) => s + e.totalTarget, 0);
    return {
      store_name: data.store_name ?? `${winners}/${empSummary.length} NV về đích`,
      period_label: data.period_label ?? "",
      kpis: {
        doanh_thu: totalActual || null,
        muc_tieu: totalTarget || null,
        pct_hoan_thanh: totalTarget ? (totalActual / totalTarget) * 100 : null,
        du_kien_thang: null, cung_ky: null, du_kien_ht_lntt: null,
        tra_cham_hien_tai: null, tra_cham_target: null, lai_gop: null,
      },
      industries: empSummary.map((e) => ({
        ten: `${e.emp.code ? e.emp.code + " - " : ""}${e.emp.name}`,
        sl: null,
        dtqd: e.totalActual || null,
        lai_gop: e.totalTarget || null,
        cung_ky_pct: e.totalPct || null,
        don_gia: Math.max(0, e.totalTarget - e.totalActual) || null,
        tra_cham_pct: null,
      })),
    };
  }, [data, empSummary]);

  async function downloadPng() {
    setPngBusy(true);
    try {
      await downloadElementAsPng(reportRef.current, "ThiDua_NhanVien.png");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải ảnh được.");
    } finally {
      setPngBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Thi Đua Nhân Viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán 3 khối dữ liệu (Thi đua siêu thị, Thi đua nhân viên, Doanh thu nhân viên). AI sẽ phân tích & cho bạn chia target từng nhân viên bằng thanh kéo.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <DataPasteCard
            title="① Thi đua siêu thị (luỹ kế)"
            value={block1}
            onChange={setBlock1}
            icon={<Trophy className="h-4 w-4" />}
            placeholder="Dán bảng 'thi đua siêu thị lũy kế'..."
            rows={10}
          />
          <DataPasteCard
            title="② Thi đua nhân viên (pivot)"
            value={block2}
            onChange={setBlock2}
            icon={<Users className="h-4 w-4" />}
            placeholder="Dán bảng 'thi đua nhân viên'..."
            rows={10}
          />
          <DataPasteCard
            title="③ Doanh thu nhân viên"
            value={block3}
            onChange={setBlock3}
            icon={<BarChart3 className="h-4 w-4" />}
            placeholder="Dán bảng 'doanh thu nhân viên'..."
            rows={10}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={runAi} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? "Đang phân tích..." : "Phân tích bằng AI"}
          </Button>
        </div>

        {data && (
          <Card className="mt-6 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-info">
                <Target className="h-4 w-4" /> Chia Target cho từng nhân viên
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Thanh kéo "Tổng" sẽ scale toàn bộ ngành hàng theo tỉ lệ. Nhấn ▾ để chỉnh chi tiết từng ngành hàng. Tổng các % của tất cả NV có thể vượt 100%.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Tổng share theo ngành hàng */}
              <div className="rounded-md bg-muted/40 p-3 text-xs">
                <div className="mb-1 font-semibold">Tổng % share theo ngành hàng (toàn đội):</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {data.industries.map((ind, ii) => {
                    const sum = indShareSum[ii] ?? 0;
                    const color = sum > 100 ? "text-emerald-600" : sum < 100 ? "text-amber-600" : "text-muted-foreground";
                    return (
                      <span key={ii} className={color}>
                        <strong>{ind.name}</strong> ({ind.unit}): {sum.toFixed(0)}%
                      </span>
                    );
                  })}
                </div>
              </div>

              {empSummary.map((row, ei) => {
                const totalShare = (shareMatrix[ei] ?? []).reduce((s, v) => s + v, 0);
                const isOpen = expanded[ei];
                return (
                  <div key={ei} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{row.emp.code ? `${row.emp.code} · ` : ""}{row.emp.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Target {row.totalTarget.toFixed(1)} · Đạt {row.totalActual.toFixed(1)}
                          </span>
                        </div>
                        <div className={`text-sm font-bold ${row.totalPct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                          {row.totalPct.toFixed(1)}%
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setExpanded((s) => ({ ...s, [ei]: !s[ei] }))}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Tổng share slider */}
                    <div className="mt-3 grid grid-cols-[80px_1fr_60px] items-center gap-3">
                      <span className="text-xs font-medium">Tổng share</span>
                      <Slider
                        value={[Math.min(200, totalShare)]}
                        max={200}
                        step={1}
                        onValueChange={(v) => setEmpTotalShare(ei, v[0])}
                      />
                      <span className="text-right text-xs font-mono">{totalShare.toFixed(0)}%</span>
                    </div>

                    {isOpen && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {row.perInd.map((p, ii) => (
                          <div key={ii} className="grid grid-cols-[1fr_2fr_140px] items-center gap-3 text-xs">
                            <span className="truncate" title={p.ind.name}>
                              {p.ind.name} <span className="text-muted-foreground">({p.ind.unit})</span>
                            </span>
                            <Slider
                              value={[Math.min(200, p.sharePct)]}
                              max={200}
                              step={1}
                              onValueChange={(v) => setEmpIndShare(ei, ii, v[0])}
                            />
                            <span className="text-right font-mono">
                              {p.sharePct.toFixed(0)}% → {p.target.toFixed(1)} / đạt {p.actual.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {biReport && (
          <>
            <div className="mt-6 mb-3 flex flex-wrap justify-end gap-2">
              <Button variant="default" onClick={downloadPng} disabled={pngBusy}>
                {pngBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
                {pngBusy ? "Đang tải..." : "Tải ảnh PNG"}
              </Button>
              <ExportPdfButton
                getElements={() => [reportRef.current]}
                filename="ThiDua_NhanVien.pdf"
                label="Xuất PDF"
                variant="outline"
              />
            </div>
            <div className="overflow-x-auto rounded-lg bg-muted/30 p-4">
              <ReportImage
                ref={reportRef}
                report={biReport}
                title="THI ĐUA NHÂN VIÊN"
                firstColLabel="NHÂN VIÊN"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
