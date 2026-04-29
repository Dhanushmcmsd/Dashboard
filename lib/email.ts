import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BranchSync <onboarding@resend.dev>"; // use this until you verify a domain
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── Welcome email when admin creates a new user ─────────────────────────────────
export async function sendWelcomeEmail({
  to,
  name,
  role,
  branches,
  setPasswordToken,
}: {
  to: string;
  name: string;
  role: string;
  branches: string[];
  setPasswordToken: string;
}) {
  const setPasswordUrl = `${APP_URL}/set-password?token=${setPasswordToken}`;
  const branchList = branches.length > 0 ? branches.join(", ") : "N/A";

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "You have been added to BranchSync Dashboard 🌟",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f766e;">Welcome to BranchSync, ${name}!</h2>
        <p>You have been granted access to the BranchSync Dashboard by the admin.</p>
        <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
          <tr>
            <td style="padding:8px; background:#f0fdfa; font-weight:bold;">Role</td>
            <td style="padding:8px; background:#f0fdfa;">${role}</td>
          </tr>
          <tr>
            <td style="padding:8px; font-weight:bold;">Branch(es)</td>
            <td style="padding:8px;">${branchList}</td>
          </tr>
        </table>
        <p>Click the button below to set your password and activate your account:</p>
        <a href="${setPasswordUrl}"
           style="display:inline-block; background:#0f766e; color:white; padding:12px 24px;
                  border-radius:6px; text-decoration:none; font-weight:bold; margin: 8px 0;">
          Set My Password
        </a>
        <p style="color:#6b7280; font-size:13px; margin-top:24px;">
          This link expires in 7 days. If you did not expect this email, ignore it.
        </p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px;">BranchSync — Supra Pacific Financial Services Ltd.</p>
      </div>
    `,
  });
}

// ── Notification email when user account is deactivated ──────────────────────────
export async function sendDeactivationEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your BranchSync account has been deactivated",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626;">Account Deactivated</h2>
        <p>Hi ${name},</p>
        <p>Your BranchSync Dashboard account has been deactivated by the admin.
           You will no longer be able to log in.</p>
        <p>If you believe this is a mistake, please contact your administrator.</p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px;">BranchSync — Supra Pacific Financial Services Ltd.</p>
      </div>
    `,
  });
}

// ── Reactivation email ─────────────────────────────────────────────────────────────
export async function sendReactivationEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Your BranchSync account has been reactivated ✅",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f766e;">Account Reactivated</h2>
        <p>Hi ${name},</p>
        <p>Good news! Your BranchSync Dashboard account has been reactivated.
           You can now log in at the link below:</p>
        <a href="${APP_URL}/login"
           style="display:inline-block; background:#0f766e; color:white; padding:12px 24px;
                  border-radius:6px; text-decoration:none; font-weight:bold; margin: 8px 0;">
          Go to Login
        </a>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />
        <p style="color:#9ca3af; font-size:12px;">BranchSync — Supra Pacific Financial Services Ltd.</p>
      </div>
    `,
  });
}
