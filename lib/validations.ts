import { z } from "zod";
import { BRANCHES } from "./constants";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "EMPLOYEE", "MANAGEMENT"]),
  branches: z.array(z.enum(["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"])),
  isActive: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
  role: z.enum(["ADMIN", "EMPLOYEE", "MANAGEMENT"]).optional(),
  branches: z.array(z.enum(["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"])).optional(),
  isActive: z.boolean().optional(),
});

export const ParsedRowSchema = z.object({
  branch: z.enum(["Supermarket", "Gold Loan", "ML Loan", "Vehicle Loan", "Personal Loan"]),
  closingBalance: z.number().min(0),
  disbursement: z.number().min(0),
  collection: z.number().min(0),
  npa: z.number().min(0),
  dpdBuckets: z.record(
    z.enum(["0", "1-30", "31-60", "61-90", "91-180", "181+"]),
    z.object({
      count: z.number().min(0),
      amount: z.number().min(0),
    })
  ),
});

export const AlertCreateSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
});
