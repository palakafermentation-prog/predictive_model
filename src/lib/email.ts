import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM } from "./env";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT!, 10),
  secure: parseInt(SMTP_PORT!, 10) === 465,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

transporter.verify().then(() => {
  console.log("[Email] SMTP connection verified");
}).catch((err) => {
  console.error("[Email] SMTP connection failed:", err);
});

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your email address</h2>
      <p>Click the link below to verify your email address and activate your account.</p>
      <p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Or copy and paste this URL into your browser:<br>
        <a href="${verificationUrl}" style="color: #6b7280;">${verificationUrl}</a>
      </p>
    </div>
  `;

  await sendEmail(to, "Verify your email address", html);
}

export async function sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password. This link will expire shortly.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Or copy and paste this URL into your browser:<br>
        <a href="${resetUrl}" style="color: #6b7280;">${resetUrl}</a>
      </p>
    </div>
  `;

  await sendEmail(to, "Reset your password", html);
}
