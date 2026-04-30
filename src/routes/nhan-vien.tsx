import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { Users, Trophy, DollarSign, UserPlus, Trash2, Save } from "lucide-react";
import {
  useEmployees,
  aggregateByEmployee,
  findEmployeeValue,
  type Employee,
} from "@/lib/employees";
import { ExportPdfButton } from "@/components/ExportPdfButton";

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
  const { list, add, update, remove } = useEmployees();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseTable(raw), [raw]);
  const agg = useMemo(
    () => aggregateByEmployee(parsed.headers, parsed.rows),
    [parsed],
  );

  const reportRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    return list.map((e) => {
      const actual = findEmployeeValue(e, agg);
      const pct = e.target > 0 ? (actual / e.target) * 100 : 0;
      return { emp: e, actual, pct };
    });
  }, [list, agg]);

  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalTarget = list.reduce((s, e) => s + e.target, 0);
  const totalPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const winners = rows.filter((r) => r.pct >= 100).length;

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Quản Lý Nhân Viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lưu danh sách nhân viên (cục bộ trên trình duyệt). Dán file số bán → tự lọc theo mã/tên → xuất báo cáo hoàn thành.
        </p>

        {/* Add form */}
        <Card className="mt-6 shadow-[var(--shadow-card)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-info">
              <UserPlus className="h-4 w-4" /> Thêm nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto]">
              <Input
                placeholder="Mã NV (VD: 133268)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Input
                placeholder="Họ tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAdd()}
              />
              <Input
                placeholder="Target (tr)"
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
            <div className="mt-6 flex justify-end">
              <ExportPdfButton
                getElements={() => [reportRef.current]}
                filename="BaoCao_NhanVien.pdf"
              />
            </div>
            <div ref={reportRef} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <StatBlock label="Số NV" value={String(list.length)} icon={<Users className="h-5 w-5" />} gradient="var(--gradient-info)" />
                <StatBlock label="Tổng doanh thu" value={formatNumber(totalActual)} icon={<DollarSign className="h-5 w-5" />} gradient="var(--gradient-success)" />
                <StatBlock label="Tổng target" value={formatNumber(totalTarget)} icon={<Trophy className="h-5 w-5" />} gradient="var(--gradient-warning)" />
                <StatBlock label="% Hoàn thành" value={totalTarget ? formatPercent(totalPct) : "—"} icon={<Trophy className="h-5 w-5" />} gradient="var(--gradient-hero)" />
              </div>

              <Card className="shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-info">Báo Cáo Hoàn Thành Nhân Viên</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left">Mã NV</th>
                        <th className="px-3 py-2 text-left">Họ tên</th>
                        <th className="px-3 py-2 text-right">Target</th>
                        <th className="px-3 py-2 text-right">Thực hiện</th>
                        <th className="px-3 py-2 text-right">% HT</th>
                        <th className="px-3 py-2 text-right">Còn thiếu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const cls =
                          r.pct >= 100
                            ? "text-success font-bold"
                            : r.pct >= 80
                              ? "text-warning font-semibold"
                              : "text-destructive font-semibold";
                        const remain = Math.max(0, r.emp.target - r.actual);
                        return (
                          <tr key={r.emp.id} className="border-b">
                            <td className="px-3 py-2 font-mono">{r.emp.code || "—"}</td>
                            <td className="px-3 py-2">{r.emp.name}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(r.emp.target)}</td>
                            <td className="px-3 py-2 text-right">{formatNumber(r.actual)}</td>
                            <td className={`px-3 py-2 text-right ${cls}`}>
                              {r.emp.target > 0 ? formatPercent(r.pct) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right">{formatNumber(remain)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted/40 font-bold">
                        <td className="px-3 py-2" colSpan={2}>TỔNG ({winners}/{list.length} về đích)</td>
                        <td className="px-3 py-2 text-right">{formatNumber(totalTarget)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(totalActual)}</td>
                        <td className="px-3 py-2 text-right">{totalTarget ? formatPercent(totalPct) : "—"}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(Math.max(0, totalTarget - totalActual))}</td>
                      </tr>
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

function StatBlock({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 p-4 text-white" style={{ background: gradient }}>
        <div className="rounded-md bg-white/20 p-2">{icon}</div>
        <div>
          <div className="text-xs font-medium opacity-90">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}