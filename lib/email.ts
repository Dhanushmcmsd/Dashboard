import { Resend } from "resend";
import { DailyDashboardData } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use RESEND_FROM_EMAIL env var (your verified domain address).
// Fall back to onboarding@resend.dev ONLY for local dev / testing.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "BranchSync <onboarding@resend.dev>";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function escape(str: string): string {
  return (str || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to BranchSync Dashboard",
      html: `<p>Hi ${escape(name)},</p><p>Welcome to BranchSync. Your account has been registered and is pending admin approval.</p>`,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

export async function sendDeactivationEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "BranchSync Account Deactivated",
      html: `<p>Hi ${escape(name)},</p><p>Your BranchSync account has been deactivated. Please contact your administrator if you believe this is a mistake.</p>`,
    });
  } catch (error) {
    console.error("Error sending deactivation email:", error);
  }
}

export async function sendReactivationEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "BranchSync Account Reactivated",
      html: `<p>Hi ${escape(name)},</p><p>Your BranchSync account has been reactivated. You can now log in to the dashboard.</p>`,
    });
  } catch (error) {
    console.error("Error sending reactivation email:", error);
  }
}

/**
 * Sent when an admin approves a brand-new user for the first time.
 * Includes a password-set link so they can immediately log in.
 */
export async function sendApprovalWithPasswordEmail(
  email: string,
  name: string,
  setPasswordLink: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your BranchSync account has been approved",
      html: `
        <div style="font-family:sans-serif;max-width:520px;">
          <h2 style="color:#2563EB;">Welcome to BranchSync, ${escape(name || "there")}!</h2>
          <p>Your account has been <strong>approved</strong> by the administrator.</p>
          <p>To get started, set your password using the button below.
             This link expires in <strong>24 hours</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${setPasswordLink}"
               style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;
                      text-decoration:none;font-weight:600;display:inline-block;">
              Set My Password
            </a>
          </p>
          <p style="color:#888;font-size:13px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${setPasswordLink}" style="color:#2563EB;word-break:break-all;">${setPasswordLink}</a>
          </p>
          <p style="color:#888;font-size:12px;margin-top:24px;">BranchSync &bull; Do not reply to this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Error sending approval+password email:", error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your BranchSync password",
      html: `
        <p>Hi ${escape(name || "User")},</p>
        <p>We received a request to reset your BranchSync password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}

export async function sendUploadReminderEmail(
  email: string,
  name: string,
  branch: string,
  deadline: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `⏰ Reminder: Upload data for ${branch} by ${deadline}`,
      html: `
        <p>Hi ${escape(name || "User")},</p>
        <p>This is a reminder that <strong>${escape(branch)}</strong> has not uploaded today's data yet.</p>
        <p>Please log in and upload before <strong>${deadline}</strong> to ensure the management dashboard reflects your branch's numbers.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/employee">Upload Now</a></p>
      `,
    });
  } catch (error) {
    console.error("Error sending upload reminder email:", error);
  }
}

export async function sendDailySummaryEmail(
  email: string,
  name: string,
  data: DailyDashboardData
) {
  try {
    const branchRows = data.branches
      .map(
        (b) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;">${escape(b.branch)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">&#8377;${fmt(b.closingBalance || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">&#8377;${fmt(b.disbursement || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">&#8377;${fmt(b.collection || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">&#8377;${fmt(b.npa || 0)}</td>
      </tr>`
      )
      .join("");

    const missingWarning =
      data.missingBranches.length > 0
        ? `<p style="color:#f87171;margin-top:16px;">&#9888;&#65039; Missing data from: <strong>${data.missingBranches.map(escape).join(", ")}</strong></p>`
        : `<p style="color:#4ade80;margin-top:16px;">&#9989; All branches uploaded today.</p>`;

    const html = `
      <div style="font-family:sans-serif;background:#0A0A0C;color:#e5e5e5;padding:24px;border-radius:12px;max-width:700px;">
        <h2 style="color:#fff;margin-bottom:4px;">&#128202; BranchSync Daily Summary</h2>
        <p style="color:#888;margin-top:0;">Report for ${escape(data.dateKey)}</p>
        <p>Hi ${escape(name || "User")},</p>
        <p>Here's today's performance snapshot across all branches:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#1a1a1e;">
              <th style="padding:10px 12px;text-align:left;color:#888;font-weight:600;">Branch</th>
              <th style="padding:10px 12px;text-align:right;color:#888;font-weight:600;">Closing Balance</th>
              <th style="padding:10px 12px;text-align:right;color:#888;font-weight:600;">Disbursement</th>
              <th style="padding:10px 12px;text-align:right;color:#888;font-weight:600;">Collection</th>
              <th style="padding:10px 12px;text-align:right;color:#888;font-weight:600;">NPA</th>
            </tr>
          </thead>
          <tbody>
            ${branchRows}
            <tr style="background:#1a1a1e;font-weight:700;">
              <td style="padding:10px 12px;">TOTAL</td>
              <td style="padding:10px 12px;text-align:right;">&#8377;${fmt(data.totals.closingBalance)}</td>
              <td style="padding:10px 12px;text-align:right;">&#8377;${fmt(data.totals.disbursement)}</td>
              <td style="padding:10px 12px;text-align:right;">&#8377;${fmt(data.totals.collection)}</td>
              <td style="padding:10px 12px;text-align:right;">&#8377;${fmt(data.totals.npa)}</td>
            </tr>
          </tbody>
        </table>
        ${missingWarning}
        <p style="margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/management/daily" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Dashboard &#8594;</a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `&#128202; BranchSync Daily Summary &#8212; ${data.dateKey}`,
      html,
    });
  } catch (error) {
    console.error("Error sending daily summary email:", error);
  }
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
) {
  try {
    const allComplete = data.missingBranches.length === 0;
    const completionPct = Math.round(
      (data.totalUploaded / Math.max(data.totalBranches, 1)) * 100
    );

    const barFilled = Math.round(completionPct / 5);
    const progressBar =
      "&#9608;".repeat(barFilled) + "&#9617;".repeat(20 - barFilled);

    const uploadedRows = data.uploadedBranches
      .map(
        (b) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #1e2428;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-right:8px;vertical-align:middle;"></span>
          ${escape(b)}
        </td>
        <td style="padding:8px 14px;border-bottom:1px solid #1e2428;text-align:right;">
          <span style="background:#14532d;color:#4ade80;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">UPLOADED</span>
        </td>
      </tr>`
      )
      .join("");

    const missingRows = data.missingBranches
      .map(
        (b) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:1px solid #1e2428;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f97316;margin-right:8px;vertical-align:middle;"></span>
          ${escape(b)}
        </td>
        <td style="padding:8px 14px;border-bottom:1px solid #1e2428;text-align:right;">
          <span style="background:#431407;color:#f97316;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;">MISSING</span>
        </td>
      </tr>`
      )
      .join("");

    const statusHeadline = allComplete
      ? `<p style="color:#4ade80;font-size:15px;font-weight:600;margin:0;">&#9989; All ${data.totalBranches} branches uploaded on time.</p>`
      : `<p style="color:#f97316;font-size:15px;font-weight:600;margin:0;">&#9888;&#65039; ${data.totalUploaded} of ${data.totalBranches} branches uploaded &mdash; ${data.missingBranches.length} pending.</p>`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0A0A0C;color:#e5e5e5;padding:28px;border-radius:14px;max-width:560px;">
        <div style="margin-bottom:20px;">
          <h2 style="color:#fff;margin:0 0 4px;font-size:20px;">&#128203; BranchSync Upload Status</h2>
          <p style="color:#666;margin:0;font-size:13px;">${escape(data.dateKey)}</p>
        </div>
        <p style="font-size:14px;color:#ccc;">Hi ${escape(name || "Admin")},</p>
        <p style="font-size:14px;color:#ccc;margin-top:0;">Here is the branch upload status for today.</p>
        <div style="background:#111116;border:1px solid #2a2a35;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
          ${statusHeadline}
          <div style="margin-top:10px;">
            <div style="font-family:monospace;font-size:12px;color:${
              allComplete ? "#4ade80" : "#f97316"
            };letter-spacing:1px;">${progressBar} ${completionPct}%</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#111116;border:1px solid #2a2a35;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#18181f;">
              <th style="padding:10px 14px;text-align:left;color:#666;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Branch</th>
              <th style="padding:10px 14px;text-align:right;color:#666;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
            </tr>
          </thead>
          <tbody>${uploadedRows}${missingRows}</tbody>
        </table>
        <p style="font-size:13px;color:#888;margin-top:16px;">
          <strong style="color:#e5e5e5;">${data.totalUploaded} of ${data.totalBranches} branches</strong> uploaded today.
        </p>
        <p style="margin-top:20px;">
          <a href="${process.env.NEXTAUTH_URL}/management/daily"
             style="background:#2563EB;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">
            View Dashboard &#8594;
          </a>
        </p>
        <p style="font-size:11px;color:#444;margin-top:24px;border-top:1px solid #1a1a1e;padding-top:12px;">BranchSync &bull; Automated notification &bull; Do not reply</p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `&#128203; BranchSync Upload Status &#8212; ${data.dateKey}`,
      html,
    });
  } catch (error) {
    console.error("Error sending daily status email:", error);
  }
}
