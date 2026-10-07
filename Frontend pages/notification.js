let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

let twilioClient = null;
try {
  const twilio = require("twilio");
  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch {
  twilioClient = null;
}

function getMailTransport() {
  if (!nodemailer || !process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, text) {
  to = String(to || "").trim();
  const transport = getMailTransport();

  if (!transport || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.log(`[email:skipped] to=${to} subject="${subject}"`);
    return { sent: false, reason: "SMTP not configured or invalid recipient" };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || `"Rivoshoppa" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email:error]", err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendSMS(to, body) {
  to = normalizePhoneNumber(to);
  const phoneLike = /^\+[1-9][0-9]{7,14}$/.test(to);

  if (!twilioClient || !phoneLike) {
    console.log(`[sms:skipped] to=${to} body="${body}"`);
    return { sent: false, reason: "Twilio not configured or invalid phone number" };
  }

  try {
    await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER,
      body,
    });
    return { sent: true };
  } catch (err) {
    console.error("[sms:error]", err.message);
    return { sent: false, reason: err.message };
  }
}

function normalizePhoneNumber(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("250")) return `+${digits}`;
  if (digits.startsWith("0")) return `+250${digits.slice(1)}`;
  return `+${digits}`;
}

async function notifyContact(contact, subject, message) {
  const normalizedContact = String(contact || "").trim();
  if (!normalizedContact) return { sent: false, reason: "No contact provided" };
  if (normalizedContact.includes("@")) {
    return sendEmail(normalizedContact, subject, message);
  }
  return sendSMS(normalizedContact, message);
}

module.exports = { sendEmail, sendSMS, notifyContact };