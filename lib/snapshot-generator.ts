import { prisma } from "./prisma";
import { BRANCHES, BranchName, DailyDashboardData, MonthlyDashboardData, BranchDailyMetric, BranchMonthlyMetric, ParsedRow, DpdBucketData } from "@/types";
import { getPrevMonthKey, calcGrowth } from "./utils";
import { Prisma } from "@prisma/client";

export async function buildDailySnapshot(dateKey: string): Promise<DailyDashboardData> {
  let lockAcquired = false;
  try {
    const existing = await prisma.dailySnapshot.findUnique({ where: { dateKey } });
    if (existing?.isBuilding) {
      throw new Error("Snapshot is already being built");
    }

    await prisma.dailySnapshot.upsert({
      where: { dateKey },
      create: { dateKey, combinedData: {}, missingBranches: [], isBuilding: true },
      update: { isBuilding: true },
    });
    lockAcquired = true;

    const uploads = await prisma.upload.findMany({
      where: { dateKey },
      orderBy: { uploadedAt: "desc" },
      include: { user: true },
    });

    const latestUploadsByBranch = new Map<string, typeof uploads[0]>();
    for (const upload of uploads) {
      if (!latestUploadsByBranch.has(upload.branch)) {
        latestUploadsByBranch.set(upload.branch, upload);
      }
    }

    const uploadedBranches: BranchName[] = [];
    const missingBranches: BranchName[] = [];
    const branches: BranchDailyMetric[] = [];
    let closingBalance = 0;
    let disbursement = 0;
    let collection = 0;
    let npa = 0;

    for (const branch of BRANCHES) {
      const upload = latestUploadsByBranch.get(branch);
      if (upload && upload.rawData) {
        uploadedBranches.push(branch);
        const parsed = upload.rawData as unknown as ParsedRow;
        
        closingBalance += parsed.closingBalance || 0;
        disbursement += parsed.disbursement || 0;
        collection += parsed.collection || 0;
        npa += parsed.npa || 0;

        branches.push({
          ...parsed,
          uploadedBy: upload.user.name,
          uploadedAt: upload.uploadedAt.toISOString(),
          fileName: upload.fileName,
        });
      } else {
        missingBranches.push(branch);
      }
    }

    const combinedData: DailyDashboardData = {
      dateKey,
      lastUpdated: new Date().toISOString(),
      uploadedBranches,
      missingBranches,
      branches,
      totals: { closingBalance, disbursement, collection, npa },
    };

    await prisma.dailySnapshot.update({
      where: { dateKey },
      data: {
        combinedData: combinedData as unknown as Prisma.InputJsonValue,
        missingBranches,
        isBuilding: false,
        generatedAt: new Date(),
      },
    });

    return combinedData;
  } catch (error) {
    if (lockAcquired) {
      await prisma.dailySnapshot.update({
        where: { dateKey },
        data: { isBuilding: false },
      });
    }
    throw error;
  }
}

export async function buildMonthlySnapshot(monthKey: string): Promise<MonthlyDashboardData> {
  const uploads = await prisma.upload.findMany({
    where: { monthKey },
    orderBy: { uploadedAt: "desc" },
    include: { user: true },
  });

  const latestUploadsByBranch = new Map<string, typeof uploads[0]>();
  for (const upload of uploads) {
    if (!latestUploadsByBranch.has(upload.branch)) {
      latestUploadsByBranch.set(upload.branch, upload);
    }
  }

  const prevMonthKey = getPrevMonthKey(monthKey);
  const prevSnapshot = await prisma.monthlySnapshot.findUnique({
    where: { monthKey: prevMonthKey },
  });
  
  let prevData: MonthlyDashboardData | null = null;
  if (prevSnapshot && prevSnapshot.combinedData) {
    prevData = prevSnapshot.combinedData as unknown as MonthlyDashboardData;
  }

  const branches: BranchMonthlyMetric[] = [];
  let closingBalance = 0;
  let disbursement = 0;
  let collection = 0;
  let npa = 0;

  for (const branch of BRANCHES) {
    const upload = latestUploadsByBranch.get(branch);
    if (upload && upload.rawData) {
      const parsed = upload.rawData as unknown as ParsedRow;
      
      closingBalance += parsed.closingBalance || 0;
      disbursement += parsed.disbursement || 0;
      collection += parsed.collection || 0;
      npa += parsed.npa || 0;

      let growthPercent: number | null = null;
      let trend: "up" | "down" | "neutral" = "neutral";

      if (prevData) {
        const prevBranch = prevData.branches.find((b) => b.branch === branch);
        if (prevBranch && prevBranch.closingBalance) {
          growthPercent = calcGrowth(parsed.closingBalance || 0, prevBranch.closingBalance);
          if (growthPercent !== null) {
            trend = growthPercent > 0 ? "up" : growthPercent < 0 ? "down" : "neutral";
          }
        }
      }

      branches.push({
        ...parsed,
        uploadedBy: upload.user.name,
        uploadedAt: upload.uploadedAt.toISOString(),
        fileName: upload.fileName,
        growthPercent,
        trend,
      });
    }
  }

  const combinedData: MonthlyDashboardData = {
    monthKey,
    lastUpdated: new Date().toISOString(),
    branches,
    totals: { closingBalance, disbursement, collection, npa },
  };

  await prisma.monthlySnapshot.upsert({
    where: { monthKey },
    create: {
      monthKey,
      combinedData: combinedData as unknown as Prisma.InputJsonValue,
    },
    update: {
      combinedData: combinedData as unknown as Prisma.InputJsonValue,
      generatedAt: new Date(),
    },
  });

  return combinedData;
}
