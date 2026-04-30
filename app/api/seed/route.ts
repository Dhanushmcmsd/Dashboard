import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Protected by SEED_SECRET env var — set this in Vercel environment variables
export async function GET(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SEED_SECRET env var not set" }, { status: 500 });
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branches = ["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"];

  const adminPassword = await bcrypt.hash("admin123", 10);
  const mgmtPassword  = await bcrypt.hash("mgmt123",  10);
  const empPassword   = await bcrypt.hash("emp123",   10);

  await prisma.user.upsert({
    where:  { email: "admin@company.com" },
    update: { password: adminPassword, passwordSet: true, isActive: true, role: "ADMIN" },
    create: { name: "Super Admin", email: "admin@company.com", password: adminPassword, role: "ADMIN", isActive: true, passwordSet: true, branches: [] },
  });

  await prisma.user.upsert({
    where:  { email: "management@company.com" },
    update: { password: mgmtPassword, passwordSet: true, isActive: true, role: "MANAGEMENT" },
    create: { name: "HQ Management", email: "management@company.com", password: mgmtPassword, role: "MANAGEMENT", isActive: true, passwordSet: true, branches: [] },
  });

  for (let i = 0; i < branches.length; i++) {
    const branch   = branches[i];
    const emailStr = `emp${i + 1}@company.com`;
    await prisma.user.upsert({
      where:  { email: emailStr },
      update: { password: empPassword, passwordSet: true, isActive: true, role: "EMPLOYEE", branches: [branch] },
      create: { name: `${branch} Employee`, email: emailStr, password: empPassword, role: "EMPLOYEE", isActive: true, passwordSet: true, branches: [branch] },
    });
  }

  return NextResponse.json({
    success: true,
    message: "Database seeded",
    accounts: [
      "admin@company.com / admin123",
      "management@company.com / mgmt123",
      "emp1@company.com / emp123  (Supermarket)",
      "emp2@company.com / emp123  (Gold Loan)",
      "emp3@company.com / emp123  (ML Loan)",
      "emp4@company.com / emp123  (Vehicle Loan)",
      "emp5@company.com / emp123  (Personal Loan)",
    ],
  });
}
