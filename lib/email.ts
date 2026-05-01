import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BranchSync <onboarding@resend.dev>";

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
