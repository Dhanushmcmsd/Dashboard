import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { pool } from "../db/pool.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/auth.js";
const r = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
r.post("/login", loginLimiter, validate(z.object({ email: z.string().email(), password: z.string().min(8) })), async (req, res) => {
    const { email, password } = req.body;
    const userRes = await pool.query(`SELECT * FROM users WHERE email=$1 AND is_active=true`, [email]);
    const user = userRes.rows[0];
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
        return res.status(401).json({ error: "Invalid credentials" });
    const payload = { sub: user.id, role: user.role, company_id: user.company_id, email: user.email };
    const access = signAccessToken(payload);
    const refresh = signRefreshToken({ sub: user.id });
    const refreshHash = await bcrypt.hash(refresh, 12);
    await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '7 day')`, [user.id, refreshHash]);
    res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 15 * 60 * 1000 });
    res.cookie("refresh_token", refresh, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: access });
});
r.post("/refresh", async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token)
        return res.status(401).json({ error: "Missing token" });
    try {
        const decoded = verifyRefreshToken(token);
        const rows = await pool.query(`SELECT * FROM refresh_tokens WHERE user_id=$1 AND expires_at > now() AND revoked_at IS NULL`, [decoded.sub]);
        let match = false;
        for (const row of rows.rows) {
            if (await bcrypt.compare(token, row.token_hash)) {
                match = true;
                break;
            }
        }
        if (!match)
            return res.status(401).json({ error: "Invalid token" });
        const userRes = await pool.query(`SELECT * FROM users WHERE id=$1 AND is_active=true`, [decoded.sub]);
        const user = userRes.rows[0];
        if (!user)
            return res.status(401).json({ error: "User not found" });
        const access = signAccessToken({ sub: user.id, role: user.role, company_id: user.company_id, email: user.email });
        res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 15 * 60 * 1000 });
        res.json({ accessToken: access });
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
});
r.post("/logout", async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (token) {
        try {
            const decoded = verifyRefreshToken(token);
            await pool.query(`UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, [decoded.sub]);
        }
        catch { }
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(204).send();
});
export default r;
