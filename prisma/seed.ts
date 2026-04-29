import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@company.com",
      password: await bcrypt.hash("admin123", 12),
      role: Role.ADMIN,
      branches: [],
      isActive: true,
      passwordSet: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "management@company.com" },
    update: {},
    create: {
      name: "Management",
      email: "management@company.com",
      password: await bcrypt.hash("mgmt123", 12),
      role: Role.MANAGEMENT,
      branches: [],
      isActive: true,
      passwordSet: true,
    },
  });

  const employees = [
    { name: "Supermarket Staff", email: "supermarket@company.com", branch: "Supermarket" },
    { name: "Gold Loan Staff", email: "goldloan@company.com", branch: "Gold Loan" },
    { name: "ML Loan Staff", email: "mlloan@company.com", branch: "ML Loan" },
    { name: "Vehicle Loan Staff", email: "vehicleloan@company.com", branch: "Vehicle Loan" },
    { name: "Personal Loan Staff", email: "personalloan@company.com", branch: "Personal Loan" },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        name: emp.name,
        email: emp.email,
        password: await bcrypt.hash("emp123", 12),
        role: Role.EMPLOYEE,
        branches: [emp.branch],
        isActive: true,
        passwordSet: true,
      },
    });
  }

  console.log("Seed complete");
  console.log("admin@company.com / admin123");
  console.log("management@company.com / mgmt123");
  console.log("supermarket@company.com / emp123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
