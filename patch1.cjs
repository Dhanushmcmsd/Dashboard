const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'lib');
const apiDir = path.join(__dirname, 'app', 'api');

// 1.1 lib/auth-guard.ts
const authGuardContent = `import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/types";

export async function requireAuth(role?: SessionUser["role"]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  const user = session.user as SessionUser;
  if (role && user.role !== role) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
}
`;
fs.writeFileSync(path.join(libDir, 'auth-guard.ts'), authGuardContent);

// 1.2 lib/validations.ts
let valContent = fs.readFileSync(path.join(libDir, 'validations.ts'), 'utf8');
valContent = valContent.replace(
  `isActive: z.boolean().optional() }`,
  `isActive: z.boolean().optional(), passwordSet: z.boolean().optional() }`
);
fs.writeFileSync(path.join(libDir, 'validations.ts'), valContent);

// 1.3 schema.prisma
let schema = fs.readFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), 'utf8');
if (!schema.includes('passwordTokenUsedAt')) {
  schema = schema.replace(
    `passwordSet Boolean  @default(false)`,
    `passwordSet Boolean  @default(false)\n  passwordToken       String?\n  passwordTokenExpiry DateTime?\n  passwordTokenUsedAt DateTime?`
  );
  schema = schema.replace(
    `missingBranches String[]`,
    `missingBranches String[]\n  isBuilding      Boolean  @default(false)`
  );
  fs.writeFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), schema);
}

// 6.1 lib/prisma.ts
let prismaTs = fs.readFileSync(path.join(libDir, 'prisma.ts'), 'utf8');
prismaTs = `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error"] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`;
fs.writeFileSync(path.join(libDir, 'prisma.ts'), prismaTs);

console.log('Script 1 done');
