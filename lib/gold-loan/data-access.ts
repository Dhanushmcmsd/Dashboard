"use server";

import { prisma } from "@/lib/prisma";
import { withCompanyScope } from "@/lib/with-company-scope";
import type {
  GoldLoanAlertRow,
  GoldLoanBranchPerformanceRow,
  GoldLoanBucketRow,
  GoldLoanDashboardData,
  GoldLoanDisbursementTrendPoint,
  GoldLoanMetricMap,
  SessionUser,
} from "@/types";
import {
  LoanBucket,
  PeriodType,
  PortfolioType,
  TxnType,
  UploadStatus,
  type GoldLoanAccount,
} from "@prisma/client";

type PeriodWindow = { from: Date; to: Date };

export async function getGoldLoanKpis(
  companySlug: string,
  periodType: PeriodType,
  asOnDate: Date
): Promise<GoldLoanMetricMap> {
  const { companyId, portfolioId } = await resolveCompanyPortfolio(companySlug);
  const rows = await prisma.kpiSnapshot.findMany({
    where: {
      companyId,
      portfolioId,
      periodType,
      asOnDate,
    },
    select: { metricKey: true, metricValue: true },
  });

  return Object.fromEntries(rows.map((row) => [row.metricKey, row.metricValue]));
}

export async function getGoldLoanBuckets(
  companySlug: string,
  asOnDate: Date
): Promise<GoldLoanBucketRow[]> {
  const { companyId, portfolioId } = await resolveCompanyPortfolio(companySlug);
  const upload = await latestUpload(companyId, portfolioId, asOnDate);
  if (!upload) return [];

  const accounts = await prisma.goldLoanAccount.findMany({
    where: {
      companyId,
      uploadId: upload.id,
      deletedAt: null,
      status: { not: "CLOSED" },
    },
    select: { bucket: true, principalOutstanding: true },
  });

  const total = accounts.reduce((sum, account) => sum + account.principalOutstanding, 0);
  const buckets: LoanBucket[] = [
    LoanBucket.CURRENT,
    LoanBucket.DPD_0_30,
    LoanBucket.DPD_31_60,
    LoanBucket.DPD_61_90,
    LoanBucket.DPD_90_PLUS,
  ];

  return buckets.map((bucket) => {
    const inBucket = accounts.filter((account) => account.bucket === bucket);
    const amount = inBucket.reduce((sum, row) => sum + row.principalOutstanding, 0);
    return {
      bucket,
      amount,
      count: inBucket.length,
      percent: total > 0 ? (amount / total) * 100 : 0,
    };
  });
}

export async function getHighRiskAccounts(
  companySlug: string,
  asOnDate: Date,
  ltvThreshold = 75
): Promise<GoldLoanAccount[]> {
  const { companyId, portfolioId } = await resolveCompanyPortfolio(companySlug);
  const upload = await latestUpload(companyId, portfolioId, asOnDate);
  if (!upload) return [];

  return prisma.goldLoanAccount.findMany({
    where: {
      companyId,
      uploadId: upload.id,
      deletedAt: null,
      status: { not: "CLOSED" },
      ltvPercent: { gte: ltvThreshold },
    },
    orderBy: { ltvPercent: "desc" },
    take: 100,
  });
}

export async function getDisbursementTrend(
  companySlug: string,
  days = 30
): Promise<GoldLoanDisbursementTrendPoint[]> {
  const { companyId } = await resolveCompanyPortfolio(companySlug);

  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - Math.max(1, days) + 1);
  from.setUTCHours(0, 0, 0, 0);

  const txns = await prisma.goldLoanTxn.findMany({
    where: {
      txnType: TxnType.DISBURSEMENT,
      txnDate: { gte: from, lt: to },
      account: {
        companyId,
      },
    },
    select: {
      txnDate: true,
      amount: true,
    },
  });

  const byDate = new Map<string, number>();
  for (const txn of txns) {
    const key = txn.txnDate.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + txn.amount);
  }

  return [...byDate.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getBranchPerformance(
  companySlug: string,
  periodType: PeriodType,
  asOnDate: Date
): Promise<GoldLoanBranchPerformanceRow[]> {
  const { companyId, portfolioId } = await resolveCompanyPortfolio(companySlug);
  const upload = await latestUpload(companyId, portfolioId, asOnDate);
  if (!upload) return [];

  const accounts = await prisma.goldLoanAccount.findMany({
    where: {
      companyId,
      uploadId: upload.id,
      deletedAt: null,
      status: { not: "CLOSED" },
    },
    select: {
      id: true,
      branch: true,
      principalOutstanding: true,
      bucket: true,
      isNpa: true,
    },
  });

  const window = periodWindow(periodType, asOnDate);
  const txns = accounts.length
    ? await prisma.goldLoanTxn.findMany({
        where: {
          txnType: TxnType.COLLECTION,
          accountId: { in: accounts.map((account) => account.id) },
          txnDate: { gte: window.from, lt: window.to },
        },
        select: {
          accountId: true,
          amount: true,
        },
      })
    : [];

  const collectionByAccount = new Map<string, number>();
  for (const txn of txns) {
    collectionByAccount.set(
      txn.accountId,
      (collectionByAccount.get(txn.accountId) ?? 0) + txn.amount
    );
  }

  const branchMap = new Map<string, { aum: number; collection: number; gnpa: number }>();
  for (const account of accounts) {
    const current = branchMap.get(account.branch) ?? { aum: 0, collection: 0, gnpa: 0 };
    current.aum += account.principalOutstanding;
    current.collection += collectionByAccount.get(account.id) ?? 0;
    if (account.bucket === LoanBucket.DPD_90_PLUS || account.isNpa) {
      current.gnpa += account.principalOutstanding;
    }
    branchMap.set(account.branch, current);
  }

  return [...branchMap.entries()].map(([branch, metrics]) => ({
    branch,
    aum: metrics.aum,
    collection: metrics.collection,
    npa_percent: metrics.aum > 0 ? (metrics.gnpa / metrics.aum) * 100 : 0,
  }));
}

export async function getAlerts(companySlug: string): Promise<GoldLoanAlertRow[]> {
  const { companyId } = await resolveCompanyPortfolio(companySlug);
  const rows = await prisma.alert.findMany({
    where: {
      user: { companyId },
    },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: {
      message: true,
      severity: true,
    },
  });

  return rows.map((row) => ({
    type: "alert",
    message: row.message,
    severity:
      row.severity === "CRITICAL" ? "high" : row.severity === "WARNING" ? "medium" : "low",
  }));
}

export async function getDashboardData(
  companySlug: string,
  periodType: PeriodType,
  asOnDate: Date
): Promise<GoldLoanDashboardData> {
  const [kpis, buckets, highRiskAccounts, disbursementTrend, branchPerformance, alerts] =
    await Promise.all([
      getGoldLoanKpis(companySlug, periodType, asOnDate),
      getGoldLoanBuckets(companySlug, asOnDate),
      getHighRiskAccounts(companySlug, asOnDate),
      getDisbursementTrend(companySlug, 30),
      getBranchPerformance(companySlug, periodType, asOnDate),
      getAlerts(companySlug),
    ]);

  return {
    kpis,
    buckets,
    highRiskAccounts,
    disbursementTrend,
    branchPerformance,
    alerts,
  };
}

async function resolveCompanyPortfolio(companySlug: string): Promise<{
  companyId: string;
  portfolioId: string;
}> {
  const user = (await withCompanyScope(companySlug)) as SessionUser;
  let companyId = user.companyId ?? null;

  if (!companyId) {
    const company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true },
    });
    if (!company) {
      throw new Error("Company not found.");
    }
    companyId = company.id;
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: {
      companyId,
      type: PortfolioType.GOLD_LOAN,
      isActive: true,
    },
    select: { id: true },
  });

  if (!portfolio) {
    throw new Error("Active GOLD_LOAN portfolio not found.");
  }

  return { companyId, portfolioId: portfolio.id };
}

async function latestUpload(
  companyId: string,
  portfolioId: string,
  asOnDate: Date
): Promise<{ id: string } | null> {
  return prisma.dataUpload.findFirst({
    where: {
      companyId,
      portfolioId,
      asOnDate: { lte: asOnDate },
      status: {
        in: [UploadStatus.SUCCESS, UploadStatus.PARTIAL_SUCCESS],
      },
    },
    orderBy: [{ asOnDate: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
}

function periodWindow(periodType: PeriodType, asOnDate: Date): PeriodWindow {
  const from = new Date(asOnDate);
  from.setUTCHours(0, 0, 0, 0);

  if (periodType === PeriodType.MTD) {
    from.setUTCDate(1);
  } else if (periodType === PeriodType.YTD) {
    from.setUTCMonth(0, 1);
  }

  const to = new Date(asOnDate);
  to.setUTCHours(23, 59, 59, 999);
  to.setUTCDate(to.getUTCDate() + 1);

  return { from, to };
}
