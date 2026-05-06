import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireCompanyScope } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { pool } from "../db/pool.js";
const r = Router();
const paramsSchema = z.object({ companyId: z.string().uuid(), portfolioType: z.enum(["gold_loan", "pledge_loan", "ml_loan", "personal_loan", "vehicle_loan"]) });
const qSchema = z.object({ period: z.enum(["ftd", "mtd", "ytd"]).default("ftd") });
async function base(companyId, portfolioType, period) {
    return pool.query(`SELECT ks.* FROM kpi_snapshots ks
     JOIN portfolios p ON p.id = ks.portfolio_id
     WHERE p.company_id=$1 AND p.type=$2 AND ks.period_type=$3
     ORDER BY ks.as_of_date DESC LIMIT 1`, [companyId, portfolioType, period]);
}
r.get("/:companyId/:portfolioType", requireAuth, requireCompanyScope, validate(paramsSchema, "params"), validate(qSchema, "query"), async (req, res) => {
    const row = await base(req.params.companyId, req.params.portfolioType, req.query.period);
    res.json(row.rows[0] || null);
});
r.get("/:companyId/:portfolioType/kpis", requireAuth, requireCompanyScope, validate(paramsSchema, "params"), validate(qSchema, "query"), async (req, res) => res.json((await base(req.params.companyId, req.params.portfolioType, req.query.period)).rows[0] || null));
r.get("/:companyId/:portfolioType/branches", requireAuth, requireCompanyScope, async (req, res) => res.json([]));
r.get("/:companyId/:portfolioType/buckets", requireAuth, requireCompanyScope, async (req, res) => res.json([]));
r.get("/:companyId/:portfolioType/high-risk", requireAuth, requireCompanyScope, async (req, res) => res.json([]));
r.get("/:companyId/:portfolioType/disbursement-trend", requireAuth, requireCompanyScope, async (req, res) => res.json([]));
r.get("/:companyId/:portfolioType/alerts", requireAuth, requireCompanyScope, async (req, res) => res.json([]));
export default r;
