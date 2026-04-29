import { parse } from "node-html-parser";
import { ParsedRow, BranchName, DpdBucket, BRANCHES } from "@/types";

export function parseHtmlContent(html: string): ParsedRow {
  const root = parse(html);
  
  // This is a naive implementation that attempts to find tables and match
  // label cells to their adjacent value cells. Real implementations
  // might need more robust selector logic depending on the HTML structure.
  
  const cells = root.querySelectorAll("td, th, span, div");
  
  const extractValue = (labels: string[]): number => {
    for (let i = 0; i < cells.length; i++) {
      const text = cells[i].text.toLowerCase().trim();
      if (labels.some((l) => text.includes(l))) {
        // Look at the next sibling or next element in array
        let nextText = "";
        const nextElement = cells[i].nextElementSibling;
        if (nextElement) {
          nextText = nextElement.text;
        } else if (i + 1 < cells.length) {
          nextText = cells[i + 1].text;
        }
        
        // Strip non-numeric characters except dots and minus
        const numericStr = nextText.replace(/[^0-9.-]+/g, "");
        const val = Number(numericStr);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };

  const extractString = (labels: string[]): string | null => {
    for (let i = 0; i < cells.length; i++) {
      const text = cells[i].text.toLowerCase().trim();
      if (labels.some((l) => text.includes(l))) {
        const nextElement = cells[i].nextElementSibling;
        if (nextElement) {
          return nextElement.text.trim();
        } else if (i + 1 < cells.length) {
          return cells[i + 1].text.trim();
        }
      }
    }
    return null;
  };

  const branchRaw = extractString(["branch"]);
  let branchName: BranchName = "Supermarket"; // Default fallback if needed, but we should match
  
  if (branchRaw) {
    const matched = BRANCHES.find((b) => b.toLowerCase() === branchRaw.toLowerCase());
    if (matched) branchName = matched;
  }

  const closingBalance = extractValue(["closing balance", "closing"]);
  const disbursement = extractValue(["disbursement", "disburse"]);
  const collection = extractValue(["collection", "collected"]);
  const npa = extractValue(["npa"]);

  const dpdBuckets: Record<DpdBucket, { count: number; amount: number }> = {
    "0": { count: extractValue(["0 dpd count"]), amount: extractValue(["0 dpd amount"]) },
    "1-30": { count: extractValue(["1-30 dpd count"]), amount: extractValue(["1-30 dpd amount"]) },
    "31-60": { count: extractValue(["31-60 dpd count"]), amount: extractValue(["31-60 dpd amount"]) },
    "61-90": { count: extractValue(["61-90 dpd count"]), amount: extractValue(["61-90 dpd amount"]) },
    "91-180": { count: extractValue(["91-180 dpd count"]), amount: extractValue(["91-180 dpd amount"]) },
    "181+": { count: extractValue(["181+ dpd count"]), amount: extractValue(["181+ dpd amount"]) },
  };

  return {
    branch: branchName,
    closingBalance,
    disbursement,
    collection,
    npa,
    dpdBuckets,
  };
}
