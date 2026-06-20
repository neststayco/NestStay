import nodemailer from "nodemailer";
import Logger from "./logger.service.js";

const smtpConfigured =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

let transporter = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  Logger.warn("NotificationService: SMTP not configured — OTPs will log to console (dev mode)");
}

class NotificationService {
  static async sendOTPEmail(email, otp, type) {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n${"─".repeat(50)}`);
        console.log(`  OTP for : ${email}`);
        console.log(`  Code    : ${otp}`);
        console.log(`  Type    : ${type}`);
        console.log(`${"─".repeat(50)}\n`);
      }

      if (!smtpConfigured) {
        return true;
      }

      const config = {
        REGISTER: {
          subject: "Nest Stay — Verify your email",
          text: `Your registration OTP is: ${otp}\n\nThis OTP expires in 10 minutes. Do not share it.`,
        },
        FORGOT_PASSWORD: {
          subject: "Nest Stay — Password reset OTP",
          text: `Your password reset OTP is: ${otp}\n\nThis OTP expires in 10 minutes. Do not share it.`,
        },
      };

      const { subject, text } = config[type] || {
        subject: "Nest Stay — OTP",
        text: `Your OTP is: ${otp}`,
      };

      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject,
        text,
      });

      Logger.event("otp.email.sent", { email, type });
      return true;
    } catch (error) {
      Logger.error("sendOTPEmail failed", { error: error.message });
      return false;
    }
  }

}

export default NotificationService;
