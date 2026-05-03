/**
 * lib/email.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained email module. All email logic lives here.
 * Provider: Resend (HTTP API — no SMTP, works in Vercel serverless)
 *
 * Features:
 *  - Typed `sendEmail()` core with retry logic (3 attempts, exponential backoff)
 *  - Every send emits structured console logs (INFO / WARN / ERROR)
 *  - All emails include both HTML and plain-text fallback
 *  - Non-fatal wrapper: email failures never crash request handlers
 *  - All HTML templates use inline styles (email-client safe)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Resend } from "resend";
import { DailyDashboardData } from "@/types";

// ─── Client ──────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "BranchSync <onboarding@resend.dev>";

const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailType =
  | "welcome"
  | "approval"
  | "deactivation"
  | "reactivation"
  | "password_reset"
  | "upload_reminder"
  | "daily_summary"
  | "daily_status";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string; // plain-text fallback — required
  type: EmailType;
}

interface SendResult {
  success: boolean;
  emailType: EmailType;
  to: string;
  attempts: number;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return (str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Core send with retry ────────────────────────────────────────────────────

async function sendEmail(
  payload: EmailPayload,
  maxRetries = 3
): Promise<SendResult> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      console.info(
        `[email] ✓ SENT | type=${payload.type} to=${payload.to} attempt=${attempt}/${maxRetries}`
      );

      return { success: true, emailType: payload.type, to: payload.to, attempts: attempt };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);

      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s backoff
        console.warn(
          `[email] ⚠ RETRY | type=${payload.type} to=${payload.to} attempt=${attempt}/${maxRetries} delay=${delay}ms error=${lastError}`
        );
        await sleep(delay);
      }
    }
  }

  console.error(
    `[email] ✗ FAILED | type=${payload.type} to=${payload.to} allAttempts=${maxRetries} error=${lastError}`
  );

  return {
    success: false,
    emailType: payload.type,
    to: payload.to,
    attempts: maxRetries,
    error: lastError,
  };
}

/**
 * Non-fatal wrapper — call this from route handlers.
 * Logs failures but never throws, so email errors never break a request.
 */
async function sendEmailSafe(payload: EmailPayload): Promise<boolean> {
  const result = await sendEmail(payload);
  if (!result.success) {
    console.error(
      `[email] Non-fatal failure | type=${result.emailType} to=${result.to} error=${result.error}`
    );
  }
  return result.success;
}

// ─── Shared template shell ───────────────────────────────────────────────────

function emailShell(headerText: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#016469;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:600;">${headerText}</h1>
    </div>
    <div style="padding:32px;">
      ${bodyContent}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#6b7280;font-size:12px;">BranchSync &bull; This is an automated message &bull; Do not reply</p>
    </div>
  </div>
</body>
</html>`;
}

const BTN = `display:inline-block;padding:12px 28px;background:#016469;color:#ffffff!important;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;`;

// ─── Public email functions ───────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const safeName = esc(name);
  return sendEmailSafe({
    to: email,
    type: "welcome",
    subject: "Welcome to BranchSync — pending admin approval",
    html: emailShell(
      "Welcome to BranchSync",
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
         Your account has been registered and is <strong>pending admin approval</strong>.
         You'll receive another email once your access is approved.
       </p>
       <p style="color:#6b7280;font-size:13px;margin:0;">If you didn't sign up for BranchSync, you can safely ignore this email.</p>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Your BranchSync account has been registered and is pending admin approval.\n` +
      `You'll receive another email once your access is approved.\n\n` +
      `If you didn't sign up, ignore this email.`,
  });
}

export async function sendDeactivationEmail(
  email: string,
  name: string
): Promise<boolean> {
  const safeName = esc(name);
  return sendEmailSafe({
    to: email,
    type: "deactivation",
    subject: "Your BranchSync account has been deactivated",
    html: emailShell(
      "Account Deactivated",
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">
         Your BranchSync account has been <strong>deactivated</strong>.
         Please contact your administrator if you believe this is a mistake.
       </p>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Your BranchSync account has been deactivated.\n` +
      `Contact your administrator if you believe this is a mistake.`,
  });
}

export async function sendReactivationEmail(
  email: string,
  name: string
): Promise<boolean> {
  const safeName = esc(name);
  return sendEmailSafe({
    to: email,
    type: "reactivation",
    subject: "Your BranchSync account has been reactivated",
    html: emailShell(
      "Account Reactivated ✓",
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
         Your BranchSync account has been <strong>reactivated</strong>. You can now log in to the dashboard.
       </p>
       <a href="${APP_URL}/login" style="${BTN}">Go to Dashboard</a>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Your BranchSync account has been reactivated. You can now log in.\n` +
      `Login: ${APP_URL}/login`,
  });
}

export async function sendApprovalWithPasswordEmail(
  email: string,
  name: string,
  setPasswordLink: string
): Promise<boolean> {
  const safeName = esc(name);
  return sendEmailSafe({
    to: email,
    type: "approval",
    subject: "Your BranchSync account has been approved — set your password",
    html: emailShell(
      "Access Approved ✓",
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
         Your account has been <strong>approved</strong> by the administrator.
         Click the button below to set your password and get started.
       </p>
       <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">This link expires in <strong>24 hours</strong>.</p>
       <a href="${setPasswordLink}" style="${BTN}">Set My Password</a>
       <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">
         Or copy this link into your browser:<br/>
         <span style="word-break:break-all;color:#016469;">${setPasswordLink}</span>
       </p>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Your BranchSync account has been approved.\n` +
      `Set your password here (expires in 24 hours):\n${setPasswordLink}\n\n` +
      `If you didn't request this, ignore this email.`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
): Promise<boolean> {
  const safeName = esc(name);
  return sendEmailSafe({
    to: email,
    type: "password_reset",
    subject: "Reset your BranchSync password",
    html: emailShell(
      "Reset Your Password",
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
         We received a request to reset your BranchSync password.
         Click the button below to choose a new one.
       </p>
       <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
       <a href="${resetLink}" style="${BTN}">Reset Password</a>
       <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">
         Or copy this link into your browser:<br/>
         <span style="word-break:break-all;color:#016469;">${resetLink}</span>
       </p>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Reset your BranchSync password using this link (expires in 1 hour):\n${resetLink}\n\n` +
      `If you didn't request this, ignore this email.`,
  });
}

export async function sendUploadReminderEmail(
  email: string,
  name: string,
  branch: string,
  deadline: string
): Promise<boolean> {
  const safeName = esc(name);
  const safeBranch = esc(branch);
  const safeDeadline = esc(deadline);
  return sendEmailSafe({
    to: email,
    type: "upload_reminder",
    subject: `⏰ Reminder: Upload data for ${branch} by ${deadline}`,
    html: emailShell(
      `Upload Reminder — ${safeBranch}`,
      `<p style="color:#111827;font-size:16px;margin:0 0 16px;">Hi ${safeName},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
         <strong>${safeBranch}</strong> has not uploaded today's data yet.
         Please log in and upload before <strong>${safeDeadline}</strong> to ensure
         the management dashboard reflects your branch's numbers.
       </p>
       <a href="${APP_URL}/employee" style="${BTN}">Upload Now</a>`
    ),
    text:
      `Hi ${name},\n\n` +
      `Reminder: ${branch} has not uploaded today's data yet.\n` +
      `Please upload before ${deadline}.\n` +
      `Login: ${APP_URL}/employee`,
  });
}

export async function sendDailySummaryEmail(
  email: string,
  name: string,
  data: DailyDashboardData
): Promise<boolean> {
  const branchRows = data.branches
    .map(
      (b) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${esc(b.branch)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">&#8377;${fmt(b.closingBalance || 0)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">&#8377;${fmt(b.disbursement || 0)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">&#8377;${fmt(b.collection || 0)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">&#8377;${fmt(b.npa || 0)}</td>
        </tr>`
    )
    .join("");

  const missingNote =
    data.missingBranches.length > 0
      ? `<p style="color:#dc2626;margin:16px 0 0;">⚠ Missing data from: <strong>${data.missingBranches.map(esc).join(", ")}</strong></p>`
      : `<p style="color:#16a34a;margin:16px 0 0;">✅ All branches uploaded today.</p>`;

  const plainBranches = data.branches
    .map((b) => `  ${b.branch}: ₹${fmt(b.closingBalance || 0)} balance`)
    .join("\n");

  const html = emailShell(
    "BranchSync Daily Summary",
    `<p style="color:#6b7280;margin:0 0 16px;font-size:14px;">Report for ${esc(data.dateKey)}</p>
     <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi ${esc(name)}, here's today's performance snapshot:</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
       <thead>
         <tr style="background:#f3f4f6;">
           <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:600;">Branch</th>
           <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600;">Closing Balance</th>
           <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600;">Disbursement</th>
           <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600;">Collection</th>
           <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600;">NPA</th>
         </tr>
       </thead>
       <tbody>
         ${branchRows}
         <tr style="background:#f3f4f6;font-weight:700;">
           <td style="padding:10px 12px;color:#111827;">TOTAL</td>
           <td style="padding:10px 12px;text-align:right;color:#111827;">&#8377;${fmt(data.totals.closingBalance)}</td>
           <td style="padding:10px 12px;text-align:right;color:#111827;">&#8377;${fmt(data.totals.disbursement)}</td>
           <td style="padding:10px 12px;text-align:right;color:#111827;">&#8377;${fmt(data.totals.collection)}</td>
           <td style="padding:10px 12px;text-align:right;color:#111827;">&#8377;${fmt(data.totals.npa)}</td>
         </tr>
       </tbody>
     </table>
     ${missingNote}
     <p style="margin:24px 0 0;">
       <a href="${APP_URL}/management/daily" style="${BTN}">View Full Dashboard</a>
     </p>`
  );

  const plainMissing =
    data.missingBranches.length > 0
      ? `Missing: ${data.missingBranches.join(", ")}`
      : `All branches uploaded.`;

  return sendEmailSafe({
    to: email,
    type: "daily_summary",
    subject: `📊 BranchSync Daily Summary — ${data.dateKey}`,
    html,
    text:
      `BranchSync Daily Summary — ${data.dateKey}\n\n` +
      `Hi ${name},\n\nBranch breakdown:\n${plainBranches}\n\n` +
      `Totals: Balance ₹${fmt(data.totals.closingBalance)} | Disbursement ₹${fmt(data.totals.disbursement)} | Collection ₹${fmt(data.totals.collection)} | NPA ₹${fmt(data.totals.npa)}\n\n` +
      `${plainMissing}\n\nView dashboard: ${APP_URL}/management/daily`,
  });
}

export async function sendDailyStatusEmail(
  email: string,
  name: string,
  data: {
    dateKey: string;
    uploadedBranches: string[];
    missingBranches: string[];
    totalUploaded: number;
    totalBranches: number;
  }
): Promise<boolean> {
  const allComplete = data.missingBranches.length === 0;
  const completionPct = Math.round(
    (data.totalUploaded / Math.max(data.totalBranches, 1)) * 100
  );

  const uploadedRows = data.uploadedBranches
    .map(
      (b) =>
        `<tr>
          <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;color:#374151;">✅ ${esc(b)}</td>
          <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">
            <span style="background:#dcfce7;color:#16a34a;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">UPLOADED</span>
          </td>
        </tr>`
    )
    .join("");

  const missingRows = data.missingBranches
    .map(
      (b) =>
        `<tr>
          <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;color:#374151;">⚠ ${esc(b)}</td>
          <td style="padding:8px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">
            <span style="background:#fee2e2;color:#dc2626;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">MISSING</span>
          </td>
        </tr>`
    )
    .join("");

  const statusLine = allComplete
    ? `<p style="color:#16a34a;font-weight:600;margin:0 0 12px;">✅ All ${data.totalBranches} branches uploaded on time.</p>`
    : `<p style="color:#d97706;font-weight:600;margin:0 0 12px;">⚠ ${data.totalUploaded} of ${data.totalBranches} branches uploaded — ${data.missingBranches.length} pending.</p>`;

  const html = emailShell(
    "BranchSync Upload Status",
    `<p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${esc(data.dateKey)}</p>
     <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi ${esc(name)}, here is the branch upload status for today.</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
       ${statusLine}
       <div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;">
         <div style="background:${allComplete ? "#16a34a" : "#d97706"};height:8px;width:${completionPct}%;transition:width 0.3s;"></div>
       </div>
       <p style="color:#6b7280;font-size:12px;margin:6px 0 0;">${completionPct}% complete</p>
     </div>
     <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
       <thead>
         <tr style="background:#f3f4f6;">
           <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Branch</th>
           <th style="padding:10px 14px;text-align:right;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Status</th>
         </tr>
       </thead>
       <tbody>${uploadedRows}${missingRows}</tbody>
     </table>
     <p style="margin:24px 0 0;">
       <a href="${APP_URL}/management/daily" style="${BTN}">View Dashboard</a>
     </p>`
  );

  const plainUploaded = data.uploadedBranches.map((b) => `  ✓ ${b}`).join("\n");
  const plainMissing = data.missingBranches.map((b) => `  ✗ ${b}`).join("\n");

  return sendEmailSafe({
    to: email,
    type: "daily_status",
    subject: `📋 BranchSync Upload Status — ${data.dateKey}`,
    html,
    text:
      `BranchSync Upload Status — ${data.dateKey}\n\n` +
      `Hi ${name},\n\n` +
      `${data.totalUploaded} of ${data.totalBranches} branches uploaded (${completionPct}%).\n\n` +
      (plainUploaded ? `Uploaded:\n${plainUploaded}\n\n` : "") +
      (plainMissing ? `Missing:\n${plainMissing}\n\n` : "") +
      `View dashboard: ${APP_URL}/management/daily`,
  });
}
