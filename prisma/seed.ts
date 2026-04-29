import { PrismaClient, Role } from "@prisma/client";
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
      console.log(`✅ Employee: ${emp.email} / emp123 (${emp.branch})`);
    }

    console.log("\n🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    throw err;
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
