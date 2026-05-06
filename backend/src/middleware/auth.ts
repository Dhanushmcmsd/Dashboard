import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = verifyAccessToken(token) as any;
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      company_id: decoded.company_id,
      email: decoded.email
    };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: Array<"super_admin" | "company_admin" | "employee">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function requireCompanyScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "super_admin") return next();
  if (req.user.company_id !== req.params.companyId) return res.status(403).json({ error: "Company scope mismatch" });
  next();
}
