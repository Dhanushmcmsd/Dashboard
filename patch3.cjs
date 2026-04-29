const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'lib');
const apiDir = path.join(__dirname, 'app', 'api');
const prismaDir = path.join(__dirname, 'prisma');

// 3.1 & 3.3 lib/snapshot-generator.ts
let snapTs = fs.readFileSync(path.join(libDir, 'snapshot-generator.ts'), 'utf8');
if (!snapTs.includes('isBuilding')) {
  snapTs = `import { prisma } from "./prisma";
import { BRANCHES } from "./constants";
import { getPrevMonthKey, calcGrowth } from "./utils";
import type { BranchName, ParsedRow, BranchDailyMetric, DailyDashboardData, BranchMonthlyMetric, MonthlyDashboardData } from "@/types";

export async function buildDailySnapshot(dateKey: string): Promise<DailyDashboardData> {
  const existingLock = await prisma.dailySnapshot.findUnique({ where: { dateKey } });
  if (existingLock?.isBuilding) {
    await new Promise(r => setTimeout(r, 2000));
    return (await prisma.dailySnapshot.findUnique({ where: { dateKey } })).combinedData as DailyDashboardData;
  }
  await prisma.dailySnapshot.upsert({
    where: { dateKey },
    update: { isBuilding: true },
    create: { dateKey, combinedData: {}, missingBranches: [], isBuilding: true },
  });

  try {
    const uploads = await prisma.upload.findMany({ where: { dateKey }, include: { user: { select: { name: true } } }, orderBy: { uploadedAt: "desc" } });
    const byBranch = new Map<string, (typeof uploads)[number]>();
    for (const u of uploads) if (!byBranch.has(u.branch)) byBranch.set(u.branch, u);
    const uploadedBranches: BranchName[] = [];
    const missingBranches: BranchName[] = [];
    const branches: BranchDailyMetric[] = [];
    for (const b of BRANCHES) {
      const u = byBranch.get(b);
      if (!u || !u.rawData) { missingBranches.push(b); continue; }
      uploadedBranches.push(b);
      const raw = u.rawData as unknown as ParsedRow;
      branches.push({ ...raw, branch: b, uploadedBy: u.user.name, uploadedAt: u.uploadedAt.toISOString(), fileName: u.fileName });
    }
    const totals = branches.reduce((a, m) => ({ closingBalance: a.closingBalance + m.closingBalance, disbursement: a.disbursement + m.disbursement, collection: a.collection + m.collection, npa: a.npa + m.npa }), { closingBalance: 0, disbursement: 0, collection: 0, npa: 0 });
    const data: DailyDashboardData = { dateKey, lastUpdated: new Date().toISOString(), uploadedBranches, missingBranches, branches, totals };
    
    await prisma.dailySnapshot.update({ where: { dateKey }, data: { combinedData: data as object, missingBranches, isBuilding: false } });
    return data;
  } catch (err) {
    await prisma.dailySnapshot.update({ where: { dateKey }, data: { isBuilding: false } });
    throw err;
  }
}

export async function buildMonthlySnapshot(monthKey: string): Promise<MonthlyDashboardData> {
  const uploads = await prisma.upload.findMany({ where: { monthKey }, include: { user: { select: { name: true } } }, orderBy: { uploadedAt: "desc" } });
  const byBranch = new Map<string, (typeof uploads)[number]>();
  for (const u of uploads) if (!byBranch.has(u.branch)) byBranch.set(u.branch, u);
  
  const prevMonthKey = getPrevMonthKey(monthKey);
  const prevUploads = await prisma.upload.findMany({ where: { monthKey: prevMonthKey }, orderBy: { uploadedAt: "desc" } });
  const prevByBranch = new Map<string, number>();
  const seen = new Set<string>();
  
  for (const p of prevUploads) if (!seen.has(p.branch) && p.rawData) { prevByBranch.set(p.branch, (p.rawData as unknown as ParsedRow).closingBalance); seen.add(p.branch); }

  const branches: BranchMonthlyMetric[] = [];
  for (const b of BRANCHES) {
    const u = byBranch.get(b);
    if (!u || !u.rawData) continue;
    const raw = u.rawData as unknown as ParsedRow;
    
    let prevTotal = prevByBranch.get(b);
    if (prevTotal === undefined) {
      const prevSnapshot = await prisma.monthlySnapshot.findUnique({ where: { monthKey: prevMonthKey } });
      if (prevSnapshot) {
        const prevCombined = prevSnapshot.combinedData as unknown as MonthlyDashboardData;
        const prevBranchData = prevCombined.branches.find(x => x.branch === b);
        prevTotal = prevBranchData?.closingBalance ?? 0;
      } else {
        prevTotal = 0;
      }
    }

    const growth = calcGrowth(raw.closingBalance, prevTotal);
    branches.push({ ...raw, branch: b, uploadedBy: u.user.name, uploadedAt: u.uploadedAt.toISOString(), fileName: u.fileName, growthPercent: growth, trend: growth === null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral" });
  }
  const totals = branches.reduce((a, m) => ({ closingBalance: a.closingBalance + m.closingBalance, disbursement: a.disbursement + m.disbursement, collection: a.collection + m.collection, npa: a.npa + m.npa }), { closingBalance: 0, disbursement: 0, collection: 0, npa: 0 });
  const data: MonthlyDashboardData = { monthKey, lastUpdated: new Date().toISOString(), branches, totals };
  await prisma.monthlySnapshot.upsert({ where: { monthKey }, update: { combinedData: data as object }, create: { monthKey, combinedData: data as object } });
  return data;
}
`;
  fs.writeFileSync(path.join(libDir, 'snapshot-generator.ts'), snapTs);
}

// 3.3 lib/utils.ts
let utilsTs = fs.readFileSync(path.join(libDir, 'utils.ts'), 'utf8');
utilsTs = utilsTs.replace(
  `export function getPrevMonthKey(monthKey: string): string { const [y, m] = monthKey.split("-").map(Number); return format(new Date(y, m - 2, 1), "yyyy-MM"); }`,
  `export function getPrevMonthKey(monthKey: string): string { const [y, m] = monthKey.split("-").map(Number); const date = new Date(y, m - 2, 1, 12, 0, 0); return format(toZonedTime(date, IST), "yyyy-MM"); }`
);
fs.writeFileSync(path.join(libDir, 'utils.ts'), utilsTs);

// 5.1 prisma/seed.ts
const seedTs = `import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BRANCHES = [
  "Supermarket",
  "Gold Loan",
  "MF Loan",
  "Vehicle Loan",
  "Personal Loan",
] as const;

const employeeData = [
  { name: "Supermarket Employee", email: "supermarket@supra.com", branch: "Supermarket" },
  { name: "Gold Loan Employee",   email: "goldloan@supra.com",    branch: "Gold Loan"   },
  { name: "MF Loan Employee",     email: "mfloan@supra.com",      branch: "MF Loan"     },
  { name: "Vehicle Loan Employee",email: "vehicleloan@supra.com", branch: "Vehicle Loan"},
  { name: "Personal Loan Employee",email: "personalloan@supra.com",branch: "Personal Loan"},
];

async function main() {
  console.log("🌱 Seeding database...");
  try {
    await prisma.user.upsert({
      where: { email: "admin@supra.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@supra.com",
        password: await bcrypt.hash("admin123", 12),
        role: Role.ADMIN,
        branches: [],
        passwordSet: true,
      },
    });
    console.log("✅ Admin: admin@supra.com / admin123");

    await prisma.user.upsert({
      where: { email: "management@supra.com" },
      update: {},
      create: {
        name: "Management User",
        email: "management@supra.com",
        password: await bcrypt.hash("mgmt123", 12),
        role: Role.MANAGEMENT,
        branches: [],
        passwordSet: true,
      },
    });
    console.log("✅ Management: management@supra.com / mgmt123");

    for (const emp of employeeData) {
      await prisma.user.upsert({
        where: { email: emp.email },
        update: {},
        create: {
          name: emp.name,
          email: emp.email,
          password: await bcrypt.hash("emp123", 12),
          role: Role.EMPLOYEE,
          branches: [emp.branch],
          passwordSet: true,
        },
      });
      console.log(\`✅ Employee: \${emp.email} / emp123 (\${emp.branch})\`);
    }

    console.log("\\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    throw err;
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
`;
fs.writeFileSync(path.join(prismaDir, 'seed.ts'), seedTs);

console.log('Script 3 done');
