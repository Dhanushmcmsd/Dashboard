# Changelog

All notable changes to the Supra Pacific Dashboard will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `REPO_AUDIT.md` — Batch 0 audit: 8-section analysis of current repo stack, dependency map, reuse/replace decisions, gaps vs tech plan, target architecture, 12-step migration plan, risk list, recommended branch name
- `REBUILD_ROADMAP.md` — Living step tracker with Status column (`todo/in-progress/done`) and Context Reload Blocks for every step; sized for one AI session each
- `MODULE_BREAKDOWN.md` — Per-module documentation: purpose, key files, external dependencies, test surface
- `MIGRATION_NOTES.md` — Original plan assumptions, Confirmed Deviations section, Open Questions tracker
- `DATA_CONTRACTS.md` — Canonical TypeScript interfaces for all cross-layer data shapes: `Company`, `Portfolio`, `UploadRecord`, `GoldLoanAccount`, `KpiSnapshot`, `UserSession`, `ApiResponse`, `ParseResult`
- `CHANGELOG.md` — This file; Keep-a-Changelog format

### Changed
- *(nothing yet)*

### Deprecated
- *(nothing yet)*

### Removed
- *(nothing yet)*

### Fixed
- *(nothing yet)*

### Security
- *(nothing yet)*

---

## [0.1.0] — 2026-05-05

### Added
- Initial repo scaffolding: Next.js 16 App Router, TypeScript, Tailwind CSS v4, Prisma v5
- NextAuth v4 with CredentialsProvider (email + bcrypt)
- Role-based edge middleware (`middleware.ts`): ADMIN, EMPLOYEE, MANAGEMENT, SUPER_ADMIN path gating
- Prisma schema: `Organization`, `User`, `Upload`, `DailySnapshot`, `MonthlySnapshot`, `Alert`, `AuditLog`, `DashboardLayout`, `PasswordResetToken`
- API routes: auth, users, upload, dashboard, dashboards, alerts, audit, export, events, pusher, cron, health
- `lib/` utilities: `auth.ts`, `auth-guard.ts`, `with-auth.ts`, `prisma.ts`, `audit.ts`, `email.ts`, `excel-parser.ts`, `html-parser.ts`, `snapshot-generator.ts`, `events.ts`, `rate-limit.ts`, `validations.ts`, `constants.ts`, `utils.ts`, `types.ts`
- `.env.local.example` with all required env vars documented
- `vercel.json` deployment config
- Planning docs: `CLAUDE_SESSION_LOADER.md`, `AUTH_SECURITY.md`, `tech-plan-and-ai-prompt.md`
