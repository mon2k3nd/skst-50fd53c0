import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DataPasteCard } from "@/components/DataPasteCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseTable, toNumber, formatNumber, formatPercent } from "@/lib/parsers";
import { Users, Trophy, DollarSign, Search } from "lucide-react";

export const Route = createFileRoute("/nhan-vien")({
  component: NhanVienPage,
  head: () => ({
    meta: [
      { title: "Quản lý Nhân Viên — Sức Khoẻ Siêu Thị" },
      { name: "description", content: "Theo dõi doanh thu và thi đua theo nhân viên từ dữ liệu BI dán vào." },
    ],
  }),
});

function NhanVienPage() {
  const [revRaw, setRevRaw] = useState("");
  const [thiDuaRaw, setThiDuaRaw] = useState("");
  const [storeRaw, setStoreRaw] = useState("");
  const [query, setQuery] = useState("");

  const rev = useMemo(() => parseTable(revRaw), [revRaw]);
  const td = useMemo(() => parseTable(thiDuaRaw), [thiDuaRaw]);
  const store = useMemo(() => parseTable(storeRaw), [storeRaw]);

  const filterRows = (rows: ReturnType<typeof parseTable>["rows"]) => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q))
    );
  };

  const totals = useMemo(() => {
    const empCount = rev.rows.length;
    const numCol = rev.headers.find((h) => /Doanh|DTQĐ|Quy đổi/i.test(h)) ?? rev.headers[1];
    const totalRev = numCol ? rev.rows.reduce((s, r) => s + toNumber(r[numCol]), 0) : 0;
    const tdCol = td.headers.find((h) => /% HT|Hoàn thành/i.test(h)) ?? "";
    const winners = tdCol ? td.rows.filter((r) => toNumber(r[tdCol]) >= 100).length : 0;
    return { empCount, totalRev, winners };
  }, [rev, td]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-foreground">Theo Dõi Sức Khoẻ Nhân Viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dán dữ liệu từ BI vào các ô tương ứng để phân tích.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatChip icon={<Users className="h-5 w-5" />} label="Số nhân viên" value={String(totals.empCount)} gradient="var(--gradient-info)" />
          <StatChip icon={<DollarSign className="h-5 w-5" />} label="Tổng doanh thu" value={formatNumber(totals.totalRev)} gradient="var(--gradient-success)" />
          <StatChip icon={<Trophy className="h-5 w-5" />} label="NV về đích" value={String(totals.winners)} gradient="var(--gradient-warning)" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <DataPasteCard title="$ Doanh Thu theo Nhân Viên" value={revRaw} onChange={setRevRaw} icon={<DollarSign className="h-4 w-4" />} rows={6} />
          <DataPasteCard title="🏆 Thi Đua theo Nhân Viên" value={thiDuaRaw} onChange={setThiDuaRaw} icon={<Trophy className="h-4 w-4" />} rows={6} />
          <DataPasteCard title="🏪 Thi đua siêu thị" value={storeRaw} onChange={setStoreRaw} icon={<Users className="h-4 w-4" />} rows={6} />
        </div>

        <div className="mt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm nhân viên..." className="pl-9" />
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {rev.rows.length > 0 && <DataTable title="Doanh Thu theo Nhân Viên" headers={rev.headers} rows={filterRows(rev.rows)} />}
          {td.rows.length > 0 && <DataTable title="Thi Đua theo Nhân Viên" headers={td.headers} rows={filterRows(td.rows)} highlight />}
        </div>
        {store.rows.length > 0 && (
          <div className="mt-6">
            <DataTable title="Thi đua siêu thị" headers={store.headers} rows={filterRows(store.rows)} />
          </div>
        )}
      </main>
    </div>
  );
}

function StatChip({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string; gradient: string }) {
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

function DataTable({
  title,
  headers,
  rows,
  highlight,
}: {
  title: string;
  headers: string[];
  rows: Record<string, string | number>[];
  highlight?: boolean;
}) {
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-info">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-muted/30">
                {headers.map((h) => {
                  const v = r[h];
                  const isPct = /% HT|Hoàn thành/i.test(h);
                  const num = typeof v === "number" ? v : null;
                  let cls = "";
                  if (highlight && isPct && num !== null) {
                    cls = num >= 100 ? "text-success font-bold" : num >= 50 ? "text-warning font-semibold" : "text-muted-foreground";
                  }
                  return (
                    <td key={h} className={`px-3 py-2 ${cls}`}>
                      {typeof v === "number" ? (isPct ? formatPercent(v) : formatNumber(v)) : (v as string)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
