# KPI Engine Notes

## Data Availability

Available in schema:

- `GoldLoanAccount`
  - `principalOutstanding`, `customerName`, `interestRate`, `goldWeightGrams`, `ltvPercent`
  - `bucket`, `isNpa`, `status`, `deletedAt`, `disbursementDate`
- `GoldLoanTxn`
  - `txnDate`, `txnType`, `amount`, `accountId`
- `KpiSnapshot`
  - Unique key: `(companyId, portfolioId, periodType, asOnDate, metricKey)`

Assumed absent:

- No historical day-start overdue snapshot table.
- No direct DPD numeric field in `GoldLoanAccount` (bucket enum only).
- No explicit customer ID in `GoldLoanAccount` (customer identity uses `customerName`).

## Formulas

All metrics are written per `periodType` in `{FTD, MTD, YTD}`.

- `total_aum`
  - `SUM(GoldLoanAccount.principalOutstanding)` for active accounts.
- `total_customers`
  - `COUNT(DISTINCT GoldLoanAccount.customerName)` for active accounts.
- `avg_ticket_size`
  - `total_aum / total_customers`.
- `yield_percent`
  - Weighted average:
  - `SUM(interestRate * principalOutstanding) / SUM(principalOutstanding)`.
- `new_disbursement`
  - `SUM(GoldLoanTxn.amount)` where `txnType = DISBURSEMENT` in period.
- `total_collection`
  - `SUM(GoldLoanTxn.amount)` where `txnType = COLLECTION` in period.
- `overdue_collection`
  - `SUM(GoldLoanTxn.amount)` where `txnType = COLLECTION` and related account bucket is not `CURRENT`.
- `collection_efficiency`
  - `overdue_collection / opening_overdue_balance`.
- `total_gold_weight`
  - `SUM(GoldLoanAccount.goldWeightGrams)` for active accounts.
- `avg_ltv`
  - Weighted average:
  - `SUM(ltvPercent * principalOutstanding) / SUM(principalOutstanding)`.
- `gnpa_amount`
  - `SUM(principalOutstanding)` where `bucket = DPD_90_PLUS OR isNpa = true`.
- `gnpa_percent`
  - `gnpa_amount / total_aum * 100`.
- `bucket_0_30`
  - `SUM(principalOutstanding)` where `bucket = DPD_0_30`.
- `bucket_31_60`
  - `SUM(principalOutstanding)` where `bucket = DPD_31_60`.
- `bucket_61_90`
  - `SUM(principalOutstanding)` where `bucket = DPD_61_90`.
- `bucket_90_plus`
  - `SUM(principalOutstanding)` where `bucket = DPD_90_PLUS`.

## Assumptions

1. `collection_efficiency`
   - Exact opening overdue balance at period start is not stored historically.
   - Engine approximation:
   - `opening_overdue_balance = SUM(principalOutstanding for overdue accounts disbursed before period start)`.
   - If `opening_overdue_balance = 0`, efficiency is stored as `0`.

2. `YTD` start
   - Uses calendar year start (`Jan 1`) as year-to-date boundary.

3. Customer identity
   - Distinct customer counts are derived from `customerName` because no stable customer ID exists.

## Bucket Boundary Definition

Business rule uses half-open DPD intervals:

- `bucket_0_30`: `DPD >= 0 AND DPD < 31`
- `bucket_31_60`: `DPD >= 31 AND DPD < 61`
- `bucket_61_90`: `DPD >= 61 AND DPD < 91`
- `bucket_90_plus`: `DPD >= 91`

Current implementation maps from persisted `LoanBucket` enum values
(`DPD_0_30`, `DPD_31_60`, `DPD_61_90`, `DPD_90_PLUS`) because account-level raw DPD is not stored.
