import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { pool } from "../db/pool.js";
const r = Router();
r.use(requireAuth, requireRole("super_admin"));
r.get("/companies", async (_req, res) => res.json((await pool.query(`SELECT * FROM companies ORDER BY created_at`)).rows));
r.post("/companies", validate(z.object({ name: z.string().min(1), slug: z.string().min(1), is_active: z.boolean().optional() })), async (req, res) => {
    const row = await pool.query(`INSERT INTO companies(name,slug,is_active) VALUES($1,$2,$3) RETURNING *`, [req.body.name, req.body.slug, req.body.is_active ?? true]);
    res.status(201).json(row.rows[0]);
});
r.post("/users", validate(z.object({ company_id: z.string().uuid().nullable(), email: z.string().email(), password: z.string().min(12), role: z.enum(["super_admin", "company_admin", "employee"]), name: z.string().min(1) })), async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 12);
    const row = await pool.query(`INSERT INTO users(company_id,email,password_hash,role,name) VALUES($1,$2,$3,$4,$5) RETURNING id,company_id,email,role,name,is_active`, [req.body.company_id, req.body.email, hash, req.body.role, req.body.name]);
    res.status(201).json(row.rows[0]);
});
r.patch("/users/:id", validate(z.object({ id: z.string().uuid() }), "params"), validate(z.object({ is_active: z.boolean().optional(), role: z.enum(["super_admin", "company_admin", "employee"]).optional(), name: z.string().optional() })), async (req, res) => {
    const current = await pool.query(`SELECT * FROM users WHERE id=$1`, [req.params.id]);
    if (!current.rows[0])
        return res.status(404).json({ error: "Not found" });
    const u = current.rows[0];
    const row = await pool.query(`UPDATE users SET is_active=$2, role=$3, name=$4 WHERE id=$1 RETURNING id,company_id,email,role,name,is_active`, [req.params.id, req.body.is_active ?? u.is_active, req.body.role ?? u.role, req.body.name ?? u.name]);
    res.json(row.rows[0]);
});
r.post("/portfolios", validate(z.object({ company_id: z.string().uuid(), type: z.enum(["gold_loan", "pledge_loan", "ml_loan", "personal_loan", "vehicle_loan"]), is_active: z.boolean().optional(), gold_rate_per_gram: z.number().int().nullable().optional() })), async (req, res) => {
    const row = await pool.query(`INSERT INTO portfolios(company_id,type,is_active,gold_rate_per_gram) VALUES($1,$2,$3,$4) RETURNING *`, [req.body.company_id, req.body.type, req.body.is_active ?? false, req.body.gold_rate_per_gram ?? null]);
    res.status(201).json(row.rows[0]);
});
export default r;
