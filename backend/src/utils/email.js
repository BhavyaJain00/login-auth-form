import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  // For local/dev, just log emails instead of actually sending
  if (!process.env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

export const sendResetEmail = async (to, token) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: "Password reset",
    html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
  };

  const tx = getTransporter();
  if (!tx) {
    console.log("Password reset email (dev mode):", { to, resetLink });
    return;
  }

  await tx.sendMail(mailOptions);
};

