# Loan Balance Parser Rules

The loan balance parser reads `.xlsx`, `.xls`, and `.csv` files through the shared spreadsheet parser. Header matching normalizes case and punctuation, then accepts the closest alias with Levenshtein distance less than or equal to 2.

| Canonical field | Accepted aliases | Coercion rule | Validation rule |
| --- | --- | --- | --- |
| `account_number` | `Loan A/C No`, `Account Number`, `Loan Account`, `A/C No` | Trimmed string | Required and non-empty |
| `customer_name` | `Customer Name`, `Borrower Name`, `Name` | Trimmed string | Required and non-empty |
| `branch` | `Branch`, `Branch Name`, `Branch Code` | Trimmed string | Required and non-empty |
| `principal_outstanding` | `Principal Outstanding`, `O/S Principal`, `Balance` | Strip currency symbols and commas, parse as number | Required numeric value |
| `gold_weight_grams` | `Gold Weight`, `Gold Wt (g)`, `Net Weight Grams` | Strip commas, parse as number | Required numeric value |
| `ltv_percent` | `LTV %`, `LTV`, `Loan to Value` | Strip percent sign and commas, parse as number | Required numeric value |
| `interest_rate` | `Interest Rate`, `Rate %`, `ROI` | Strip percent sign and commas, parse as number | Required numeric value |
| `disbursement_date` | `Disbursement Date`, `Loan Date`, `Sanction Date` | Accept `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`, Excel date cells, and Excel serial dates | Required valid date |
| `maturity_date` | `Maturity Date`, `Due Date`, `Expiry Date` | Accept `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`, Excel date cells, and Excel serial dates | Optional; if present, must be valid |
| `bucket` | `Bucket`, `DPD Bucket`, `Overdue Category` | Normalize punctuation and case, map to `LoanBucket` | Required; unmappable text is a field error |

## Bucket Mapping

| Input values | Prisma value |
| --- | --- |
| `CURRENT`, `REGULAR`, `0`, `ZERO` | `CURRENT` |
| `DPD_0_30`, `0-30`, `0_30` | `DPD_0_30` |
| `DPD_31_60`, `31-60`, `31_60` | `DPD_31_60` |
| `DPD_61_90`, `61-90`, `61_90` | `DPD_61_90` |
| `DPD_90_PLUS`, `90+`, `90_PLUS`, `NPA` | `DPD_90_PLUS` |

## Parse Result

`parseLoans(buffer, { dryRun: true })` validates and returns:

```ts
{
  parsed: GoldLoanAccount[];
  skipped: { row: number; reason: string }[];
  errors: { field: string; count: number }[];
}
```

Dry-run mode performs no database writes. Non-dry-run mode requires `companyId`, `portfolioId`, and `uploadId`.
