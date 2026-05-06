import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseTable, toNumber } from "@/lib/parsers";
import { DollarSign, UserPlus, Trash2, Save, ImageDown, Loader2, Upload, Sparkles } from "lucide-react";
import {
  useEmployees,
  aggregateByEmployee,
  findEmployeeValue,
  type Employee,
} from "@/lib/employees";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { ReportImage, type BiReport } from "@/components/ReportImage";
import { downloadElementAsPng } from "@/lib/image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nhan-vien")({
  component: NhanVienPage,
  head: () => ({
    meta: [
      { title: "Quản lý Nhân Viên — Sức Khoẻ Siêu Thị" },
      {
        name: "description",
        content:
          "Thêm/lưu nhân viên, dán file số bán để lọc và xuất báo cáo hoàn thành theo từng người.",
      },
    ],
  }),
});

function NhanVienPage() {
  const { list, add, update, remove, setAll } = useEmployees();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseTable(raw), [raw]);
  const agg = useMemo(
    () => aggregateByEmployee(parsed.headers, parsed.rows),
    [parsed],
  );
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAgg, setAiAgg] = useState<Map<string, number> | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const salesFileRef = useRef<HTMLInputElement>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const [pngBusy, setPngBusy] = useState(false);

  const rows = useMemo(() => {
    const useAi = aiAgg && aiAgg.size > 0;
    return list.map((e) => {
      let actual = 0;
      if (useAi) {
        // try by code, then by name (loose)
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        for (const [k, v] of aiAgg!) {
          if (e.code && k.includes(e.code)) { actual = v; break; }
          if (e.name && norm(k).includes(norm(e.name))) { actual = v; break; }
        }
      } else {
        actual = findEmployeeValue(e, agg);
      }
      const pct = e.target > 0 ? (actual / e.target) * 100 : 0;
      return { emp: e, actual, pct };
    });
  }, [list, agg, aiAgg]);

  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalTarget = list.reduce((s, e) => s + e.target, 0);
  const totalPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const winners = rows.filter((r) => r.pct >= 100).length;

  const aiReport: BiReport = useMemo(() => ({
    store_name: `${winners}/${list.length} NV về đích`,
    period_label: "",
    kpis: {
      doanh_thu: totalActual || null,
      muc_tieu: totalTarget || null,
      pct_hoan_thanh: totalTarget ? totalPct : null,
      du_kien_thang: null,
      cung_ky: null,
      du_kien_ht_lntt: null,
      tra_cham_hien_tai: null,
      tra_cham_target: null,
      lai_gop: null,
    },
    industries: rows.map((r) => ({
      ten: `${r.emp.code ? r.emp.code + " - " : ""}${r.emp.name}`,
      sl: null,
      dtqd: r.actual || null,
      lai_gop: r.emp.target || null,
      cung_ky_pct: r.emp.target > 0 ? r.pct : null,
      don_gia: Math.max(0, r.emp.target - r.actual) || null,
      tra_cham_pct: null,
    })),
  }), [rows, totalActual, totalTarget, totalPct, list.length, winners]);

  async function downloadPng() {
    setPngBusy(true);
    try {
      await downloadElementAsPng(reportRef.current, "BaoCao_NhanVien.png");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải ảnh được.");
    } finally {
      setPngBusy(false);
    }
  }

  const onAdd = () => {
    if (!name.trim()) return;
    add({
      code: code.trim(),
      name: name.trim(),
      target: toNumber(target),
    });
    setCode("");
    setName("");
    setTarget("");
  };

  async function fileToText(file: File): Promise<string> {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      let out = "";
      for (const sn of wb.SheetNames) {
        out += `# ${sn}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[sn]) + "\n";
      }
      return out;
    }
    return await file.text();
  }

  async function onImportEmployees(file: File) {
    setImportBusy(true);
    try {
      const text = await fileToText(file);
      const { data, error } = await supabase.functions.invoke("parse-employees", { body: { text } });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const emps = (data as { employees: { code?: string; name: string; target?: number | null }[] }).employees ?? [];
      if (!emps.length) { toast.error("AI không tìm thấy nhân viên."); return; }
      const next = emps.map((e) => ({
        id: crypto.randomUUID(),
        code: e.code ?? "",
        name: e.name,
        target: typeof e.target === "number" ? e.target : 0,
      }));
      setAll(next);
      toast.success(`Đã thêm ${next.length} nhân viên từ file.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      setImportBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onImportSales(file: File) {
    setAiBusy(true);
    try {
      const text = await fileToText(file);
      setRaw(text);
      await runAiSales(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      if (salesFileRef.current) salesFileRef.current.value = "";
    }
  }

  async function runAiSales(textInput?: string) {
    const text = textInput ?? raw;
    if (!text.trim()) { toast.error("Hãy dán/đẩy file số bán."); return; }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-bi", {
        body: { text, kind: "nhan-vien", targetMultiplier: 1 },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const rep = data as BiReport;
      const map = new Map<string, number>();
      (rep.industries ?? []).forEach((it) => {
        if (it.ten && typeof it.dtqd === "number") map.set(it.ten, it.dtqd);
      });
      setAiAgg(map);
      toast.success(`AI phân tích xong: ${map.size} dòng.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI lỗi.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Quản Lý Nhân Viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đẩy file Excel/CSV nhân viên để AI tự thêm. Đẩy file số bán để AI phân tích → xuất báo cáo.
        </p>

        {/* Add form */}
        <Card className="mt-6 shadow-[var(--shadow-card)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base text-info">
              <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Thêm nhân viên</span>
              <span className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onImportEmployees(e.target.files[0])}
                />
                <Button size="sm" variant="outline" disabled={importBusy} onClick={() => fileRef.current?.click()}>
                  {importBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                  {importBusy ? "Đang đọc..." : "Đẩy file NV (AI)"}
                </Button>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto]">
              <Input
                placeholder="VD: NV001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Input
                placeholder="VD: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAdd()}
              />
              <Input
                placeholder="VD: 200 (triệu)"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <Button onClick={onAdd}>
                <UserPlus className="mr-1 h-4 w-4" /> Thêm
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Đã lưu <strong>{list.length}</strong> nhân viên trên trình duyệt này.
            </p>
          </CardContent>
        </Card>

        {/* Employees list with target editor */}
        {list.length > 0 && (
          <Card className="mt-6 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Danh sách & chỉnh Target</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <EmployeeEditTable list={list} update={update} remove={remove} />
            </CardContent>
          </Card>
        )}

        {/* Paste data */}
        <div className="mt-6">
          <DataPasteCard
            title="Dán file số bán (gồm Mã NV / Tên NV / Doanh thu)"
            value={raw}
            onChange={setRaw}
            icon={<DollarSign className="h-4 w-4" />}
            rows={8}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={salesFileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImportSales(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => salesFileRef.current?.click()} disabled={aiBusy}>
              <Upload className="mr-2 h-4 w-4" /> Đẩy file số bán
            </Button>
            <Button onClick={() => runAiSales()} disabled={aiBusy || !raw.trim()}>
              {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiBusy ? "Đang phân tích..." : "Phân tích bằng AI"}
            </Button>
            {aiAgg && <span className="text-xs text-muted-foreground">AI đã khớp {aiAgg.size} dòng.</span>}
          </div>
          {parsed.rows.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Phát hiện cột:{" "}
              <strong>Mã NV</strong> = {agg.codeCol ?? "—"} ·{" "}
              <strong>Tên</strong> = {agg.nameCol ?? "—"} ·{" "}
              <strong>Doanh thu</strong> = {agg.valueCol ?? "—"}
            </div>
          )}
        </div>

        {/* Report */}
        {list.length > 0 && (
          <>
            <div className="mt-6 mb-3 flex flex-wrap justify-end gap-2">
              <Button variant="default" onClick={downloadPng} disabled={pngBusy}>
                {pngBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageDown className="mr-2 h-4 w-4" />}
                {pngBusy ? "Đang tải..." : "Tải ảnh PNG"}
              </Button>
              <ExportPdfButton
                getElements={() => [reportRef.current]}
                filename="BaoCao_NhanVien.pdf"
                label="Xuất PDF"
                variant="outline"
              />
            </div>
            <div className="overflow-x-auto rounded-lg bg-muted/30 p-4">
              <ReportImage
                ref={reportRef}
                report={aiReport}
                title="DOANH THU THEO NHÂN VIÊN"
                firstColLabel="NHÂN VIÊN"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmployeeEditTable({
  list,
  update,
  remove,
}: {
  list: Employee[];
  update: (id: string, patch: Partial<Employee>) => void;
  remove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Record<string, Partial<Employee>>>({});
  const get = (e: Employee, k: keyof Employee) =>
    (draft[e.id]?.[k] as string | number | undefined) ?? e[k];

  const save = (e: Employee) => {
    const d = draft[e.id];
    if (!d) return;
    update(e.id, {
      ...d,
      target: d.target !== undefined ? toNumber(d.target as unknown as string) : undefined,
    });
    setDraft((s) => {
      const n = { ...s };
      delete n[e.id];
      return n;
    });
  };

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          <th className="px-2 py-2 text-left">Mã NV</th>
          <th className="px-2 py-2 text-left">Họ tên</th>
          <th className="px-2 py-2 text-left">Target (tr)</th>
          <th className="px-2 py-2"></th>
        </tr>
      </thead>
      <tbody>
        {list.map((e) => {
          const dirty = !!draft[e.id];
          return (
            <tr key={e.id} className="border-b">
              <td className="px-2 py-2">
                <Input
                  className="h-8"
                  value={String(get(e, "code") ?? "")}
                  onChange={(ev) =>
                    setDraft((s) => ({ ...s, [e.id]: { ...s[e.id], code: ev.target.value } }))
                  }
                />
              </td>
              <td className="px-2 py-2">
                <Input
                  className="h-8"
                  value={String(get(e, "name") ?? "")}
                  onChange={(ev) =>
                    setDraft((s) => ({ ...s, [e.id]: { ...s[e.id], name: ev.target.value } }))
                  }
                />
              </td>
              <td className="px-2 py-2">
                <Input
                  className="h-8 w-32"
                  inputMode="decimal"
                  value={String(get(e, "target") ?? "")}
                  onChange={(ev) =>
                    setDraft((s) => ({
                      ...s,
                      [e.id]: { ...s[e.id], target: ev.target.value as unknown as number },
                    }))
                  }
                />
              </td>
              <td className="px-2 py-2 text-right">
                {dirty && (
                  <Button size="sm" variant="secondary" className="mr-2" onClick={() => save(e)}>
                    <Save className="mr-1 h-3.5 w-3.5" /> Lưu
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
