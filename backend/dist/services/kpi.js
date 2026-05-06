import { pool } from "../db/pool.js";
function fyStart(date) {
    const y = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
    return new Date(Date.UTC(y, 3, 1));
}
export async function computeKpisForUpload(uploadId) {
    const { rows } = await pool.query(`SELECT id, portfolio_id, statement_date FROM data_uploads WHERE id = $1`, [uploadId]);
    if (!rows[0])
        return;
    const { portfolio_id, statement_date } = rows[0];
    const asOf = new Date(statement_date);
    const periods = [
        { t: "ftd", s: asOf },
        { t: "mtd", s: new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1)) },
        { t: "ytd", s: fyStart(asOf) }
    ];
    for (const p of periods) {
        await pool.query(`WITH acc AS (
        SELECT * FROM gold_loan_accounts
        WHERE upload_id IN (
          SELECT id FROM data_uploads WHERE portfolio_id = $1 AND statement_date >= $2::date AND statement_date <= $3::date
        )
      ), txn AS (
        SELECT * FROM gold_loan_transactions
        WHERE upload_id IN (
          SELECT id FROM data_uploads WHERE portfolio_id = $1 AND statement_date >= $2::date AND statement_date <= $3::date
        )
      ), base AS (
        SELECT
          COALESCE(SUM(closing_balance),0)::bigint total_aum,
          COUNT(DISTINCT customer_id)::int total_customers,
          CASE WHEN COUNT(DISTINCT loan_account_number)=0 THEN 0 ELSE (COALESCE(SUM(closing_balance),0)/COUNT(DISTINCT loan_account_number))::bigint END avg_ticket_size,
          CASE WHEN COALESCE(SUM(closing_balance),0)=0 THEN 0 ELSE COALESCE(SUM(interest_rate * closing_balance),0)/SUM(closing_balance) END yield_pct,
          COALESCE(SUM(CASE WHEN disbursement_date >= $2::date AND disbursement_date <= $3::date THEN disbursed_amount ELSE 0 END),0)::bigint new_disbursement,
          COALESCE(SUM(CASE WHEN dpd_days > 90 THEN closing_balance ELSE 0 END),0)::bigint gnpa_amount,
          COALESCE(SUM(gold_weight_mg),0)::bigint total_gold_weight_mg,
          CASE WHEN COUNT(*)=0 THEN 0 ELSE AVG(CASE WHEN gold_weight_mg > 0 AND disbursed_amount IS NOT NULL AND prt.gold_rate_per_gram > 0 THEN (disbursed_amount::numeric / ((gold_weight_mg::numeric/1000) * prt.gold_rate_per_gram))*100 ELSE 0 END) END avg_ltv_pct,
          COALESCE(SUM(CASE WHEN dpd_days BETWEEN 1 AND 30 THEN closing_balance ELSE 0 END),0)::bigint bucket_0_30,
          COALESCE(SUM(CASE WHEN dpd_days BETWEEN 31 AND 60 THEN closing_balance ELSE 0 END),0)::bigint bucket_31_60,
          COALESCE(SUM(CASE WHEN dpd_days BETWEEN 61 AND 90 THEN closing_balance ELSE 0 END),0)::bigint bucket_61_90,
          COALESCE(SUM(CASE WHEN dpd_days > 90 THEN closing_balance ELSE 0 END),0)::bigint bucket_90_plus,
          COALESCE(SUM(CASE WHEN dpd_days > 0 THEN closing_balance ELSE 0 END),0)::numeric overdue_base
        FROM acc CROSS JOIN portfolios prt WHERE prt.id = $1
      ), col AS (
        SELECT
          COALESCE(SUM(total_amount_received),0)::bigint total_collection,
          COALESCE(SUM(CASE WHEN loan_account_number IN (SELECT loan_account_number FROM acc WHERE dpd_days > 0) THEN total_amount_received ELSE 0 END),0)::bigint overdue_collection
        FROM txn
      )
      INSERT INTO kpi_snapshots (
        portfolio_id, period_type, as_of_date, total_aum, total_customers, avg_ticket_size,
        yield_pct, gnpa_amount, gnpa_pct, collection_efficiency_pct, total_gold_weight_mg,
        avg_ltv_pct, new_disbursement, total_collection, overdue_collection,
        bucket_0_30, bucket_31_60, bucket_61_90, bucket_90_plus, computed_at
      )
      SELECT
        $1, $4, $3::date, b.total_aum, b.total_customers, b.avg_ticket_size,
        b.yield_pct,
        b.gnpa_amount,
        CASE WHEN b.total_aum=0 THEN 0 ELSE (b.gnpa_amount::numeric/b.total_aum)*100 END,
        CASE WHEN b.overdue_base=0 THEN 0 ELSE (c.overdue_collection::numeric/b.overdue_base)*100 END,
        b.total_gold_weight_mg, b.avg_ltv_pct, b.new_disbursement, c.total_collection, c.overdue_collection,
        b.bucket_0_30, b.bucket_31_60, b.bucket_61_90, b.bucket_90_plus, now()
      FROM base b CROSS JOIN col c
      ON CONFLICT (portfolio_id, period_type, as_of_date)
      DO UPDATE SET
        total_aum=EXCLUDED.total_aum,
        total_customers=EXCLUDED.total_customers,
        avg_ticket_size=EXCLUDED.avg_ticket_size,
        yield_pct=EXCLUDED.yield_pct,
        gnpa_amount=EXCLUDED.gnpa_amount,
        gnpa_pct=EXCLUDED.gnpa_pct,
        collection_efficiency_pct=EXCLUDED.collection_efficiency_pct,
        total_gold_weight_mg=EXCLUDED.total_gold_weight_mg,
        avg_ltv_pct=EXCLUDED.avg_ltv_pct,
        new_disbursement=EXCLUDED.new_disbursement,
        total_collection=EXCLUDED.total_collection,
        overdue_collection=EXCLUDED.overdue_collection,
        bucket_0_30=EXCLUDED.bucket_0_30,
        bucket_31_60=EXCLUDED.bucket_31_60,
        bucket_61_90=EXCLUDED.bucket_61_90,
        bucket_90_plus=EXCLUDED.bucket_90_plus,
        computed_at=now()`, [portfolio_id, p.s.toISOString().slice(0, 10), asOf.toISOString().slice(0, 10), p.t]);
    }
}
