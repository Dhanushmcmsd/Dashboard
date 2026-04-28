# 🏗️ Tech Plan & AI Coding Prompt
## Multi-Branch Financial Dashboard App

---

## PART 1 — TECH PLAN

---

### 1. Project Overview

A role-gated, multi-branch financial dashboard application for a company with 5 business units:
**Supermarket · Gold Loan · ML Loan · Vehicle Loan · Personal Loan**

Employees in each branch upload daily/monthly data (Excel or HTML dashboard files). The Management role gets a combined live view across all branches. An Admin role controls all user accounts and role assignments. Real-time alerts flow from Management to all online users via WebSockets.

---

### 2. Existing Tech Stack (confirmed from your codebase)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (credentials provider) |
| Real-time | Pusher (WebSocket) |
| Data fetching | TanStack React Query v5 |
| Validation | Zod |
| Password hashing | bcryptjs |
| Deployment | Vercel (with Vercel Cron) |
| Styling | Tailwind CSS |

**Add these missing packages:**
- `xlsx` — parse uploaded Excel files server-side
- `node-html-parser` — parse uploaded HTML dashboard files
- `date-fns` — date arithmetic for dateKey/monthKey helpers
- `sonner` — toast notifications (already referenced in hooks)
- `recharts` — charting for Management dashboard

---

### 3. Required Corrections to Existing Files

#### 3.1 `lib/constants.ts` — Fix branch names
The current file lists 10 geographic branches. Replace with the actual 5 business units:

```ts
export const BRANCHES = [
  "Supermarket",
  "Gold Loan",
  "ML Loan",
  "Vehicle Loan",
  "Personal Loan",
] as const;
```

Remove `ROLES` from this file — the Role enum lives in Prisma. Export only `BranchName`, `DPD_BUCKETS`, `BRANCH_COLORS`, `CACHE_TTL`, `UPLOAD_LIMITS`, `HTTP_STATUS`.

#### 3.2 `prisma/schema.prisma` — Add missing models
Route files reference `prisma.dailyMetric` and `prisma.monthlyMetric` which are absent from the current schema. Add them (see Section 4 for full schema).

#### 3.3 `vercel.json` — Fix cron schedule for IST midnight
```json
{
  "crons": [
    { "path": "/api/cron/daily-reset",   "schedule": "30 18 * * *"  },
    { "path": "/api/cron/monthly-reset", "schedule": "30 18 1 * *"  }
  ]
}
```
`18:30 UTC = 00:00 IST`. This is correct. Keep as-is.

---

### 4. Database Schema (Full — Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  EMPLOYEE
  MANAGEMENT
}

enum FileType {
  EXCEL
  HTML
}

// ─── User ────────────────────────────────────────────────────────────────────
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(EMPLOYEE)
  branches  String[] // assigned branch names; empty for ADMIN/MANAGEMENT
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  uploads Upload[]
  alerts  Alert[]
}

// ─── Upload (raw file record per branch per day) ─────────────────────────────
model Upload {
  id          String   @id @default(cuid())
  branch      String
  fileType    FileType
  fileName    String
  rawData     Json?    // parsed Excel rows
  htmlContent String?  // raw HTML string for HTML uploads
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  dateKey     String   // "YYYY-MM-DD"
  monthKey    String   // "YYYY-MM"

  user User @relation(fields: [uploadedBy], references: [id])

  @@index([branch, dateKey])
  @@index([uploadedBy])
  @@index([monthKey])
}

// ─── DPD Bucket (child of Upload rows) ───────────────────────────────────────
// Stored as nested JSON inside Upload.rawData; no separate table needed.

// ─── Daily Snapshot (computed combined dashboard for one day) ─────────────────
model DailySnapshot {
  id              String   @id @default(cuid())
  dateKey         String   @unique // "YYYY-MM-DD"
  combinedData    Json     // DailyDashboardData shape
  missingBranches String[] // branches that did not upload
  generatedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ─── Monthly Snapshot (computed combined dashboard for one month) ─────────────
model MonthlySnapshot {
  id           String   @id @default(cuid())
  monthKey     String   @unique // "YYYY-MM"
  combinedData Json     // MonthlyDashboardData shape
  generatedAt  DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// ─── Alert ────────────────────────────────────────────────────────────────────
model Alert {
  id      String   @id @default(cuid())
  message String
  sentBy  String
  sentAt  DateTime @default(now())

  user User @relation(fields: [sentBy], references: [id])

  @@index([sentAt])
}
```

> **Note:** `DailyMetric` / `MonthlyMetric` models referenced in some duplicate route files are **not needed** — data is stored as JSON inside `DailySnapshot.combinedData` and `Upload.rawData`. Delete `route (7).ts`, `route (8).ts`, `route (9).ts`, `route (10).ts` — they are stale duplicates. Use `route (2).ts` and `route (3).ts` as the canonical daily/monthly routes.

---

### 5. Full Project Directory Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx               # Login form (all roles)
│   │   └── signup/
│   │       └── page.tsx               # Registration form (pending admin activation)
│   │
│   ├── admin/
│   │   ├── layout.tsx                 # Admin shell (sidebar nav)
│   │   └── users/
│   │       └── page.tsx               # User management table + role/branch assignment
│   │
│   ├── employee/
│   │   ├── layout.tsx                 # Employee shell
│   │   ├── page.tsx                   # Branch selection cards
│   │   └── upload/
│   │       └── page.tsx               # File upload page (Excel / HTML)
│   │
│   ├── management/
│   │   ├── layout.tsx                 # Management shell with tab bar
│   │   ├── page.tsx                   # Redirects to /management/daily
│   │   ├── supermarket/page.tsx       # Branch-specific view
│   │   ├── gold-loan/page.tsx
│   │   ├── ml-loan/page.tsx
│   │   ├── vehicle-loan/page.tsx
│   │   ├── personal-loan/page.tsx
│   │   ├── daily/page.tsx             # Combined daily dashboard
│   │   ├── monthly/page.tsx           # Combined monthly dashboard
│   │   └── alerts/page.tsx            # Alert composer + history
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── users/
│       │   ├── route.ts               # GET all users (admin), POST create
│       │   └── [id]/route.ts          # PATCH role/branches, DELETE
│       ├── upload/
│       │   ├── route.ts               # POST file upload
│       │   └── history/route.ts       # GET own upload history
│       ├── dashboard/
│       │   ├── branch/route.ts        # GET latest upload for a branch
│       │   ├── daily/route.ts         # GET combined daily snapshot
│       │   └── monthly/route.ts       # GET combined monthly snapshot
│       ├── alerts/
│       │   └── route.ts               # GET list, POST new alert
│       └── cron/
│           ├── daily-reset/route.ts   # POST (cron) — rebuild daily snapshot at midnight
│           └── monthly-reset/route.ts # POST (cron) — rebuild monthly snapshot on 1st
│
├── components/
│   ├── ui/                            # shadcn/ui primitives (button, card, dialog …)
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   ├── EmployeeSidebar.tsx
│   │   └── ManagementTabBar.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── admin/
│   │   ├── UserTable.tsx              # Sortable table with role/branch editors
│   │   └── RoleAssignDialog.tsx
│   ├── employee/
│   │   ├── BranchCard.tsx             # Clickable branch selection card
│   │   └── FileUploadZone.tsx         # Drag-and-drop with type toggle (Excel/HTML)
│   ├── management/
│   │   ├── BranchUploadStatus.tsx     # "Uploaded ✓ / Pending ⏳ / Missing ✗" per branch
│   │   ├── DailyDashboard.tsx         # Combined daily view with charts
│   │   ├── MonthlyDashboard.tsx       # Combined monthly view with charts
│   │   ├── BranchDetailView.tsx       # Latest upload for a single branch
│   │   ├── KPICard.tsx                # Stat cards (closing balance, NPA, etc.)
│   │   ├── DpdBucketChart.tsx         # Bar chart for DPD buckets
│   │   ├── BranchComparisonChart.tsx  # Multi-branch bar/radar chart
│   │   └── AlertComposer.tsx          # Textarea + send button for management alerts
│   └── shared/
│       ├── AlertToast.tsx             # Real-time Pusher toast receiver
│       ├── UploadHistoryTable.tsx
│       └── MissingBranchBanner.tsx    # Warning banner listing missing branches
│
├── lib/
│   ├── auth.ts                        # NextAuth authOptions
│   ├── prisma.ts                      # PrismaClient singleton
│   ├── constants.ts                   # BRANCHES (5), colors, limits
│   ├── validations.ts                 # Zod schemas
│   ├── api-utils.ts                   # successResponse / errorResponse helpers
│   ├── pusher-server.ts               # Pusher server + triggerWithDedup
│   ├── pusher-client.ts               # Pusher client singleton
│   ├── query-client.ts                # TanStack Query client
│   ├── rate-limit.ts                  # In-memory rate limiter
│   ├── excel-parser.ts                # NEW — xlsx → ParsedExcelRow[]
│   ├── html-parser.ts                 # NEW — HTML file → structured metrics
│   ├── snapshot-generator.ts          # NEW — builds DailySnapshot / MonthlySnapshot
│   └── utils.ts                       # dateKey, monthKey, currency formatters
│
├── hooks/
│   ├── useAlerts.ts
│   ├── useDashboardData.ts
│   ├── useUploadHistory.ts
│   └── useUsers.ts                    # NEW — admin user management
│
├── types/
│   └── index.ts                       # All shared TypeScript types
│
├── middleware.ts                       # Route protection by role
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── vercel.json
└── .env.local
```

---

### 6. Authentication & Role-Based Access Control

#### Roles and permissions

| Capability | ADMIN | EMPLOYEE | MANAGEMENT |
|---|:---:|:---:|:---:|
| Create user accounts | ✓ | — | — |
| Assign roles & branches | ✓ | — | — |
| Deactivate users | ✓ | — | — |
| Select branch | — | ✓ | — |
| Upload Excel / HTML | — | ✓ | — |
| View own upload history | — | ✓ | — |
| View branch dashboards | — | — | ✓ |
| View daily combined dashboard | — | — | ✓ |
| View monthly combined dashboard | — | — | ✓ |
| Send alerts | — | — | ✓ |
| Receive real-time alerts | ✓ | ✓ | ✓ |

#### Signup flow
1. Anyone can register at `/signup` with name + email + password.
2. New accounts get `role = EMPLOYEE`, `isActive = false`, and `branches = []`.
3. Admin sees pending inactive users in the user table and can activate + assign role + assign branches.
4. User cannot log in until `isActive = true`.

#### Route protection (`middleware.ts`)
```
/admin/*       → requires Role.ADMIN
/employee/*    → requires Role.EMPLOYEE
/management/*  → requires Role.MANAGEMENT
/              → redirect to role home if logged in
```

---

### 7. Upload & Data Processing Flow

```
Employee selects branch
       │
       ▼
File upload (Excel .xlsx/.xls  OR  HTML .html/.htm)
       │
       ▼
POST /api/upload
  ├─ Auth check (EMPLOYEE role, branch assigned)
  ├─ File size / MIME validation
  ├─ Parse file:
  │   ├─ Excel → lib/excel-parser.ts → ParsedExcelRow[]
  │   └─ HTML  → lib/html-parser.ts  → ParsedExcelRow
  ├─ Zod validate parsed rows
  ├─ Save Upload record to DB (branch, rawData/htmlContent, dateKey, monthKey)
  ├─ Trigger snapshot regeneration for today's dateKey
  │   └─ lib/snapshot-generator.ts → upsert DailySnapshot
  └─ Pusher: trigger "upload-complete" on private-uploads channel
             → Management frontend auto-refreshes
```

#### Excel parser responsibilities (`lib/excel-parser.ts`)
- Use the `xlsx` npm package (SheetJS)
- Read first sheet; find header row
- Map column names to: branch, closingBalance, disbursement, collection, npa
- Map DPD bucket columns: "0 DPD", "1-30 DPD", "31-60 DPD", "61-90 DPD", "91-180 DPD", "181+ DPD" → count + amount per bucket
- Return `ParsedExcelRow[]` (validated with Zod)

#### HTML parser responsibilities (`lib/html-parser.ts`)
- Use `node-html-parser` to extract metric values from the uploaded HTML dashboard
- Look for elements with data attributes or known class names to extract the 5 KPIs
- Fall back to regex on text content if structured selectors fail
- Return one `ParsedExcelRow`

#### Snapshot generator (`lib/snapshot-generator.ts`)
```ts
async function buildDailySnapshot(dateKey: string): Promise<DailySnapshot>
async function buildMonthlySnapshot(monthKey: string): Promise<MonthlySnapshot>
```
- Query all `Upload` records for the given dateKey/monthKey
- Group by branch; take the most recent upload per branch
- Identify which of the 5 branches have uploaded (uploaded set) vs. missing set
- Aggregate totals across uploaded branches only
- **Never block on missing branches** — include `missingBranches` array in result
- Upsert `DailySnapshot` / `MonthlySnapshot` record

---

### 8. Management Dashboard — Tab Structure

| Tab | Route | Content |
|---|---|---|
| Supermarket | `/management/supermarket` | Latest upload data for Supermarket branch |
| Gold Loan | `/management/gold-loan` | Latest upload data for Gold Loan |
| ML Loan | `/management/ml-loan` | Latest upload for ML Loan |
| Vehicle Loan | `/management/vehicle-loan` | Latest upload for Vehicle Loan |
| Personal Loan | `/management/personal-loan` | Latest upload for Personal Loan |
| Daily Dashboard | `/management/daily` | Combined snapshot for today across all 5 branches |
| Monthly Dashboard | `/management/monthly` | Combined snapshot for current month |
| Alerts | `/management/alerts` | Send alert message + scrollable alert history |

Each branch tab shows:
- Upload status badge (Uploaded ✓ / Pending / Missing ✗)
- KPI cards: Closing Balance, Disbursement, Collection, NPA
- DPD bucket bar chart
- Uploaded by + timestamp

Daily/Monthly tabs show:
- `MissingBranchBanner` if any branch hasn't uploaded yet
- Combined KPI totals
- `BranchComparisonChart` — grouped bar chart comparing all 5 branches
- Per-branch breakdown rows

---

### 9. Real-Time Features (Pusher)

#### Channels

| Channel | Who subscribes | Events |
|---|---|---|
| `private-uploads` | Management | `upload-complete`, `upload-failed` |
| `private-alerts` | All roles | `new-alert` |
| `private-dashboard` | Management | `dashboard-updated` |

#### Flow after an employee uploads
1. Upload saved → snapshot regenerated
2. Server triggers `private-uploads` → `upload-complete` with `{ branch, dateKey }`
3. Management React Query invalidates `['dashboard', 'daily']` and `['dashboard', 'branch', branch]`
4. UI refreshes automatically without page reload

#### Alert flow
1. Management types a message in `AlertComposer` and clicks Send
2. `POST /api/alerts` saves Alert to DB, triggers `private-alerts` → `new-alert`
3. All online users receive a `sonner` toast (INFO / WARNING / CRITICAL severity)
4. Alerts page shows scrollable history sorted newest-first

---

### 10. Cron Jobs

| Job | Schedule (UTC) | IST equivalent | Action |
|---|---|---|---|
| `/api/cron/daily-reset` | `30 18 * * *` | 00:00 IST | Force-regenerate DailySnapshot for the new day; mark yesterday complete |
| `/api/cron/monthly-reset` | `30 18 1 * *` | 00:00 IST, 1st of month | Force-regenerate MonthlySnapshot for the new month |

Both routes are secured with `Authorization: Bearer CRON_SECRET` (set in Vercel env + `vercel.json`).

---

### 11. API Routes Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | — | NextAuth sign-in / sign-out |
| GET | `/api/users` | ADMIN | List all users (paginated) |
| POST | `/api/users` | ADMIN | Create user account |
| PATCH | `/api/users/[id]` | ADMIN | Update role, branches, isActive |
| DELETE | `/api/users/[id]` | ADMIN | Soft-delete (set isActive=false) |
| POST | `/api/upload` | EMPLOYEE | Upload Excel or HTML file |
| GET | `/api/upload/history` | EMPLOYEE | Own upload history (last 50) |
| GET | `/api/dashboard/branch?branch=X` | MANAGEMENT | Latest upload for branch X |
| GET | `/api/dashboard/daily` | MANAGEMENT | Today's combined DailySnapshot |
| GET | `/api/dashboard/monthly` | MANAGEMENT | Current month's MonthlySnapshot |
| GET | `/api/alerts` | ALL | Alert list (last 50) |
| POST | `/api/alerts` | MANAGEMENT | Send new alert |
| POST | `/api/cron/daily-reset` | CRON_SECRET | Force daily snapshot rebuild |
| POST | `/api/cron/monthly-reset` | CRON_SECRET | Force monthly snapshot rebuild |

---

### 12. Environment Variables

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/dbname"

# Auth
NEXTAUTH_SECRET="min-32-char-random-string"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Pusher
PUSHER_APP_ID="..."
PUSHER_SECRET="..."
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Cron
CRON_SECRET="min-32-char-random-string"
```

---

### 13. Design System

**Color palette — financial / professional dark theme:**
- Background: `#0F1117` (near-black)
- Surface: `#1A1D27` (card background)
- Border: `#2A2D3A`
- Primary accent: `#4F6EF7` (indigo-blue)
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Text primary: `#F1F5F9`
- Text muted: `#94A3B8`

**Branch colors** (for charts):
```ts
"Supermarket":    "#4F6EF7"   // indigo
"Gold Loan":      "#F59E0B"   // amber
"ML Loan":        "#10B981"   // emerald
"Vehicle Loan":   "#EC4899"   // pink
"Personal Loan":  "#8B5CF6"   // violet
```

**Typography:** Use `Geist` (Next.js default) for body, `Geist Mono` for numbers/data.

---

---

## PART 2 — AI CODING PROMPT

---

> **How to use:** Paste this entire prompt block into GitHub Copilot Chat, Cursor Composer, or your AI coding assistant of choice. It contains the full project context so the AI can generate each file correctly.

---

```
You are an expert Next.js 14 (App Router) TypeScript developer. I am building a
multi-branch financial dashboard application. I will give you the full context below
and then ask you to generate specific files one at a time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Stack
- Next.js 14, App Router, TypeScript strict mode
- PostgreSQL + Prisma ORM
- NextAuth.js (credentials provider, JWT strategy)
- Pusher (WebSocket real-time)
- TanStack React Query v5
- Zod validation
- Tailwind CSS + shadcn/ui
- Recharts for data visualisation
- SheetJS (xlsx) for Excel parsing
- node-html-parser for HTML parsing
- Vercel deployment with Vercel Cron

## Business rules
- Company has exactly 5 branches: "Supermarket", "Gold Loan", "ML Loan",
  "Vehicle Loan", "Personal Loan"
- There are 3 roles: ADMIN, EMPLOYEE, MANAGEMENT
- ADMIN: can create users and assign roles + branches; no dashboard access
- EMPLOYEE: assigned to one or more branches; uploads Excel or HTML files daily
- MANAGEMENT: reads all dashboards; sends alerts; cannot upload
- New registrations create an account with isActive=false; ADMIN must activate
  and assign a role before the user can log in
- Employees see only their assigned branches on the branch-selection screen
- Management sees 8 tabs: 5 branch tabs + Daily Dashboard + Monthly Dashboard + Alerts
- Daily snapshots are rebuilt every midnight IST (18:30 UTC); monthly on 1st midnight IST
- When a branch has not uploaded for the day, the combined dashboard still generates
  but lists that branch in missingBranches[] and excludes it from totals
- KPI fields per branch: closingBalance, disbursement, collection, npa,
  plus DPD buckets: "0", "1-30", "31-60", "61-90", "91-180", "181+"
  each bucket has a count (number of accounts) and amount (₹ value)

## Prisma schema (use exactly as written)
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { ADMIN EMPLOYEE MANAGEMENT }
enum FileType { EXCEL HTML }

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(EMPLOYEE)
  branches  String[]
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  uploads   Upload[]
  alerts    Alert[]
}

model Upload {
  id          String   @id @default(cuid())
  branch      String
  fileType    FileType
  fileName    String
  rawData     Json?
  htmlContent String?
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  dateKey     String
  monthKey    String
  user        User     @relation(fields: [uploadedBy], references: [id])
  @@index([branch, dateKey])
  @@index([uploadedBy])
  @@index([monthKey])
}

model DailySnapshot {
  id              String   @id @default(cuid())
  dateKey         String   @unique
  combinedData    Json
  missingBranches String[]
  generatedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model MonthlySnapshot {
  id           String   @id @default(cuid())
  monthKey     String   @unique
  combinedData Json
  generatedAt  DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Alert {
  id      String   @id @default(cuid())
  message String
  sentBy  String
  sentAt  DateTime @default(now())
  user    User     @relation(fields: [sentBy], references: [id])
  @@index([sentAt])
}
```

## TypeScript types (types/index.ts)
```ts
export const BRANCHES = [
  "Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"
] as const;
export type BranchName = typeof BRANCHES[number];
export const DPD_BUCKETS = ["0","1-30","31-60","61-90","91-180","181+"] as const;
export type DpdBucket = typeof DPD_BUCKETS[number];

export interface DpdBucketData { bucket: DpdBucket; count: number; amount: number; }
export interface ParsedExcelRow {
  branch: BranchName;
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  dpdBuckets: Record<DpdBucket, { count: number; amount: number }>;
}
export interface BranchDailyMetric extends ParsedExcelRow {
  uploadedBy: string;
  uploadedAt: string;
  fileName: string;
}
export interface DailyDashboardData {
  dateKey: string;
  lastUpdated: string;
  uploadedBranches: BranchName[];
  missingBranches: BranchName[];
  branches: BranchDailyMetric[];
  totals: { closingBalance: number; disbursement: number; collection: number; npa: number };
}
export interface BranchMonthlyMetric extends BranchDailyMetric {
  growthPercent: number | null;
  trend: "up" | "down" | "neutral";
}
export interface MonthlyDashboardData {
  monthKey: string;
  lastUpdated: string;
  branches: BranchMonthlyMetric[];
  totals: { closingBalance: number; disbursement: number; collection: number; npa: number };
}
export interface AlertRecord {
  id: string;
  message: string;
  sentBy: string;
  sentByName: string;
  sentAt: string;
}
export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Session user shape (NextAuth JWT)
```ts
interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE" | "MANAGEMENT";
  branches: string[];
}
```

## Pusher channels and events
- Channel "private-alerts" → event "new-alert" → payload: AlertRecord
- Channel "private-uploads" → event "upload-complete" → payload: { branch, dateKey }
- Channel "private-dashboard" → event "dashboard-updated" → payload: { dateKey }

## Design tokens (Tailwind / CSS variables)
- Background: #0F1117, Surface: #1A1D27, Border: #2A2D3A
- Primary: #4F6EF7, Success: #22C55E, Warning: #F59E0B, Danger: #EF4444
- Text primary: #F1F5F9, Text muted: #94A3B8
- Branch colors: Supermarket #4F6EF7, Gold Loan #F59E0B, ML Loan #10B981,
  Vehicle Loan #EC4899, Personal Loan #8B5CF6
- Font: Geist for body, Geist Mono for numeric data

## Key lib files already implemented (do not rewrite unless asked)
- lib/auth.ts — NextAuth authOptions with credentials provider
- lib/prisma.ts — PrismaClient singleton
- lib/api-utils.ts — successResponse(), errorResponse(), parseSearchParams()
- lib/pusher-server.ts — pusherServer instance + PUSHER_CHANNELS + PUSHER_EVENTS
- lib/pusher-client.ts — getPusherClient() singleton
- lib/rate-limit.ts — in-memory rate limiter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When I ask you to generate a file, follow these rules:
1. Output the complete file — no placeholders, no "// TODO" unless explicitly noted
2. Use the exact types, constants, and API shapes defined above
3. Apply the design tokens via Tailwind classes — dark background, card surfaces,
   indigo primary, proper text hierarchy
4. All API routes must:
   a. Call getServerSession(authOptions) first
   b. Check role with strict equality ("ADMIN", "EMPLOYEE", "MANAGEMENT")
   c. Return successResponse() / errorResponse() from lib/api-utils.ts
   d. Wrap everything in try/catch
5. All React components must be "use client" only when they need browser APIs
   or hooks; prefer Server Components for data-only pages
6. Use React Query for all client-side fetching — never raw fetch in components
7. Never expose password hash in any API response (use Prisma select to exclude)
8. For number display, format currency as Indian Rupees: ₹ with Indian lakh/crore
   notation (use toLocaleString("en-IN"))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER (recommended sequence to avoid missing imports)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 — Foundation
  1.  lib/constants.ts              (fix BRANCHES to 5 business units)
  2.  types/index.ts                (full shared types as above)
  3.  lib/validations.ts            (Zod schemas for all API inputs)
  4.  lib/utils.ts                  (dateKey, monthKey, formatINR helpers)
  5.  middleware.ts                 (role-based route protection)

Phase 2 — Core server logic
  6.  lib/excel-parser.ts           (SheetJS → ParsedExcelRow[])
  7.  lib/html-parser.ts            (node-html-parser → ParsedExcelRow)
  8.  lib/snapshot-generator.ts     (buildDailySnapshot, buildMonthlySnapshot)

Phase 3 — API routes
  9.  app/api/auth/[...nextauth]/route.ts
  10. app/api/users/route.ts         (GET list, POST create — ADMIN only)
  11. app/api/users/[id]/route.ts    (PATCH role/branches/isActive, DELETE)
  12. app/api/upload/route.ts        (POST — EMPLOYEE only)
  13. app/api/upload/history/route.ts
  14. app/api/dashboard/branch/route.ts
  15. app/api/dashboard/daily/route.ts
  16. app/api/dashboard/monthly/route.ts
  17. app/api/alerts/route.ts
  18. app/api/cron/daily-reset/route.ts
  19. app/api/cron/monthly-reset/route.ts

Phase 4 — Shared UI components
  20. components/shared/AlertToast.tsx        (Pusher subscription + sonner)
  21. components/shared/MissingBranchBanner.tsx
  22. components/management/KPICard.tsx
  23. components/management/DpdBucketChart.tsx
  24. components/management/BranchComparisonChart.tsx
  25. components/management/BranchUploadStatus.tsx

Phase 5 — Auth pages
  26. app/(auth)/login/page.tsx
  27. app/(auth)/signup/page.tsx

Phase 6 — Admin frontend
  28. app/admin/layout.tsx
  29. components/admin/UserTable.tsx
  30. components/admin/RoleAssignDialog.tsx
  31. app/admin/users/page.tsx

Phase 7 — Employee frontend
  32. app/employee/layout.tsx
  33. components/employee/BranchCard.tsx
  34. components/employee/FileUploadZone.tsx
  35. app/employee/page.tsx           (branch selection)
  36. app/employee/upload/page.tsx    (upload interface)

Phase 8 — Management frontend
  37. app/management/layout.tsx       (8-tab bar)
  38. components/management/BranchDetailView.tsx
  39. components/management/DailyDashboard.tsx
  40. components/management/MonthlyDashboard.tsx
  41. components/management/AlertComposer.tsx
  42. app/management/supermarket/page.tsx
  43. app/management/gold-loan/page.tsx
  44. app/management/ml-loan/page.tsx
  45. app/management/vehicle-loan/page.tsx
  46. app/management/personal-loan/page.tsx
  47. app/management/daily/page.tsx
  48. app/management/monthly/page.tsx
  49. app/management/alerts/page.tsx

Phase 9 — Hooks
  50. hooks/useUsers.ts
  51. hooks/useDashboardData.ts       (update for new API shape)
  52. hooks/useUploadHistory.ts       (update)
  53. hooks/useAlerts.ts              (update)

Phase 10 — Seeding & config
  54. prisma/seed.ts                  (update branch names to 5 business units)
  55. vercel.json                     (cron jobs)
  56. .env.local.example

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now generate: [SPECIFY FILE NAME HERE]
```

---

## PART 3 — KNOWN ISSUES IN EXISTING CODEBASE TO FIX

| File | Problem | Fix |
|---|---|---|
| `lib/constants.ts` | Has 10 geographic branches instead of 5 business units | Replace BRANCHES array with the 5 correct names |
| `prisma/schema.prisma` | Missing `isActive` field on User | Add `isActive Boolean @default(false)` |
| `route (7).ts` to `route (10).ts` | Stale duplicates referencing non-existent `dailyMetric`/`monthlyMetric` Prisma models | Delete these files; use `route (2).ts` and `route (3).ts` as canonical |
| `lib/pusher-server.ts` | Exports as `export default` in one place and `export const` in another causing import conflicts | Standardise to named export `export const pusherServer` |
| `app/api/alerts/route.ts` | Uses `import pusherServer from "@/lib/pusher"` (default import from wrong path) | Fix to `import { pusherServer } from "@/lib/pusher-server"` |
| `QueryProvider (1).tsx` / `(2).tsx` | Duplicate files left in repo | Delete duplicates; keep one `QueryProvider.tsx` |

---

## PART 4 — QUICK-START COMMANDS

```bash
# 1. Install missing packages
npm install xlsx node-html-parser date-fns recharts sonner

# 2. Apply schema migrations
npx prisma migrate dev --name add-isactive-and-snapshots

# 3. Seed the database
npx prisma db seed

# 4. Run locally
npm run dev

# 5. Test cron endpoints locally
curl -X POST http://localhost:3000/api/cron/daily-reset \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

*Document generated: April 2026 — based on codebase analysis of dashboard_app.rar*
