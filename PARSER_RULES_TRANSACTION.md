# Transaction Parser Rules

The transaction parser reuses the shared spreadsheet parser conventions from [PARSER_RULES_LOAN_BALANCE.md](PARSER_RULES_LOAN_BALANCE.md): case-insensitive normalized headers, Levenshtein distance less than or equal to 2, numeric cleanup, and strict date validation.

| Canonical field | Accepted aliases | Coercion rule | Validation rule |
| --- | --- | --- | --- |
| `account_number` | `Loan A/C No`, `Account Number`, `A/C No` | Trimmed string | Required and must reference an existing `GoldLoanAccount` for the company |
| `txn_date` | `Transaction Date`, `Txn Date`, `Date`, `Value Date` | Accept `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`, Excel date cells, and Excel serial dates | Required valid date |
| `txn_type` | `Transaction Type`, `Txn Type`, `Nature`, `Type` | Trim, uppercase, collapse punctuation | Required and must map to `TxnType` |
| `amount` | `Amount`, `Txn Amount`, `Credit/Debit Amount` | Strip currency symbols and commas, parse as number | Required numeric value |
| `balance_after` | `Balance After`, `Outstanding After`, `Closing Balance` | Strip currency symbols and commas, parse as number | Required numeric value |

## Transaction Type Mapping

| Input values | Prisma value |
| --- | --- |
| `DISBURSAL`, `DISBURSEMENT`, `LOAN DISBURSAL` | `DISBURSEMENT` |
| `COLLECTION`, `REPAYMENT`, `PAYMENT RECEIVED` | `COLLECTION` |
| `INTEREST`, `INTEREST ACCRUAL`, `INT CHARGE` | `INTEREST_ACCRUAL` |
| `PENALTY`, `PENAL CHARGE` | `PENALTY` |
| `CLOSURE`, `LOAN CLOSURE`, `CLOSED` | `CLOSURE` |

Rows whose account number is not present in `gold_loan_accounts` for the current company are skipped with reason `account not found`.

## Parse Result

`parseTransactions(buffer, { dryRun: true, companyId })` validates and returns:

```ts
{
  parsed: GoldLoanTxn[];
  skipped: { row: number; reason: string }[];
  errors: { field: string; count: number }[];
}
```

Dry-run mode validates without writing transactions. Non-dry-run mode inserts parsed rows into `GoldLoanTxn`.
