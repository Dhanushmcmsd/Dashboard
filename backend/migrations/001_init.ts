import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createType("portfolio_type", ["gold_loan", "pledge_loan", "ml_loan", "personal_loan", "vehicle_loan"]);
  pgm.createType("user_role", ["super_admin", "company_admin", "employee"]);
  pgm.createType("statement_type", ["loan_balance", "transaction_statement"]);
  pgm.createType("upload_status", ["pending", "processing", "success", "failed"]);
  pgm.createType("period_type", ["ftd", "mtd", "ytd"]);

  pgm.createTable("companies", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true, unique: true },
    slug: { type: "text", notNull: true, unique: true },
    is_active: { type: "boolean", default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("portfolios", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    company_id: { type: "uuid", notNull: true, references: "companies(id)", onDelete: "cascade" },
    type: { type: "portfolio_type", notNull: true },
    is_active: { type: "boolean", default: false },
    gold_rate_per_gram: { type: "integer" }
  });
  pgm.addConstraint("portfolios", "portfolios_company_type_unique", "unique(company_id, type)");

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    company_id: { type: "uuid", references: "companies(id)", onDelete: "set null" },
    email: { type: "text", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    role: { type: "user_role", notNull: true },
    name: { type: "text", notNull: true },
    is_active: { type: "boolean", default: true }
  });

  pgm.createTable("refresh_tokens", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    token_hash: { type: "text", notNull: true },
    expires_at: { type: "timestamptz", notNull: true },
    revoked_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("data_uploads", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    portfolio_id: { type: "uuid", notNull: true, references: "portfolios(id)", onDelete: "cascade" },
    uploaded_by: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    statement_type: { type: "statement_type", notNull: true },
    file_url: { type: "text", notNull: true },
    statement_date: { type: "date", notNull: true },
    row_count: { type: "integer", notNull: true, default: 0 },
    status: { type: "upload_status", notNull: true, default: "pending" },
    error_log: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("gold_loan_accounts", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    upload_id: { type: "uuid", notNull: true, references: "data_uploads(id)", onDelete: "cascade" },
    loan_account_number: { type: "text" },
    customer_id: { type: "text" },
    branch_name: { type: "text" },
    disbursement_date: { type: "date" },
    disbursed_amount: { type: "bigint" },
    closing_balance: { type: "bigint" },
    gold_weight_mg: { type: "integer" },
    interest_rate: { type: "numeric(6,4)" },
    dpd_days: { type: "integer" },
    principal_cr: { type: "bigint" },
    statement_date: { type: "date" }
  });

  pgm.createTable("gold_loan_transactions", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    upload_id: { type: "uuid", notNull: true, references: "data_uploads(id)", onDelete: "cascade" },
    loan_account_number: { type: "text" },
    transaction_date: { type: "date" },
    principal_received: { type: "bigint" },
    interest_received: { type: "bigint" },
    other_charges_received: { type: "bigint" },
    total_amount_received: { type: "bigint" },
    statement_period_start: { type: "date" },
    statement_period_end: { type: "date" }
  });

  pgm.createTable("kpi_snapshots", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    portfolio_id: { type: "uuid", notNull: true, references: "portfolios(id)", onDelete: "cascade" },
    period_type: { type: "period_type", notNull: true },
    as_of_date: { type: "date", notNull: true },
    total_aum: { type: "bigint" },
    total_customers: { type: "integer" },
    avg_ticket_size: { type: "bigint" },
    yield_pct: { type: "numeric(6,4)" },
    gnpa_amount: { type: "bigint" },
    gnpa_pct: { type: "numeric(6,4)" },
    collection_efficiency_pct: { type: "numeric(6,4)" },
    total_gold_weight_mg: { type: "bigint" },
    avg_ltv_pct: { type: "numeric(6,4)" },
    new_disbursement: { type: "bigint" },
    total_collection: { type: "bigint" },
    overdue_collection: { type: "bigint" },
    bucket_0_30: { type: "bigint" },
    bucket_31_60: { type: "bigint" },
    bucket_61_90: { type: "bigint" },
    bucket_90_plus: { type: "bigint" },
    computed_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("kpi_snapshots", "kpi_unique", "unique(portfolio_id, period_type, as_of_date)");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("kpi_snapshots");
  pgm.dropTable("gold_loan_transactions");
  pgm.dropTable("gold_loan_accounts");
  pgm.dropTable("data_uploads");
  pgm.dropTable("refresh_tokens");
  pgm.dropTable("users");
  pgm.dropTable("portfolios");
  pgm.dropTable("companies");
  pgm.dropType("period_type");
  pgm.dropType("upload_status");
  pgm.dropType("statement_type");
  pgm.dropType("user_role");
  pgm.dropType("portfolio_type");
}
