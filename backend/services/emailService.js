import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

let transporter;

const getTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
};

const baseTemplate = ({ title, body, actionUrl, actionLabel }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
    <h2>${title}</h2>
    <p>${body}</p>
    ${
      actionUrl
        ? `<p><a href="${actionUrl}" style="display:inline-block;background:#059669;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">${actionLabel || "Open JobPortal"}</a></p>`
        : ""
    }
    <p style="color:#64748b;font-size:13px">JobPortal - MERN Stack Job Portal Application</p>
  </div>
`;

export const emailTemplates = {
  welcome: ({ name }) => ({
    subject: "Welcome to JobPortal",
    html: baseTemplate({
      title: `Welcome, ${name}`,
      body: "Your JobPortal account is ready. You can now manage jobs, applications, resumes, and AI career tools.",
    }),
  }),
  applicationSubmitted: ({ name, jobTitle }) => ({
    subject: "Application submitted",
    html: baseTemplate({
      title: "Application submitted",
      body: `${name}, your application for ${jobTitle} was submitted successfully.`,
    }),
  }),
  applicationStatus: ({ name, jobTitle, status }) => ({
    subject: `Application ${status}`,
    html: baseTemplate({
      title: `Application ${status}`,
      body: `${name}, your application for ${jobTitle} is now ${status}.`,
    }),
  }),
  passwordReset: ({ resetUrl }) => ({
    subject: "Password reset request",
    html: baseTemplate({
      title: "Password reset",
      body: "Use the button below to reset your password.",
      actionUrl: resetUrl,
      actionLabel: "Reset Password",
    }),
  }),
};

export const sendEmail = async ({ to, template, payload }) => {
  const mailTemplate = emailTemplates[template]?.(payload || {});
  if (!to || !mailTemplate) return false;

  const mailer = getTransporter();
  if (!mailer) {
    logger.info("Email skipped because SMTP is not configured.", {
      to,
      template,
    });
    return false;
  }

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: mailTemplate.subject,
    html: mailTemplate.html,
  });

  return true;
};
