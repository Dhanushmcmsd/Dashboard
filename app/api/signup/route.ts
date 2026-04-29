import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

const Schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ");
      return errorResponse(msg, 400);
    }

    const { name, email } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return errorResponse("This email is already registered.", 409);

    await prisma.user.create({
      data: {
        name,
        email,
        password: "",
        role: "EMPLOYEE",
        branches: [],
        isActive: false,
        passwordSet: false,
      },
    });

    return successResponse({ registered: true, message: "Account pending admin approval" }, 201);
  } catch {
    return errorResponse("Registration failed. Please try again.");
  }
}
