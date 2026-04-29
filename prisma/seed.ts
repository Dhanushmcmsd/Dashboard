import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const employeeData = [
  { name: "Supermarket Employee",    email: "supermarket@supra.com",   branch: "Supermarket"   },
  { name: "Gold Loan Employee",      email: "goldloan@supra.com",      branch: "Gold Loan"     },
  { name: "MF Loan Employee",        email: "mfloan@supra.com",        branch: "MF Loan"       },
  { name: "Vehicle Loan Employee",   email: "vehicleloan@supra.com",   branch: "Vehicle Loan"  },
  { name: "Personal Loan Employee",  email: "personalloan@supra.com",  branch: "Personal Loan" },
];

async function main() {
  console.log("🌱 Seeding database...");
  try {
    // ── Admin (you) ──────────────────────────────────────────────────
    await prisma.user.upsert({
      where:  { email: "danny.1.ragha@gmail.com" },
      update: {},
      create: {
        name:        "Dhanush (Admin)",
        email:       "danny.1.ragha@gmail.com",
        password:    await bcrypt.hash("changeme123", 12),
        role:        Role.ADMIN,
        branches:    [],
        passwordSet: true,
      },
    });
    console.log("✅ Admin: danny.1.ragha@gmail.com / changeme123");
    console.log("   ⚠️  Change this password immediately after first login!");

    // ── Management ───────────────────────────────────────────────────
    await prisma.user.upsert({
      where:  { email: "management@supra.com" },
      update: {},
      create: {
        name:        "Management User",
        email:       "management@supra.com",
        password:    await bcrypt.hash("mgmt123", 12),
        role:        Role.MANAGEMENT,
        branches:    [],
        passwordSet: true,
      },
    });
    console.log("✅ Management: management@supra.com / mgmt123");

    // ── Branch Employees ─────────────────────────────────────────────
    for (const emp of employeeData) {
      await prisma.user.upsert({
        where:  { email: emp.email },
        update: {},
        create: {
          name:        emp.name,
          email:       emp.email,
          password:    await bcrypt.hash("emp123", 12),
          role:        Role.EMPLOYEE,
          branches:    [emp.branch],
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
