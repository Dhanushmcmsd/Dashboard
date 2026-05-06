import * as XLSX from "xlsx";
const loanAliases = {
    loan_account_number: ["Loan Account No", "Account Number", "Loan No"],
    customer_id: ["Customer ID", "Cust ID", "Customer No"],
    closing_balance: ["Closing Balance", "Closing Bal", "OS Principal"],
    gold_weight_mg: ["Gold Weight", "Gold Wt", "Weight (gms)"],
    dpd_days: ["DPD", "Days Past Due", "Overdue Days"],
    branch_name: ["Branch", "Branch Name", "Branch Code"],
    disbursement_date: ["Disbursement Date", "Disb Date", "Loan Date"],
    interest_rate: ["Interest Rate", "Rate %", "Rate Per Annum"],
    disbursed_amount: ["Disbursed Value", "Disbursed Amount", "Loan Amount"]
};
const txnAliases = {
    interest_received: ["Total Interest Amount", "Interest Collected"],
    total_amount_received: ["Total Amount Received", "Amount Received"],
    principal_received: ["Principal Cr", "Principal Collection"],
    transaction_date: ["Transaction Date"],
    loan_account_number: ["Loan Account No", "Account Number", "Loan No"]
};
const toKey = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
const parseDate = (v) => {
    if (!v)
        return null;
    if (typeof v === "number") {
        const d = XLSX.SSF.parse_date_code(v);
        if (!d)
            return null;
        return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m)
        return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
};
const toPaise = (v) => (v == null || v === "" ? null : Math.round(Number(v) * 100));
const toMg = (v) => (v == null || v === "" ? null : Math.round(Number(v) * 1000));
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
function mapHeaders(headers, aliases) {
    const idx = new Map(headers.map((h, i) => [toKey(h), i]));
    const out = {};
    for (const [field, list] of Object.entries(aliases)) {
        for (const alias of list) {
            const i = idx.get(toKey(alias));
            if (i != null) {
                out[field] = i;
                break;
            }
        }
    }
    return out;
}
export function parseLoanBalance(buffer) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const headers = (rows[0] || []).map(String);
    const m = mapHeaders(headers, loanAliases);
    const out = rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== "")).map((r) => ({
        loan_account_number: String(r[m.loan_account_number] ?? "").trim().toUpperCase(),
        customer_id: String(r[m.customer_id] ?? "").trim(),
        closing_balance: toPaise(r[m.closing_balance]),
        gold_weight_mg: toMg(r[m.gold_weight_mg]),
        dpd_days: r[m.dpd_days] === "" || r[m.dpd_days] == null ? 0 : Number.parseInt(String(r[m.dpd_days]), 10) || 0,
        branch_name: titleCase(String(r[m.branch_name] ?? "").trim()),
        disbursement_date: parseDate(r[m.disbursement_date]),
        interest_rate: r[m.interest_rate] == null || r[m.interest_rate] === "" ? null : Number(r[m.interest_rate]),
        disbursed_amount: toPaise(r[m.disbursed_amount])
    }));
    const hasMissing = out.some((r) => r.closing_balance == null || r.dpd_days == null || Number.isNaN(r.dpd_days));
    if (hasMissing)
        throw new Error("Missing required closing_balance or dpd_days");
    return out;
}
export function parseTransactions(buffer) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const headers = (rows[0] || []).map(String);
    const m = mapHeaders(headers, txnAliases);
    return rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== "")).map((r) => ({
        loan_account_number: String(r[m.loan_account_number] ?? "").trim().toUpperCase(),
        transaction_date: parseDate(r[m.transaction_date]),
        principal_received: toPaise(r[m.principal_received]),
        interest_received: toPaise(r[m.interest_received]),
        other_charges_received: 0,
        total_amount_received: toPaise(r[m.total_amount_received])
    }));
}
