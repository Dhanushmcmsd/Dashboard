import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "super_admin" | "company_admin" | "employee";
        company_id: string | null;
        email: string;
      };
    }
  }
}
export {};
