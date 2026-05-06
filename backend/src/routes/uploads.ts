import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { pool } from "../db/pool.js";
import { processUpload } from "../services/upload.js";

const r = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ].includes(file.mimetype);
    if (ok) { cb(null, true); } else { cb(new Error("Invalid MIME type")); }
  }
});

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

async function handle(req: any, res: any, statementType: "loan_balance" | "transaction_statement") {
  const { portfolioId, statementDate } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "File required" });

  const key = `${req.user.company_id}/${portfolioId}/${Date.now()}-${file.originalname}`;
  const uploaded = await supabase.storage.from(process.env.SUPABASE_BUCKET || "dashboard-uploads").upload(key, file.buffer, { contentType: file.mimetype });
  if (uploaded.error) return res.status(500).json({ error: uploaded.error.message });

  const q = await pool.query(
    `INSERT INTO data_uploads (portfolio_id, uploaded_by, statement_type, file_url, statement_date, row_count, status)
     VALUES ($1,$2,$3,$4,$5,0,'pending') RETURNING id`,
    [portfolioId, req.user.id, statementType, key, statementDate]
  );
  const uploadId = q.rows[0].id;
  setImmediate(() => processUpload(uploadId, statementType, file.buffer));
  res.status(201).json({ upload_id: uploadId });
}

const bodySchema = z.object({ portfolioId: z.string().uuid(), statementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

r.post("/loan-balance", requireAuth, requireRole("employee"), upload.single("file"), validate(bodySchema), (req, res) => handle(req, res, "loan_balance"));
r.post("/transaction-stmt", requireAuth, requireRole("employee"), upload.single("file"), validate(bodySchema), (req, res) => handle(req, res, "transaction_statement"));

r.get("/", requireAuth, async (req, res) => {
  const rows = await pool.query(
    `SELECT du.* FROM data_uploads du JOIN portfolios p ON p.id=du.portfolio_id WHERE p.company_id=$1 ORDER BY du.created_at DESC`,
    [req.user?.company_id]
  );
  res.json(rows.rows);
});

r.get("/:id/status", requireAuth, async (req, res) => {
  const row = await pool.query(
    `SELECT du.id, du.status, du.error_log FROM data_uploads du JOIN portfolios p ON p.id=du.portfolio_id WHERE du.id=$1 AND p.company_id=$2`,
    [req.params.id, req.user?.company_id]
  );
  if (!row.rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(row.rows[0]);
});

export default r;
