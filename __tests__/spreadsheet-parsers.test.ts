import assert from "node:assert/strict";
import test from "node:test";
import { LoanBucket, TxnType } from "@prisma/client";
import { parseLoans } from "../lib/parsers/loan-balance";
import { parseTransactions } from "../lib/parsers/transactions";

function csvBuffer(rows: string[][]): Buffer {
  return Buffer.from(
    rows
      .map((row) =>
        row
          .map((cell) => {
            if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
            return cell;
          })
          .join(",")
      )
      .join("\n"),
    "utf8"
  );
}

test("loan balance parser handles valid rows and fuzzy headers", async () => {
  const result = await parseLoans(
    csvBuffer([
      [
        "Loan A/C No",
        "Customer Nane",
        "Branch",
        "Principal Outstanding",
        "Gold Wt (g)",
        "LTV %",
        "ROI",
        "Loan Date",
        "Due Date",
        "DPD Bucket",
      ],
      [
        "GL001",
        "Asha Rao",
        "Gold Loan",
        "₹1,25,000.50",
        "42.5",
        "72%",
        "12.25%",
        "31/03/2026",
        "2026-12-31",
        "0-30",
      ],
    ]),
    { dryRun: true }
  );

  assert.equal(result.parsed.length, 1);
  assert.equal(result.skipped.length, 0);
  assert.equal(result.parsed[0].customerName, "Asha Rao");
  assert.equal(result.parsed[0].principalOutstanding, 125000.5);
  assert.equal(result.parsed[0].bucket, LoanBucket.DPD_0_30);
});

test("loan balance parser reports missing required columns", async () => {
  const result = await parseLoans(
    csvBuffer([
      ["Account Number", "Customer Name"],
      ["GL001", "Asha Rao"],
    ]),
    { dryRun: true }
  );

  assert.equal(result.parsed.length, 0);
  assert.match(result.skipped[0].reason, /missing required column/);
  assert.ok(result.errors.some((error) => error.field === "branch"));
});

test("loan balance parser skips malformed dates and buckets", async () => {
  const result = await parseLoans(
    csvBuffer([
      [
        "Account Number",
        "Customer Name",
        "Branch",
        "Balance",
        "Gold Weight",
        "LTV",
        "Interest Rate",
        "Disbursement Date",
        "Maturity Date",
        "Bucket",
      ],
      ["GL001", "Asha Rao", "Gold Loan", "1000", "10", "60", "12", "31/31/2026", "", "mystery"],
    ]),
    { dryRun: true }
  );

  assert.equal(result.parsed.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.ok(result.errors.some((error) => error.field === "disbursement_date"));
  assert.ok(result.errors.some((error) => error.field === "bucket"));
});

test("transaction parser handles valid rows and type normalization", async () => {
  const result = await parseTransactions(
    csvBuffer([
      ["A/C No", "Txn Date", "Nature", "Txn Amount", "Closing Balance"],
      ["GL001", "2026-04-01", "DISBURSAL", "₹50,000", "50,000"],
      ["GL001", "02-04-2026", "PENAL CHARGE", "500", "50,500"],
    ]),
    {
      dryRun: true,
      companyId: "cmp_1",
      existingAccounts: [{ id: "acct_1", accountNumber: "GL001" }],
    }
  );

  assert.equal(result.parsed.length, 2);
  assert.equal(result.parsed[0].txnType, TxnType.DISBURSEMENT);
  assert.equal(result.parsed[1].txnType, TxnType.PENALTY);
  assert.equal(result.parsed[0].amount, 50000);
});

test("transaction parser skips unknown transaction types", async () => {
  const result = await parseTransactions(
    csvBuffer([
      ["Account Number", "Date", "Type", "Amount", "Balance After"],
      ["GL001", "2026-04-01", "BONUS", "500", "900"],
    ]),
    {
      dryRun: true,
      companyId: "cmp_1",
      existingAccounts: [{ id: "acct_1", accountNumber: "GL001" }],
    }
  );

  assert.equal(result.parsed.length, 0);
  assert.ok(result.errors.some((error) => error.field === "txn_type"));
});

test("transaction parser skips unknown account numbers", async () => {
  const result = await parseTransactions(
    csvBuffer([
      ["Account Number", "Date", "Type", "Amount", "Balance After"],
      ["GL404", "2026-04-01", "COLLECTION", "500", "900"],
    ]),
    {
      dryRun: true,
      companyId: "cmp_1",
      existingAccounts: [{ id: "acct_1", accountNumber: "GL001" }],
    }
  );

  assert.equal(result.parsed.length, 0);
  assert.equal(result.skipped[0].reason, "account not found");
});

test("transaction parser skips malformed amounts", async () => {
  const result = await parseTransactions(
    csvBuffer([
      ["Account Number", "Date", "Type", "Amount", "Balance After"],
      ["GL001", "2026-04-01", "COLLECTION", "not money", "900"],
    ]),
    {
      dryRun: true,
      companyId: "cmp_1",
      existingAccounts: [{ id: "acct_1", accountNumber: "GL001" }],
    }
  );

  assert.equal(result.parsed.length, 0);
  assert.ok(result.errors.some((error) => error.field === "amount"));
});
