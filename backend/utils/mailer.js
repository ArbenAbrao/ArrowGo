// utils/mailer.js
const nodemailer = require("nodemailer");

// Reads SMTP credentials from environment variables — add these to your .env:
//   SMTP_HOST=smtp.yourprovider.com
//   SMTP_PORT=587
//   SMTP_SECURE=false        (true if using port 465)
//   SMTP_USER=your@email.com
//   SMTP_PASS=your-smtp-password-or-app-password
//   MAIL_FROM="ArrowGo Logistics <no-reply@arrowgo.com>"
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a status-change notification to a visitor.
 * Silently no-ops if there's no email on file, and never throws —
 * a failed notification should not fail the approve/reject request.
 */
async function sendAppointmentStatusEmail(to, { visitorName, status, branch, date, scheduleTime }) {
  if (!to) return;

  const isApproved = status === "approved";
  const subject = isApproved
    ? "Your ArrowGo gate pass has been approved"
    : "Your ArrowGo appointment request was not approved";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1B2A47;">
      <h2 style="color:${isApproved ? "#2F6F5E" : "#C1442D"}; margin-bottom: 4px;">
        ${isApproved ? "Gate Pass Approved" : "Request Declined"}
      </h2>
      <p>Hi ${visitorName || "there"},</p>
      <p>
        Your appointment request for <strong>${branch || "our facility"}</strong>
        on <strong>${date || "the requested date"}</strong> at <strong>${scheduleTime || ""}</strong>
        has been <strong>${status}</strong>.
      </p>
      ${
        isApproved
          ? "<p>Please present your pass number at the gate on arrival.</p>"
          : "<p>If you believe this was a mistake, please contact your host directly or submit a new request.</p>"
      }
      <p style="color:#8A7F68; font-size:12px; margin-top:24px;">— ArrowGo Logistics Inc.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"ArrowGo Logistics" <no-reply@arrowgo.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}

module.exports = { sendAppointmentStatusEmail };