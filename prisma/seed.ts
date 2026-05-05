/**
 * prisma/seed.ts
 * Idempotent seed for the Dashboard rebuild.
 * Run:  npm run db:seed
 * Reset: npm run seed:reset
 *
 * All upserts are keyed on natural unique columns so running this
 * file twice produces identical database state (no duplicate rows).
 */

import { PrismaClient, PortfolioType, PortfolioPhase } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Seed credentials — documented in SETUP_SEEDING.md
// ---------------------------------------------------------------------------
const CREDENTIALS = {
  superAdmin:    { email: 'superadmin@supra-pacific.com',  password: 'SuperAdmin@123' },
  companyAdmin:  { email: 'admin@supra-pacific.com',       password: 'CompAdmin@123'  },
  management:    { email: 'management@supra-pacific.com',   password: 'Mgmt@123'       },
  employee:      { email: 'emp.goldloan@supra-pacific.com', password: 'Employee@123'   },
  // Legacy seed accounts (kept for backward compat with existing sessions)
  legacyAdmin:   { email: 'admin@company.com',             password: 'admin123'        },
  legacyMgmt:    { email: 'management@company.com',        password: 'mgmt123'         },
};

// ---------------------------------------------------------------------------
// Companies from the technical plan
// ---------------------------------------------------------------------------
const COMPANIES = [
  { slug: 'supra-pacific',   name: 'Supra Pacific Finance',       isActive: true  },
  { slug: 'alpha-finance',   name: 'Alpha Finance Corporation',   isActive: true  },
  { slug: 'beta-credits',    name: 'Beta Credits Limited',        isActive: true  },
  { slug: 'gamma-lending',   name: 'Gamma Lending Solutions',     isActive: false },
  { slug: 'delta-capital',   name: 'Delta Capital Partners',      isActive: false },
  { slug: 'epsilon-fin',     name: 'Epsilon Financial Services',  isActive: false },
] as const;

// ---------------------------------------------------------------------------
// Portfolio scaffolding per company
// ---------------------------------------------------------------------------
const PORTFOLIO_SCAFFOLD: Array<{
  type: PortfolioType;
  isActive: boolean;
  phase: PortfolioPhase;
}> = [
  { type: 'GOLD_LOAN',      isActive: true,  phase: 'ACTIVE'     },
  { type: 'ML_LOAN',        isActive: false, phase: 'ONBOARDING' },
  { type: 'PERSONAL_LOAN',  isActive: false, phase: 'ONBOARDING' },
  { type: 'VEHICLE_LOAN',   isActive: false, phase: 'ONBOARDING' },
  { type: 'SUPERMARKET',    isActive: false, phase: 'ONBOARDING' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

function log(msg: string) {
  console.log(msg);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log('\n🌱  Starting idempotent seed...\n');

  // ── 1. Companies ──────────────────────────────────────────────────────────
  log('── Companies');
  const companyRecords: Record<string, string> = {}; // slug → id

  for (const c of COMPANIES) {
    const company = await prisma.company.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, isActive: c.isActive },
      create: { slug: c.slug, name: c.name, isActive: c.isActive },
    });
    companyRecords[c.slug] = company.id;
    log(`  ✅ Company: ${company.name} (${company.slug}) — ${company.isActive ? 'active' : 'inactive'}`);
  }

  // ── 2. Portfolios ─────────────────────────────────────────────────────────
  log('\n── Portfolios');
  for (const c of COMPANIES) {
    const companyId = companyRecords[c.slug];
    for (const p of PORTFOLIO_SCAFFOLD) {
      await prisma.portfolio.upsert({
        where:  { companyId_type: { companyId, type: p.type } },
        update: { isActive: p.isActive, phase: p.phase },
        create: { companyId, type: p.type, isActive: p.isActive, phase: p.phase },
      });
    }
    log(`  ✅ ${c.slug}: 5 portfolios scaffolded (1 active: GOLD_LOAN)`);
  }

  // ── 3. Supra Pacific company ID for user scoping ─────────────────────────
  const supraId = companyRecords['supra-pacific'];

  // ── 4. Test users (scoped to Supra Pacific) ───────────────────────────────
  log('\n── Test Users (Supra Pacific)');

  // Super Admin
  await prisma.user.upsert({
    where:  { email: CREDENTIALS.superAdmin.email },
    update: {
      password:    await hash(CREDENTIALS.superAdmin.password),
      role:        'SUPER_ADMIN',
      isActive:    true,
      passwordSet: true,
      companyId:   supraId,
    },
    create: {
      name:        'Super Admin',
      email:       CREDENTIALS.superAdmin.email,
      password:    await hash(CREDENTIALS.superAdmin.password),
      role:        'SUPER_ADMIN',
      isActive:    true,
      passwordSet: true,
      branches:    [],
      companyId:   supraId,
    },
  });
  log(`  ✅ SUPER_ADMIN  → ${CREDENTIALS.superAdmin.email}`);

  // Company Admin
  await prisma.user.upsert({
    where:  { email: CREDENTIALS.companyAdmin.email },
    update: {
      password:    await hash(CREDENTIALS.companyAdmin.password),
      role:        'ADMIN',
      isActive:    true,
      passwordSet: true,
      companyId:   supraId,
    },
    create: {
      name:        'Company Admin',
      email:       CREDENTIALS.companyAdmin.email,
      password:    await hash(CREDENTIALS.companyAdmin.password),
      role:        'ADMIN',
      isActive:    true,
      passwordSet: true,
      branches:    [],
      companyId:   supraId,
    },
  });
  log(`  ✅ ADMIN        → ${CREDENTIALS.companyAdmin.email}`);

  // Management
  await prisma.user.upsert({
    where:  { email: CREDENTIALS.management.email },
    update: {
      password:    await hash(CREDENTIALS.management.password),
      role:        'MANAGEMENT',
      isActive:    true,
      passwordSet: true,
      companyId:   supraId,
    },
    create: {
      name:        'HQ Management',
      email:       CREDENTIALS.management.email,
      password:    await hash(CREDENTIALS.management.password),
      role:        'MANAGEMENT',
      isActive:    true,
      passwordSet: true,
      branches:    [],
      companyId:   supraId,
    },
  });
  log(`  ✅ MANAGEMENT   → ${CREDENTIALS.management.email}`);

  // Employee (Gold Loan branch)
  await prisma.user.upsert({
    where:  { email: CREDENTIALS.employee.email },
    update: {
      password:    await hash(CREDENTIALS.employee.password),
      role:        'EMPLOYEE',
      isActive:    true,
      passwordSet: true,
      companyId:   supraId,
      branches:    ['Gold Loan'],
    },
    create: {
      name:        'Gold Loan Employee',
      email:       CREDENTIALS.employee.email,
      password:    await hash(CREDENTIALS.employee.password),
      role:        'EMPLOYEE',
      isActive:    true,
      passwordSet: true,
      branches:    ['Gold Loan'],
      companyId:   supraId,
    },
  });
  log(`  ✅ EMPLOYEE     → ${CREDENTIALS.employee.email}  (branch: Gold Loan)`);

  // ── 5. Legacy accounts (backward compat — existing sessions/tests) ─────────
  log('\n── Legacy Users (backward compat)');
  const branches = ['Supermarket', 'Gold Loan', 'ML Loan', 'Vehicle Loan', 'Personal Loan'];

  await prisma.user.upsert({
    where:  { email: CREDENTIALS.legacyAdmin.email },
    update: { password: await hash(CREDENTIALS.legacyAdmin.password), isActive: true, passwordSet: true, role: 'ADMIN' },
    create: { name: 'Legacy Admin', email: CREDENTIALS.legacyAdmin.email, password: await hash(CREDENTIALS.legacyAdmin.password), role: 'ADMIN', isActive: true, passwordSet: true, branches: [] },
  });
  log(`  ✅ ADMIN (legacy) → ${CREDENTIALS.legacyAdmin.email}`);

  await prisma.user.upsert({
    where:  { email: CREDENTIALS.legacyMgmt.email },
    update: { password: await hash(CREDENTIALS.legacyMgmt.password), isActive: true, passwordSet: true, role: 'MANAGEMENT' },
    create: { name: 'Legacy Management', email: CREDENTIALS.legacyMgmt.email, password: await hash(CREDENTIALS.legacyMgmt.password), role: 'MANAGEMENT', isActive: true, passwordSet: true, branches: [] },
  });
  log(`  ✅ MANAGEMENT (legacy) → ${CREDENTIALS.legacyMgmt.email}`);

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const emailStr = `emp${i + 1}@company.com`;
    await prisma.user.upsert({
      where:  { email: emailStr },
      update: { password: await hash('emp123'), isActive: true, passwordSet: true, role: 'EMPLOYEE', branches: [branch] },
      create: { name: `${branch} Employee`, email: emailStr, password: await hash('emp123'), role: 'EMPLOYEE', isActive: true, passwordSet: true, branches: [branch] },
    });
    log(`  ✅ EMPLOYEE (legacy) → ${emailStr}  (branch: ${branch})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log(`
╔══════════════════════════════════════════════════════════════╗
║                  🎉  Seed complete!                          ║
╠══════════════════════════════════════════════════════════════╣
║  Companies : ${String(COMPANIES.length).padEnd(47)}║
║  Portfolios: ${String(COMPANIES.length * PORTFOLIO_SCAFFOLD.length).padEnd(47)}║
╠══════════════════════════════════════════════════════════════╣
║  TEST CREDENTIALS (Supra Pacific)                            ║
║  SUPER_ADMIN  superadmin@supra-pacific.com / SuperAdmin@123  ║
║  ADMIN        admin@supra-pacific.com      / CompAdmin@123   ║
║  MANAGEMENT   management@supra-pacific.com / Mgmt@123        ║
║  EMPLOYEE     emp.goldloan@supra-pacific.com/ Employee@123   ║
╠══════════════════════════════════════════════════════════════╣
║  LEGACY CREDENTIALS                                          ║
║  admin@company.com      / admin123                           ║
║  management@company.com / mgmt123                            ║
║  emp1–emp5@company.com  / emp123                             ║
╚══════════════════════════════════════════════════════════════╝`);
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
