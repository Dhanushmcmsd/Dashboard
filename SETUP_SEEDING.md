# SETUP & SEEDING GUIDE
> Batch 3b · How to get a local dev database to a known-good state.

---

## Prerequisites

| Requirement | Minimum version | Check command |
|---|---|---|
| Node.js | 18.x | `node -v` |
| npm | 9.x | `npm -v` |
| PostgreSQL access | 14+ (or Neon/Supabase URL) | — |
| `.env.local` with `DATABASE_URL` | — | `cat .env.local` |

### Required `.env.local` variables

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **Neon users:** copy the connection string from your Neon project dashboard.
> Use the **pooled** connection string for the app and the **direct** connection string for migrations.

---

## First-Time Setup (fresh database)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Apply all migrations
npm run db:migrate
# When prompted: enter a migration name, e.g. "initial"

# 4. Seed the database
npm run seed
```

### Expected output for step 4

```
🌱  Starting idempotent seed...

── Companies
  ✅ Company: Supra Pacific Finance (supra-pacific) — active
  ✅ Company: Alpha Finance Corporation (alpha-finance) — active
  ✅ Company: Beta Credits Limited (beta-credits) — active
  ✅ Company: Gamma Lending Solutions (gamma-lending) — inactive
  ✅ Company: Delta Capital Partners (delta-capital) — inactive
  ✅ Company: Epsilon Financial Services (epsilon-fin) — inactive

── Portfolios
  ✅ supra-pacific: 5 portfolios scaffolded (1 active: GOLD_LOAN)
  ... (repeated for each company)

── Test Users (Supra Pacific)
  ✅ SUPER_ADMIN  → superadmin@supra-pacific.com
  ✅ ADMIN        → admin@supra-pacific.com
  ✅ MANAGEMENT   → management@supra-pacific.com
  ✅ EMPLOYEE     → emp.goldloan@supra-pacific.com  (branch: Gold Loan)

── Legacy Users (backward compat)
  ✅ ADMIN (legacy) → admin@company.com
  ...

╬══... Seed complete! ...═╪
```

---

## Test Credentials

### New Accounts (Supra Pacific scope)

| Role | Email | Password |
|---|---|---|
| `SUPER_ADMIN` | `superadmin@supra-pacific.com` | `SuperAdmin@123` |
| `ADMIN` | `admin@supra-pacific.com` | `CompAdmin@123` |
| `MANAGEMENT` | `management@supra-pacific.com` | `Mgmt@123` |
| `EMPLOYEE` | `emp.goldloan@supra-pacific.com` | `Employee@123` |

### Legacy Accounts (backward compatibility)

| Role | Email | Password |
|---|---|---|
| `ADMIN` | `admin@company.com` | `admin123` |
| `MANAGEMENT` | `management@company.com` | `mgmt123` |
| `EMPLOYEE` | `emp1@company.com` – `emp5@company.com` | `emp123` |

> **Security note:** These credentials are for local development only.
> Never use these in staging or production environments.

---

## Re-running the Seed (idempotent)

Running `npm run seed` a second time is safe — all operations use `upsert`.

```bash
npm run seed
# Same output as first run; no duplicate rows created
```

---

## Reset & Re-seed (clean slate)

This truncates all tenant-scoped tables (Company, Portfolio, DataUpload, GoldLoanAccount,
GoldLoanTxn, KpiSnapshot) and then re-seeds. **Auth data is preserved** (User, PasswordResetToken, AuditLog).

```bash
npm run seed:reset
```

### What is deleted

| Table | Deleted | Preserved |
|---|---|---|
| `Company` | ✅ All rows | — |
| `Portfolio` | ✅ All rows | — |
| `DataUpload` | ✅ All rows | — |
| `GoldLoanAccount` | ✅ All rows | — |
| `GoldLoanTxn` | ✅ All rows | — |
| `KpiSnapshot` | ✅ All rows | — |
| `User.companyId` | ✅ Set to NULL | User rows kept |
| `User` | — | ✅ Kept |
| `AuditLog` | — | ✅ Kept |
| `DashboardLayout` | — | ✅ Kept |
| `Upload` (legacy) | — | ✅ Kept |
| `DailySnapshot` | — | ✅ Kept |
| `MonthlySnapshot` | — | ✅ Kept |

> ⚠️ **Do not run `seed:reset` against a production database.** It deletes all gold loan accounts and KPI data irreversibly.

---

## All Available Scripts

| Script | Command | What it does |
|---|---|---|
| `seed` | `npm run seed` | Idempotent seed (safe to run anytime) |
| `seed:reset` | `npm run seed:reset` | Truncate tenant tables + re-seed |
| `db:migrate` | `npm run db:migrate` | Run pending Prisma migrations |
| `db:generate` | `npm run db:generate` | Regenerate Prisma client after schema change |
| `db:push` | `npm run db:push` | Push schema to DB without migration file (dev only) |
| `db:studio` | `npm run db:studio` | Open Prisma Studio GUI at localhost:5555 |

---

## Troubleshooting

### Error: `Environment variable not found: DATABASE_URL`

**Cause:** `.env.local` file is missing or not in the project root.

**Fix:**
```bash
# Check file exists
ls -la .env.local

# If missing, create it:
cp .env.example .env.local
# Then fill in your DATABASE_URL
```

---

### Error: `P1001: Can't reach database server`

**Cause:** The database host is unreachable (wrong URL, VPN required, Neon project paused).

**Fix:**
```bash
# Test connection directly
npx prisma db execute --stdin <<< "SELECT 1" --schema prisma/schema.prisma

# For Neon: check the project is not paused in the Neon dashboard
# For local Postgres: ensure the service is running
pg_isready -h localhost -p 5432
```

---

### Error: `P2002: Unique constraint failed on the fields: (slug)`

**Cause:** Seed ran successfully before, and something changed that caused it to call `create` instead of `upsert`. This should not happen with the current seed — if it does, a schema migration may have recreated the table.

**Fix:**
```bash
# Full reset
npm run seed:reset
```

---

### Error: `P2003: Foreign key constraint failed on the field: companyId`

**Cause:** A user was created with a `companyId` before the `Company` row exists. This can happen if seed ran partially.

**Fix:**
```bash
# Reset and re-run from clean state
npm run seed:reset
```

---

### Error: `The table 'public.Company' does not exist`

**Cause:** Prisma migrations have not been run yet, or the schema was updated but `prisma migrate dev` was not run.

**Fix:**
```bash
npm run db:migrate
# or for quick dev without migration files:
npm run db:push
npm run seed
```

---

### Error: `Unknown argument 'companyId'` or TypeScript compile error in seed

**Cause:** Prisma client has not been regenerated after the Batch 3 schema change.

**Fix:**
```bash
npm run db:generate
# Then retry:
npm run seed
```

---

### Error: `tsx: command not found`

**Cause:** `tsx` is not installed globally and the local binary is not on PATH.

**Fix:**
```bash
npm install
# Then retry — npm scripts use local node_modules/.bin automatically
npm run seed
```

---

### Seed runs but no Company rows appear in Prisma Studio

**Cause:** You may be connected to a different database than what `.env.local` points to.

**Fix:**
```bash
# Confirm which DB you're connected to
grep DATABASE_URL .env.local

# Open Studio against .env.local explicitly
npm run db:studio
# Then browse the Company table
```

---

### `bcrypt hash is slow` — seed takes >60s

**Cause:** bcrypt with cost factor 12 hashes 16 users sequentially. Each hash takes ~300ms on slow hardware.

**Fix:** In `prisma/seed.ts`, reduce the cost factor temporarily for local dev:
```typescript
// Change line:
async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12); // ← change 12 to 10 for faster local seeds
}
```
> Do not reduce cost factor below 10 in any shared environment.

---

## Seed File Reference

| File | Purpose |
|---|---|
| `prisma/seed.ts` | Main idempotent seed entry point (Companies, Portfolios, Users) |
| `prisma/reset.ts` | Truncates tenant tables in FK-safe order before re-seed |
| `SETUP_SEEDING.md` | This file |
