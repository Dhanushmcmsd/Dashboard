import { Resend } from "resend";
import { DailyDashboardData } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BranchSync <onboarding@resend.dev>";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to BranchSync Dashboard",
      html: `<p>Hi ${safeName},</p><p>Welcome to BranchSync. Your account has been registered and is pending admin approval.</p>`,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}

export async function sendDeactivationEmail(email: string, name: string) {
  try {
    const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "BranchSync Account Deactivated",
      html: `<p>Hi ${safeName},</p><p>Your BranchSync account has been deactivated. Please contact your administrator if you believe this is a mistake.</p>`,
    });
  } catch (error) {
    console.error("Error sending deactivation email:", error);
  }
}

export async function sendReactivationEmail(email: string, name: string) {
  try {
    const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "BranchSync Account Reactivated",
      html: `<p>Hi ${safeName},</p><p>Your BranchSync account has been reactivated. You can now log in to the dashboard.</p>`,
    });
  } catch (error) {
    console.error("Error sending reactivation email:", error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
) {
  try {
    const safeName = (name || "User").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your BranchSync password",
      html: `
        <p>Hi ${safeName},</p>
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
    const safeName = (name || "User").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeBranch = branch.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `⏰ Reminder: Upload data for ${branch} by ${deadline}`,
      html: `
        <p>Hi ${safeName},</p>
        <p>This is a reminder that <strong>${safeBranch}</strong> has not uploaded today's data yet.</p>
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
    const safeName = (name || "User").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const branchRows = data.branches
      .map(
        (b) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;">${b.branch}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">₹${fmt(b.closingBalance || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">₹${fmt(b.disbursement || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">₹${fmt(b.collection || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2e;text-align:right;">₹${fmt(b.npa || 0)}</td>
      </tr>`
      )
      .join("");

    const missingWarning =
      data.missingBranches.length > 0
        ? `<p style="color:#f87171;margin-top:16px;">⚠️ Missing data from: <strong>${data.missingBranches.join(", ")}</strong></p>`
        : `<p style="color:#4ade80;margin-top:16px;">✅ All branches uploaded today.</p>`;

    const html = `
      <div style="font-family:sans-serif;background:#0A0A0C;color:#e5e5e5;padding:24px;border-radius:12px;max-width:700px;">
        <h2 style="color:#fff;margin-bottom:4px;">📊 BranchSync Daily Summary</h2>
        <p style="color:#888;margin-top:0;">Report for ${data.dateKey}</p>

        <p>Hi ${safeName},</p>
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
              <td style="padding:10px 12px;text-align:right;">₹${fmt(data.totals.closingBalance)}</td>
              <td style="padding:10px 12px;text-align:right;">₹${fmt(data.totals.disbursement)}</td>
              <td style="padding:10px 12px;text-align:right;">₹${fmt(data.totals.collection)}</td>
              <td style="padding:10px 12px;text-align:right;">₹${fmt(data.totals.npa)}</td>
            </tr>
          </tbody>
        </table>

        ${missingWarning}

        <p style="margin-top:24px;">
          <a href="${process.env.NEXTAUTH_URL}/management/daily" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Dashboard →</a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `📊 BranchSync Daily Summary — ${data.dateKey}`,
      html,
    });
  } catch (error) {
    console.error("Error sending daily summary email:", error);
  }
}
