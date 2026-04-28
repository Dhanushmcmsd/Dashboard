import * as XLSX from "xlsx";
import type { ParsedRow, DpdBucket } from "@/types";
import { BRANCHES, DPD_BUCKETS } from "./constants";
import { ParsedRowSchema } from "./validations";

const COL_MAP: Record<string, keyof Omit<ParsedRow, "branch" | "dpdBuckets">> = { "closing balance": "closingBalance", closing_balance: "closingBalance", closingbalance: "closingBalance", disbursement: "disbursement", disburse: "disbursement", collection: "collection", collected: "collection", npa: "npa" };
function normalize(s: string): string { return s.toLowerCase().replace(/\s+/g, " ").trim(); }

export function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: 0 });
  if (!rows.length) throw new Error("Excel sheet is empty");
  const headers = Object.keys(rows[0]);
  const out: ParsedRow[] = [];
  for (const row of rows) {
    const branchKey = headers.find((h) => ["branch", "branch name"].includes(normalize(h)));
    const branchRaw = branchKey ? String(row[branchKey]) : "";
    const branch = BRANCHES.find((b) => b.toLowerCase() === branchRaw.toLowerCase());
    if (!branch) continue;
    const metrics: Partial<Omit<ParsedRow, "branch" | "dpdBuckets">> = {};
    const dpdBuckets: Partial<Record<DpdBucket, { count: number; amount: number }>> = {};
    for (const h of headers) {
      const norm = normalize(h);
      const val = Number(row[h] ?? 0);
      if (COL_MAP[norm]) metrics[COL_MAP[norm]] = val;
      for (const b of DPD_BUCKETS) {
        if (norm.startsWith(b)) {
          if (!dpdBuckets[b]) dpdBuckets[b] = { count: 0, amount: 0 };
          if (norm.includes("count")) dpdBuckets[b]!.count = Math.round(val);
          else dpdBuckets[b]!.amount = val;
        }
      }
    }
    const fullBuckets = Object.fromEntries(DPD_BUCKETS.map((b) => [b, dpdBuckets[b] ?? { count: 0, amount: 0 }])) as Record<DpdBucket, { count: number; amount: number }>;
    const parsed = ParsedRowSchema.safeParse({ branch, closingBalance: metrics.closingBalance ?? 0, disbursement: metrics.disbursement ?? 0, collection: metrics.collection ?? 0, npa: metrics.npa ?? 0, dpdBuckets: fullBuckets });
    if (parsed.success) out.push(parsed.data as ParsedRow);
  }
  if (!out.length) throw new Error("No valid branch rows found in Excel");
  return out;
}
