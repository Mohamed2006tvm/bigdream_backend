const twilio = require('twilio');
const env = require('../config/env');
const logger = require('../utils/logger');

const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

/**
 * Format phone number to E.164 if it's not already.
 * Defaults to +91 if no country code provided (assuming India based on logs).
 * @param {string} phone 
 * @returns {string}
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return phone;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
};

/**
 * Send a WhatsApp booking confirmation message.
 * @param {object} booking - { phone, screen_name, time_slot, date }
 * Phone must be in E.164 format: +1234567890
 */
const sendBookingConfirmationWhatsApp = async ({ phone, screen_name, time_slot, date }) => {
  const formattedPhone = formatPhoneNumber(phone);
  const to = `whatsapp:${formattedPhone}`;
  const body =
    `Booking Confirmed ✅\n` +
    `Screen ${screen_name}\n` +
    `${time_slot} | ${date}\n\n` +
    `Thank you for choosing ${env.appName}!`;

  try {
    const message = await client.messages.create({
      from: env.twilioWhatsappFrom,
      to,
      body,
    });
    logger.info('WhatsApp message sent', { to: formattedPhone, sid: message.sid });
    return message;
  } catch (err) {
    logger.error('Failed to send WhatsApp message', { error: err.message, to: formattedPhone });
    throw err;
  }
};

/**
 * Send a WhatsApp notification to the admin with full booking details.
 * @param {object} booking - { customer_name, phone, email, screen_name, time_slot, date }
 */
const sendBookingAdminNotificationWhatsApp = async ({
  customer_name,
  phone,
  email,
  screen_name,
  time_slot,
  date,
}) => {
  const formattedAdminPhone = formatPhoneNumber(env.twilioAdminPhone);
  const to = `whatsapp:${formattedAdminPhone}`;
  const body =
    `New Booking Received! 🆕\n\n` +
    `👤 Customer: ${customer_name}\n` +
    `📞 Phone: ${phone}\n` +
    `✉️ Email: ${email || 'N/A'}\n` +
    `📺 Screen: ${screen_name}\n` +
    `🕒 Slot: ${time_slot}\n` +
    `📅 Date: ${date}\n\n` +
    `Manage bookings at: ${env.frontendUrl}/admin`;

  try {
    const message = await client.messages.create({
      from: env.twilioWhatsappFrom,
      to,
      body,
    });
    logger.info('Admin WhatsApp notification sent', { to: formattedAdminPhone, sid: message.sid });
    return message;
  } catch (err) {
    logger.error('Failed to send Admin WhatsApp notification', {
      error: err.message,
      to: formattedAdminPhone,
    });
    throw err;
  }
};

module.exports = { sendBookingConfirmationWhatsApp, sendBookingAdminNotificationWhatsApp };
