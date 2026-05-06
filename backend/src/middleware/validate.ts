import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny, target: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    req[target] = parsed.data;
    next();
  };
