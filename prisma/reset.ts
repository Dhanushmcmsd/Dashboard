/**
 * prisma/reset.ts
 * Truncates only tenant-scoped tables, then re-runs the seed.
 * Preserves: User, Organization, PasswordResetToken, DashboardLayout, AuditLog
 * Clears:    KpiSnapshot, GoldLoanTxn, GoldLoanAccount, DataUpload, Portfolio, Company
 *
 * Run:  npm run seed:reset
 *
 * ⚠️  DESTRUCTIVE — do not run against production.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n⚠️   seed:reset — truncating tenant tables (non-destructive to users/auth)');
  console.log('─────────────────────────────────────────────────────────────────');

  // Delete in FK-safe order (children before parents)
  const r1 = await prisma.kpiSnapshot.deleteMany({});
  console.log(`  🗑  KpiSnapshot     : ${r1.count} rows deleted`);

  const r2 = await prisma.goldLoanTxn.deleteMany({});
  console.log(`  🗑  GoldLoanTxn     : ${r2.count} rows deleted`);

  const r3 = await prisma.goldLoanAccount.deleteMany({});
  console.log(`  🗑  GoldLoanAccount : ${r3.count} rows deleted`);

  const r4 = await prisma.dataUpload.deleteMany({});
  console.log(`  🗑  DataUpload      : ${r4.count} rows deleted`);

  const r5 = await prisma.portfolio.deleteMany({});
  console.log(`  🗑  Portfolio       : ${r5.count} rows deleted`);

  const r6 = await prisma.company.deleteMany({});
  console.log(`  🗑  Company         : ${r6.count} rows deleted`);

  // Clear companyId from users so FK constraint is not violated on re-seed
  const r7 = await prisma.user.updateMany({ data: { companyId: null } });
  console.log(`  🔗  User.companyId  : ${r7.count} users unlinked from companies`);

  console.log('\n✅  Reset complete. Running seed...\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
