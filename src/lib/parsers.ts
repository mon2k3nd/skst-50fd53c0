// Utilities to parse pasted tabular data (whitespace or tab separated).

export type ParsedRow = Record<string, string | number>;

// Known header keywords (Vietnamese reports). Used to (a) detect the header
// line inside messy free-form text, and (b) split a header line where columns
// are concatenated without whitespace, e.g. "Ngành hàngDT Realtime (QĐ)Target Ngày% HT Target Ngày".
const KNOWN_HEADERS = [
  "Ngành hàng",
  "Tên NV",
  "Họ tên",
  "Họ và tên",
  "Mã NV",
  "Mã nhân viên",
  "DT Realtime (QĐ)",
  "DT Realtime",
  "DTQĐ",
  "Doanh thu",
  "Doanh số",
  "Quy đổi",
  "Target Ngày",
  "Target tháng",
  "Target",
  "% HT Target Ngày",
  "% HT Target",
  "% HT Dự kiến",
  "% HT",
  "% Hoàn thành",
  "Hoàn thành",
  "Dự kiến",
  "Xếp hạng trong miền",
  "Xếp hạng",
  "Trả chậm",
  "Trả Góp",
  "Tỷ trọng trả chậm",
  "Lãi gộp",
  "Số lượng",
];

/**
 * Extract the most likely tabular block from a free-form pasted string.
 * Strategy: find the first occurrence of any known header keyword, take
 * everything from that index onward. Trim trailing prose.
 */
function extractTableBlock(raw: string): string {
  const lower = raw.toLowerCase();
  let bestIdx = -1;
  for (const h of KNOWN_HEADERS) {
    const i = lower.indexOf(h.toLowerCase());
    if (i >= 0 && (bestIdx === -1 || i < bestIdx)) bestIdx = i;
  }
  if (bestIdx === -1) return raw;
  return raw.slice(bestIdx);
}

/**
 * Split a single line that has columns concatenated without delimiters,
 * e.g. "Tổng7.3493.287.87%0" or "Ngành hàngDT Realtime (QĐ)Target Ngày% HT Target NgàyXếp hạng trong miền"
 * by inserting tabs at known header boundaries and at letter↔digit transitions.
 */
function smartSplitLine(line: string): string[] {
  // If already has tabs or 2+ spaces, use normal split.
  if (/\t/.test(line)) return line.split("\t").map((s) => s.trim()).filter(Boolean);
  if (/\s{2,}/.test(line)) return line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);

  let s = line;
  // Insert a TAB before every known header keyword (longest first to avoid
  // partial overlaps like "Target" inside "Target Ngày").
  const sorted = [...KNOWN_HEADERS].sort((a, b) => b.length - a.length);
  for (const h of sorted) {
    const re = new RegExp(`(?<!\\t)(${h.replace(/[()%./-]/g, "\\$&")})`, "gi");
    s = s.replace(re, "\t$1");
  }
  // Insert TAB at digit→letter and letter→digit transitions (handles
  // "Tổng7.34" -> "Tổng\t7.34" and "0Bảo Hiểm" -> "0\tBảo Hiểm").
  s = s.replace(/([\p{L}%])(\d)/gu, "$1\t$2");
  s = s.replace(/(\d)(\p{L})/gu, "$1\t$2");
  // Insert TAB between adjacent numeric tokens like "7.3493.28" -> hard.
  // We can't safely split number-from-number without column hints, so leave it.
  return s
    .split("\t")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseTable(raw: string): { headers: string[]; rows: ParsedRow[] } {
  const cleaned = extractTableBlock(raw);
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const split = (line: string) => smartSplitLine(line);

  // Find header line: prefer the first line containing a known header keyword,
  // otherwise the line with most non-numeric tokens.
  let headerIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    const knownHits = KNOWN_HEADERS.filter((h) => lower.includes(h.toLowerCase())).length;
    const tokens = split(lines[i]);
    const nonNum = tokens.filter((t) => isNaN(parseFloat(t.replace(/[,%]/g, "")))).length;
    const score = knownHits * 10 + nonNum;
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