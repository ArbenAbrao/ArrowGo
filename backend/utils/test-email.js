// test-email.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: process.env.SMTP_USER, // send to yourself as a test
  subject: "Test email",
  text: "If you got this, SMTP works.",
}).then(info => {
  console.log("Sent:", info.response);
}).catch(err => {
  console.error("Failed:", err);
});