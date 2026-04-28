import { z } from "zod";
import { BRANCHES, DPD_BUCKETS } from "./constants";

export const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const SignupSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8) });
export const CreateUserSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8), role: z.enum(["ADMIN", "EMPLOYEE", "MANAGEMENT"]), branches: z.array(z.enum(BRANCHES)).default([]), isActive: z.boolean().default(true) });
export const UpdateUserSchema = z.object({ name: z.string().min(2).max(100).optional(), role: z.enum(["ADMIN", "EMPLOYEE", "MANAGEMENT"]).optional(), branches: z.array(z.enum(BRANCHES)).optional(), isActive: z.boolean().optional() });
export const ParsedRowSchema = z.object({ branch: z.enum(BRANCHES), closingBalance: z.number().nonnegative(), disbursement: z.number().nonnegative().default(0), collection: z.number().nonnegative().default(0), npa: z.number().nonnegative().default(0), dpdBuckets: z.record(z.enum(DPD_BUCKETS), z.object({ count: z.number().int().nonnegative(), amount: z.number().nonnegative() })) });
export const AlertCreateSchema = z.object({ message: z.string().min(1).max(1000) });
