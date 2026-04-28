import { parse } from "node-html-parser";
import type { ParsedRow, BranchName, DpdBucket } from "@/types";
import { BRANCHES, DPD_BUCKETS } from "./constants";

function extractNumber(text: string): number { const cleaned = text.replace(/[₹,\s]/g, ""); return parseFloat(cleaned) || 0; }
function findValueByLabel(root: ReturnType<typeof parse>, label: string): number {
  const norm = label.toLowerCase();
  for (const el of root.querySelectorAll("td, th, span, div, p")) {
    if (el.text.toLowerCase().includes(norm)) {
      const next = el.nextElementSibling ?? el.parentNode?.nextElementSibling;
      if (next) return extractNumber(next.text);
    }
  }
  return 0;
}
export function parseHtmlContent(html: string): ParsedRow {
  const root = parse(html);
  let branch: BranchName = "Supermarket";
  for (const b of BRANCHES) if (html.toLowerCase().includes(b.toLowerCase())) { branch = b; break; }
  const closingBalance = findValueByLabel(root, "closing balance") || findValueByLabel(root, "closing bal");
  const disbursement = findValueByLabel(root, "disbursement") || findValueByLabel(root, "disburse");
  const collection = findValueByLabel(root, "collection") || findValueByLabel(root, "collected");
  const npa = findValueByLabel(root, "npa");
  const dpdBuckets = Object.fromEntries(DPD_BUCKETS.map((bucket) => [bucket, { count: Math.round(findValueByLabel(root, `${bucket} dpd count`) || findValueByLabel(root, `${bucket} count`)), amount: findValueByLabel(root, `${bucket} dpd amount`) || findValueByLabel(root, `${bucket} amount`) }])) as Record<DpdBucket, { count: number; amount: number }>;
  return { branch, closingBalance, disbursement, collection, npa, dpdBuckets };
}
