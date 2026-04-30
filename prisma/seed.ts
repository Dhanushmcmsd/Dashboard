import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const mgmtPassword = await bcrypt.hash("mgmt123", 10);
  const empPassword = await bcrypt.hash("emp123", 10);

  const branches = ["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"];

  // Admin — update includes password so re-seeding always fixes it
  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {
      password: adminPassword,
      passwordSet: true,
      isActive: true,
      role: "ADMIN",
    },
    create: {
      name: "Super Admin",
      email: "admin@company.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
      passwordSet: true,
      branches: [],
    },
  });
  console.log("✅ Admin seeded: admin@company.com / admin123");

  // Management
  await prisma.user.upsert({
    where: { email: "management@company.com" },
    update: {
      password: mgmtPassword,
      passwordSet: true,
      isActive: true,
      role: "MANAGEMENT",
    },
    create: {
      name: "HQ Management",
      email: "management@company.com",
      password: mgmtPassword,
      role: "MANAGEMENT",
      isActive: true,
      passwordSet: true,
      branches: [],
    },
  });
  console.log("✅ Management seeded: management@company.com / mgmt123");

  // Employees — one per branch
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const emailStr = `emp${i + 1}@company.com`;
    await prisma.user.upsert({
      where: { email: emailStr },
      update: {
        password: empPassword,
        passwordSet: true,
        isActive: true,
        role: "EMPLOYEE",
        branches: [branch],
      },
      create: {
        name: `${branch} Employee`,
        email: emailStr,
        password: empPassword,
        role: "EMPLOYEE",
        isActive: true,
        passwordSet: true,
        branches: [branch],
      },
    });
    console.log(`✅ Employee seeded: ${emailStr} / emp123  (branch: ${branch})`);
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────────────");
  console.log("Admin:      admin@company.com      / admin123");
  console.log("Management: management@company.com / mgmt123");
  console.log("Employees:  emp1–emp5@company.com  / emp123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });