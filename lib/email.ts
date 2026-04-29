import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BranchSync <noreply@branchsync.suprapacific.com>";

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to BranchSync Dashboard",
      html: `<p>Hi ${name},</p><p>Welcome to BranchSync. Your account has been registered and is pending admin approval.</p>`,
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
      html: `<p>Hi ${name},</p><p>Your BranchSync account has been deactivated. Please contact your administrator if you believe this is a mistake.</p>`,
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
      html: `<p>Hi ${name},</p><p>Your BranchSync account has been reactivated. You can now log in to the dashboard.</p>`,
    });
  } catch (error) {
    console.error("Error sending reactivation email:", error);
  }
}
