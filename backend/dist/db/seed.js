import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "./pool.js";
const companies = [
    ["Supra Pacific", "supra-pacific", true],
    ["Ideal Supermarket", "ideal-supermarket", false],
    ["CFCICI", "cfcici", false],
    ["Central Bazar", "central-bazar", false],
    ["Centora", "centora", false],
    ["Central Bio Fuel", "central-bio-fuel", false]
];
async function run() {
    for (const [name, slug, isActive] of companies) {
        await pool.query(`INSERT INTO companies(name,slug,is_active) VALUES($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,is_active=EXCLUDED.is_active`, [name, slug, isActive]);
    }
    const c = await pool.query(`SELECT id, slug FROM companies`);
    const types = ["gold_loan", "pledge_loan", "ml_loan", "personal_loan", "vehicle_loan"];
    for (const row of c.rows) {
        for (const t of types) {
            const active = row.slug === "supra-pacific" && t === "gold_loan";
            await pool.query(`INSERT INTO portfolios(company_id,type,is_active) VALUES($1,$2,$3) ON CONFLICT (company_id,type) DO UPDATE SET is_active=EXCLUDED.is_active`, [row.id, t, active]);
        }
    }
    const superAdminPw = await bcrypt.hash("ChangeMe123456", 12);
    await pool.query(`INSERT INTO users(company_id,email,password_hash,role,name,is_active)
     VALUES(NULL,$1,$2,'super_admin','Super Admin',true)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`, ["admin@dashboard.local", superAdminPw]);
    await pool.end();
}
run();
