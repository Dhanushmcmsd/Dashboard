# API Surface

## Gold Loan Data Access

| Function | Input | Output type | Auth | Company-scoped? |
| --- | --- | --- | --- | --- |
| `getGoldLoanKpis` | `companySlug, periodType, asOnDate` | `Record<string, number>` | `withCompanyScope()` | Yes |
| `getGoldLoanBuckets` | `companySlug, asOnDate` | `{ bucket, amount, count, percent }[]` | `withCompanyScope()` | Yes |
| `getHighRiskAccounts` | `companySlug, asOnDate, ltvThreshold?` | `GoldLoanAccount[]` | `withCompanyScope()` | Yes |
| `getDisbursementTrend` | `companySlug, days?` | `{ date, amount }[]` | `withCompanyScope()` | Yes |
| `getBranchPerformance` | `companySlug, periodType, asOnDate` | `{ branch, aum, collection, npa_percent }[]` | `withCompanyScope()` | Yes |
| `getAlerts` | `companySlug` | `{ type, message, severity }[]` | `withCompanyScope()` | Yes |
| `getDashboardData` | `companySlug, periodType, asOnDate` | aggregate object | `withCompanyScope()` | Yes |

## Endpoint Examples

```bash
curl "http://localhost:3000/api/gold-loan/kpis?companySlug=acme&periodType=MTD&asOnDate=2026-05-05"
```

```bash
curl "http://localhost:3000/api/gold-loan/buckets?companySlug=acme&asOnDate=2026-05-05"
```

```bash
curl "http://localhost:3000/api/gold-loan/high-risk?companySlug=acme&asOnDate=2026-05-05&ltvThreshold=75"
```

```bash
curl "http://localhost:3000/api/gold-loan/disbursement-trend?companySlug=acme&days=30"
```

```bash
curl "http://localhost:3000/api/gold-loan/branch-performance?companySlug=acme&periodType=MTD&asOnDate=2026-05-05"
```

```bash
curl "http://localhost:3000/api/gold-loan/alerts?companySlug=acme"
```

```bash
curl "http://localhost:3000/api/gold-loan/dashboard?companySlug=acme&periodType=MTD&asOnDate=2026-05-05"
```

## Client Hook Example

```ts
const { data, isLoading, error } = useGoldLoanDashboard(companySlug, periodType, asOnDate);
```
