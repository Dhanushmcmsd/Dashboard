import { pool } from "../db/pool.js";
import { parseLoanBalance, parseTransactions } from "./parser.js";
import { computeKpisForUpload } from "./kpi.js";
export async function processUpload(uploadId, statementType, buffer) {
    await pool.query(`UPDATE data_uploads SET status='processing' WHERE id=$1`, [uploadId]);
    try {
        if (statementType === "loan_balance") {
            const rows = parseLoanBalance(buffer);
            for (const r of rows) {
                await pool.query(`INSERT INTO gold_loan_accounts (upload_id, loan_account_number, customer_id, branch_name, disbursement_date, disbursed_amount, closing_balance, gold_weight_mg, interest_rate, dpd_days, principal_cr, statement_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,(SELECT statement_date FROM data_uploads WHERE id=$1))`, [uploadId, r.loan_account_number, r.customer_id, r.branch_name, r.disbursement_date, r.disbursed_amount, r.closing_balance, r.gold_weight_mg, r.interest_rate, r.dpd_days, null]);
            }
            await pool.query(`UPDATE data_uploads SET row_count=$2, status='success' WHERE id=$1`, [uploadId, rows.length]);
            await computeKpisForUpload(uploadId);
            return;
        }
        const rows = parseTransactions(buffer);
        for (const r of rows) {
            await pool.query(`INSERT INTO gold_loan_transactions (upload_id, loan_account_number, transaction_date, principal_received, interest_received, other_charges_received, total_amount_received, statement_period_start, statement_period_end)
         VALUES ($1,$2,$3,$4,$5,$6,$7,(SELECT date_trunc('month', statement_date)::date FROM data_uploads WHERE id=$1),(SELECT statement_date FROM data_uploads WHERE id=$1))`, [uploadId, r.loan_account_number, r.transaction_date, r.principal_received, r.interest_received, r.other_charges_received, r.total_amount_received]);
        }
        await pool.query(`UPDATE data_uploads SET row_count=$2, status='success' WHERE id=$1`, [uploadId, rows.length]);
        await computeKpisForUpload(uploadId);
    }
    catch (e) {
        await pool.query(`UPDATE data_uploads SET status='failed', error_log=$2 WHERE id=$1`, [uploadId, e?.message ?? "Processing failed"]);
    }
}
