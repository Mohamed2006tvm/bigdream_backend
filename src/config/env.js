require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// ─── Required in all environments ────────────────────────────────────────────
const alwaysRequired = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
];

// ─── Required only in production ─────────────────────────────────────────────
const prodRequired = [
  'FRONTEND_URL',
  'APP_NAME',
];

const required = isProd ? [...alwaysRequired, ...prodRequired] : alwaysRequired;

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM,
  appName: process.env.APP_NAME || 'My Big Dream',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  twilioAdminPhone: process.env.TWILIO_ADMIN_PHONE,
};
