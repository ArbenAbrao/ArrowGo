// mailer.js
// Place this alongside your db.js (backend root).
// Reads the SMTP_* vars from your .env — no renaming needed:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_SECURE=false
//   SMTP_USER=arbenabrao123@gmail.com
//   SMTP_PASS=your16characterapppassword   <-- Gmail "App Password", not your login password
//   MAIL_FROM="ArrowGo Logistics <arbenabrao123@gmail.com>"

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true only for port 465; false (with STARTTLS) for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otpCode, firstName = "") {
  const greetingName = firstName || "there";

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"VMVAS Support" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your VMVAS password reset code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #059669; margin-bottom: 4px;">Reset your password</h2>
        <p>Hi ${greetingName},</p>
        <p>Use the code below to reset your VMVAS password. This code expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f1f5f9; color: #0f172a; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          ${otpCode}
        </div>
        <p>If you didn't request this, you can safely ignore this email — your password will not change.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 32px;">VMVAS · Gate Control Access</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };