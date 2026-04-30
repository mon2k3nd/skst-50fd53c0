import { useEffect, useState } from "react";

export interface Employee {
  id: string; // local uuid
  code: string; // mã NV
  name: string;
  target: number; // target cá nhân (tr)
}

const KEY = "skst_employees_v1";

function read(): Employee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: Employee[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("skst:employees"));
}

export function useEmployees() {
  const [list, setList] = useState<Employee[]>(() => read());

  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("skst:employees", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("skst:employees", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = (emp: Omit<Employee, "id">) => {
    const item: Employee = { ...emp, id: crypto.randomUUID() };
    write([...read(), item]);
  };
  const update = (id: string, patch: Partial<Employee>) => {
    write(read().map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const remove = (id: string) => {
    write(read().filter((e) => e.id !== id));
  };
  const setAll = (next: Employee[]) => write(next);

  return { list, add, update, remove, setAll };
}

/** Try to detect employee code/name columns and produce per-employee aggregates */
export function aggregateByEmployee(
  headers: string[],
  rows: Record<string, string | number>[],
): { codeCol?: string; nameCol?: string; valueCol?: string; map: Map<string, number> } {
  const codeCol = headers.find((h) => /^(mã|ma|code|id|mnv|m\.?nv)/i.test(h.trim()));
  const nameCol = headers.find((h) => /(họ tên|ho ten|tên nv|ten nv|nhân viên|nhan vien|tên|name)/i.test(h.trim()));
  const valueCol =
    headers.find((h) => /DTQĐ|Doanh thu|Quy đổi|Doanh số|Số bán|So ban/i.test(h)) ??
    headers.find((h, i) => i > 0 && rows.some((r) => typeof r[h] === "number"));

  const map = new Map<string, number>();
  if (!valueCol) return { codeCol, nameCol, valueCol, map };

  rows.forEach((r) => {
    const key = (codeCol && String(r[codeCol]).trim()) || (nameCol && String(r[nameCol]).trim()) || "";
    if (!key) return;
    const v = typeof r[valueCol] === "number" ? (r[valueCol] as number) : 0;
    map.set(key, (map.get(key) ?? 0) + v);
  });

  return { codeCol, nameCol, valueCol, map };
}

/** Vietnamese-aware loose match: ignore diacritics and case */
export function looseMatch(a: string, b: string) {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  return norm(a) === norm(b);
}

/** Find aggregated value for an employee by code (preferred) or name */
export function findEmployeeValue(
  emp: Employee,
  agg: ReturnType<typeof aggregateByEmployee>,
): number {
  // exact code match
  for (const [key, val] of agg.map) {
    if (emp.code && key === emp.code) return val;
  }
  // loose name match
  for (const [key, val] of agg.map) {
    if (emp.name && looseMatch(emp.name, key)) return val;
  }
  // partial: code contained, or name contained
  for (const [key, val] of agg.map) {
    if (emp.code && key.includes(emp.code)) return val;
    if (emp.name && key.toLowerCase().includes(emp.name.toLowerCase())) return val;
  }
  return 0;
}