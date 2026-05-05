import { prisma } from "@/lib/prisma";
import {
  LoanBucket,
  PeriodType,
  PortfolioType,
  TxnType,
  type GoldLoanAccount,
} from "@prisma/client";

type MetricMap = Record<string, number>;

export async function computeAllKpis(companyId: string, asOnDate: Date): Promise<void> {
  const portfolio = await prisma.portfolio.findFirst({
    where: {
      companyId,
      type: PortfolioType.GOLD_LOAN,
      isActive: true,
    },
    select: { id: true },
  });

  if (!portfolio) {
    throw new Error("Active GOLD_LOAN portfolio not found for company.");
  }

  const periods: PeriodType[] = [PeriodType.FTD, PeriodType.MTD, PeriodType.YTD];

  for (const periodType of periods) {
    const { start, end } = periodWindow(periodType, asOnDate);
    const metrics = await computePeriodMetrics(companyId, start, end);

    await prisma.$transaction(
      Object.entries(metrics).map(([metricKey, metricValue]) =>
        prisma.kpiSnapshot.upsert({
          where: {
            companyId_portfolioId_periodType_asOnDate_metricKey: {
              companyId,
              portfolioId: portfolio.id,
              periodType,
              asOnDate,
              metricKey,
            },
          },
          create: {
            companyId,
            portfolioId: portfolio.id,
            periodType,
            asOnDate,
            metricKey,
            metricValue,
          },
          update: {
            metricValue,
            computedAt: new Date(),
          },
        })
      )
    );
  }
}

async function computePeriodMetrics(
  companyId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<MetricMap> {
  const accounts = await prisma.goldLoanAccount.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: { not: "CLOSED" },
    },
  });

  const accountIds = accounts.map((account) => account.id);

  const txns = accountIds.length
    ? await prisma.goldLoanTxn.findMany({
        where: {
          accountId: { in: accountIds },
          txnDate: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          amount: true,
          txnType: true,
          account: {
            select: { bucket: true },
          },
        },
      })
    : [];

  const totalAum = sum(accounts, (account) => account.principalOutstanding);
  const distinctCustomers = new Set(accounts.map((account) => account.customerName)).size;
  const avgTicketSize = distinctCustomers > 0 ? totalAum / distinctCustomers : 0;
  const yieldPercent = weightedAverage(
    accounts,
    (account) => account.interestRate,
    (account) => account.principalOutstanding
  );
  const totalGoldWeight = sum(accounts, (account) => account.goldWeightGrams);
  const avgLtv = weightedAverage(
    accounts,
    (account) => account.ltvPercent,
    (account) => account.principalOutstanding
  );
  const gnpaAmount = sum(
    accounts.filter(
      (account) => account.bucket === LoanBucket.DPD_90_PLUS || account.isNpa === true
    ),
    (account) => account.principalOutstanding
  );
  const gnpaPercent = totalAum > 0 ? (gnpaAmount / totalAum) * 100 : 0;

  const newDisbursement = sum(
    txns.filter((txn) => txn.txnType === TxnType.DISBURSEMENT),
    (txn) => txn.amount
  );

  const totalCollection = sum(
    txns.filter((txn) => txn.txnType === TxnType.COLLECTION),
    (txn) => txn.amount
  );

  const overdueCollection = sum(
    txns.filter(
      (txn) => txn.txnType === TxnType.COLLECTION && txn.account.bucket !== LoanBucket.CURRENT
    ),
    (txn) => txn.amount
  );

  // Assumption:
  // Historical opening overdue balance snapshot at period start is unavailable.
  // We approximate opening_overdue_balance using current overdue principal for
  // accounts disbursed before the period start.
  const openingOverdueBalance = sum(
    accounts.filter(
      (account) =>
        account.disbursementDate < periodStart && account.bucket !== LoanBucket.CURRENT
    ),
    (account) => account.principalOutstanding
  );

  const collectionEfficiency =
    openingOverdueBalance > 0 ? overdueCollection / openingOverdueBalance : 0;

  const bucket0_30 = bucketAmount(accounts, LoanBucket.DPD_0_30);
  const bucket31_60 = bucketAmount(accounts, LoanBucket.DPD_31_60);
  const bucket61_90 = bucketAmount(accounts, LoanBucket.DPD_61_90);
  const bucket90Plus = bucketAmount(accounts, LoanBucket.DPD_90_PLUS);

  return {
    total_aum: totalAum,
    total_customers: distinctCustomers,
    avg_ticket_size: avgTicketSize,
    yield_percent: yieldPercent,
    new_disbursement: newDisbursement,
    total_collection: totalCollection,
    overdue_collection: overdueCollection,
    collection_efficiency: collectionEfficiency,
    total_gold_weight: totalGoldWeight,
    avg_ltv: avgLtv,
    gnpa_amount: gnpaAmount,
    gnpa_percent: gnpaPercent,
    bucket_0_30: bucket0_30,
    bucket_31_60: bucket31_60,
    bucket_61_90: bucket61_90,
    bucket_90_plus: bucket90Plus,
  };
}

function periodWindow(periodType: PeriodType, asOnDate: Date): { start: Date; end: Date } {
  const start = new Date(asOnDate);
  start.setUTCHours(0, 0, 0, 0);

  if (periodType === PeriodType.MTD) {
    start.setUTCDate(1);
  } else if (periodType === PeriodType.YTD) {
    start.setUTCMonth(0, 1);
  }

  const end = new Date(asOnDate);
  end.setUTCHours(23, 59, 59, 999);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function sum<T>(rows: T[], fn: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + fn(row), 0);
}

function weightedAverage<T>(
  rows: T[],
  valueFn: (row: T) => number,
  weightFn: (row: T) => number
): number {
  const weightTotal = sum(rows, weightFn);
  if (weightTotal <= 0) return 0;

  const weighted = rows.reduce(
    (acc, row) => acc + valueFn(row) * weightFn(row),
    0
  );
  return weighted / weightTotal;
}

function bucketAmount(accounts: GoldLoanAccount[], bucket: LoanBucket): number {
  return sum(
    accounts.filter((account) => account.bucket === bucket),
    (account) => account.principalOutstanding
  );
}
