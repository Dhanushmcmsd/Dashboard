import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const mgmtPassword = await bcrypt.hash("mgmt123", 10);
  const empPassword = await bcrypt.hash("emp123", 10);

  const branches = ["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"];

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
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

  // Management
  await prisma.user.upsert({
    where: { email: "management@company.com" },
    update: {},
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

  // Employees (one for each branch)
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const emailStr = `emp${i + 1}@company.com`;
    await prisma.user.upsert({
      where: { email: emailStr },
      update: {},
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
  }

  console.log("Database seeded successfully!");
  console.log("Admin: admin@company.com / admin123");
  console.log("Management: management@company.com / mgmt123");
  console.log("Employees: emp1@company.com ... emp5@company.com / emp123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
