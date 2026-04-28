import { prisma } from "./prisma";
import { BRANCHES } from "./constants";
import { getPrevMonthKey, calcGrowth } from "./utils";
import type { BranchName, ParsedRow, BranchDailyMetric, DailyDashboardData, BranchMonthlyMetric, MonthlyDashboardData } from "@/types";

export async function buildDailySnapshot(dateKey: string): Promise<DailyDashboardData> {
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
  await prisma.dailySnapshot.upsert({ where: { dateKey }, update: { combinedData: data as object, missingBranches }, create: { dateKey, combinedData: data as object, missingBranches } });
  return data;
}

export async function buildMonthlySnapshot(monthKey: string): Promise<MonthlyDashboardData> {
  const uploads = await prisma.upload.findMany({ where: { monthKey }, include: { user: { select: { name: true } } }, orderBy: { uploadedAt: "desc" } });
  const byBranch = new Map<string, (typeof uploads)[number]>();
  for (const u of uploads) if (!byBranch.has(u.branch)) byBranch.set(u.branch, u);
  const prevUploads = await prisma.upload.findMany({ where: { monthKey: getPrevMonthKey(monthKey) }, orderBy: { uploadedAt: "desc" } });
  const prevByBranch = new Map<string, number>();
  const seen = new Set<string>();
  for (const p of prevUploads) if (!seen.has(p.branch) && p.rawData) { prevByBranch.set(p.branch, (p.rawData as unknown as ParsedRow).closingBalance); seen.add(p.branch); }
  const branches: BranchMonthlyMetric[] = [];
  for (const b of BRANCHES) {
    const u = byBranch.get(b);
    if (!u || !u.rawData) continue;
    const raw = u.rawData as unknown as ParsedRow;
    const growth = calcGrowth(raw.closingBalance, prevByBranch.get(b) ?? 0);
    branches.push({ ...raw, branch: b, uploadedBy: u.user.name, uploadedAt: u.uploadedAt.toISOString(), fileName: u.fileName, growthPercent: growth, trend: growth === null ? "neutral" : growth > 0 ? "up" : growth < 0 ? "down" : "neutral" });
  }
  const totals = branches.reduce((a, m) => ({ closingBalance: a.closingBalance + m.closingBalance, disbursement: a.disbursement + m.disbursement, collection: a.collection + m.collection, npa: a.npa + m.npa }), { closingBalance: 0, disbursement: 0, collection: 0, npa: 0 });
  const data: MonthlyDashboardData = { monthKey, lastUpdated: new Date().toISOString(), branches, totals };
  await prisma.monthlySnapshot.upsert({ where: { monthKey }, update: { combinedData: data as object }, create: { monthKey, combinedData: data as object } });
  return data;
}
