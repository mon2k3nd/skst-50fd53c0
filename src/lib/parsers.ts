// Utilities to parse pasted tabular data (whitespace or tab separated).

export type ParsedRow = Record<string, string | number>;

export function parseTable(raw: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const split = (line: string) =>
    line.includes("\t")
      ? line.split("\t").map((s) => s.trim())
      : line.split(/\s{2,}|\s+/).map((s) => s.trim());

  // Find header line: the line that has the most non-numeric tokens
  let headerIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const tokens = split(lines[i]);
    const score = tokens.filter((t) => isNaN(parseFloat(t.replace(/[,%]/g, "")))).length;
    if (score > bestScore && tokens.length >= 2) {
      bestScore = score;
      headerIdx = i;
    }
  }

  const headers = split(lines[headerIdx]);
  const rows: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    if (cells.length < 2) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      const val = cells[idx] ?? "";
      const num = parseFloat(val.replace(/[,%]/g, ""));
      row[h] = !isNaN(num) && /^-?[\d.,%]+$/.test(val) ? num : val;
    });
    rows.push(row);
  }
  return { headers, rows };
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[,%]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}