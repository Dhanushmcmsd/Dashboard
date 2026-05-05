# MIGRATION NOTES — Supra Pacific Dashboard

> **Purpose:** Record all assumptions from the original technical plan, every intentional deviation from it, and every open question requiring a human decision.
> Update this file whenever a confirmed deviation is made or an open question is resolved.

---

## Original Plan Assumptions

These assumptions were made in `tech-plan-and-ai-prompt.md` and the associated Claude Prompt Pack:

1. **Multi-tenant by `company_id`** — Every data model (uploads, accounts, KPIs, users) is scoped to a `company_id`. Cross-company data access is impossible by design except for `SUPER_ADMIN` role.
2. **NextAuth v4 with Credentials provider** — Email + password authentication only. No OAuth/social login. Passwords stored as bcrypt hashes.
3. **PostgreSQL via Prisma** — Neon or Supabase as hosting provider. `DATABASE_URL` is the only required connection string.
4. **Vercel deployment** — Serverless functions. Maximum 10s execution time for API routes (60s for Pro plan). No persistent in-memory state across invocations.
5. **Financial year starts April 1** — YTD period calculations use April 1 as the year start, not January 1.
6. **Gold Loan is the first portfolio type** — All other portfolio types (pledge, ML, personal, vehicle) are scaffolded as placeholders in Phase 1. Only `gold_loan` has live data and KPIs.
7. **Excel upload is the primary data ingestion mechanism** — No direct DB import, no API integration. Employees upload `.xlsx` files per branch per day.
8. **Pusher for real-time alerts** — Not Server-Sent Events (SSE). Pusher Channels (cluster `ap2`) is the real-time layer.
9. **Resend for transactional email** — Password reset, welcome invite, and alert notification emails via Resend API.
10. **No OAuth or SSO** — Out of scope for v1.
11. **No mobile-first design requirement** — Dashboard is desktop-first. Responsive behaviour is nice-to-have, not required.
12. **Snapshot generation is cron-triggered** — Daily snapshots computed at midnight by `/api/cron`; not computed on every page load.
13. **react-grid-layout for custom dashboard builder** — Users can rearrange widgets. Layout saved per-user in `DashboardLayout` model.
14. **TanStack Query v5 as client data-fetching library** — SWR is present in the repo but is a legacy dependency; to be removed.

---

## Confirmed Deviations

> This section is empty at project start. Fill in each intentional deviation from the plan as work progresses.

**Format for each entry:**
```
### DEV-001: [Short title]
- **Step:** [Step number where deviation was made]
- **Original plan:** [What the plan said]
- **Actual implementation:** [What was built instead]
- **Reason:** [Why the deviation was necessary]
- **Impact:** [Which other steps/modules are affected]
```

*(No confirmed deviations yet — fill in as work progresses.)*

---

## Open Questions

> These are blockers or decisions that require human input before the relevant step can proceed. Resolve them before starting the listed step.

| # | Question | Affects Step | Priority | Resolved? |
|---|---|---|---|---|
| OQ-001 | What is the exact list of KPI metrics required for Gold Loan? (e.g. is "interest accrued" a KPI or a computed display field?) | 7.2 | High | No |
| OQ-002 | Should the snapshot cron run daily at midnight IST or UTC? What timezone should all date calculations use? | 7.1, 7.2 | High | No |
| OQ-003 | What is the maximum file size for Excel uploads? (Vercel default is 4.5 MB for serverless; Pro is higher) | 5.1 | High | No |
| OQ-004 | Should `DashboardLayout` (custom widget builder) be preserved in the rebuild or replaced with a fixed layout? | 2.1, 8.1 | Medium | No |
| OQ-005 | Is the `playing_with_neon` model safe to drop immediately? (No production data expected there) | 3.1 | Low | No |
| OQ-006 | Should SWR be removed before or after TanStack Query hooks are confirmed working? (Risk: if a component we missed still uses SWR, removing it breaks the build) | 7.3 | Medium | No |
| OQ-007 | What Pusher cluster should be used for production? `.env.local.example` shows `ap2` — is that correct for India? | Deploy | Low | No |
| OQ-008 | Is `dashboard-app/` directory a stale scaffold or actively used? Safe to delete? | 2.1 | Medium | No |
| OQ-009 | Should the `branches` field on `User` remain a `String[]` or be normalised into a separate `Branch` model? | 3.1 | Medium | No |
| OQ-010 | What Excel column header names are used in the actual loan balance statement files? (Required for fuzzy match config in parser) | 6.1 | High | No |
