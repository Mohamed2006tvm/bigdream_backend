const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
  // Verify connection on demand, not at startup
  pool: true,
  maxConnections: 5,
});

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Send a booking confirmation email.
 * @param {object} booking - { email, customer_name, screen_name, time_slot, date }
 */
const sendBookingConfirmationEmail = async ({ email, customer_name, screen_name, time_slot, date }) => {
  const safeName = escapeHtml(customer_name);
  const safeScreen = escapeHtml(screen_name);
  const safeTimeSlot = escapeHtml(time_slot);
  const safeDate = escapeHtml(date);
  const safeAppName = escapeHtml(env.appName);

  try {
    const result = await transporter.sendMail({
      from: env.emailFrom,
      to: email,
      subject: `Booking Confirmed — Screen ${safeScreen} | ${safeAppName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">Booking Confirmed ✅</h2>
          <p>Dear <strong>${safeName}</strong>,</p>
          <p>Your booking at <strong>${safeAppName}</strong> is confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Screen</td>
              <td style="padding: 8px;">Screen ${safeScreen}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Date</td>
              <td style="padding: 8px;">${safeDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Time</td>
              <td style="padding: 8px;">${safeTimeSlot}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; color: #666;">
            Thank you for choosing ${safeAppName}. Please arrive 15 minutes before your scheduled time.
          </p>
          <p style="color: #aaa; font-size: 11px; margin-top: 32px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });
    logger.info('Confirmation email sent', { to: email, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error('Failed to send booking confirmation email', { error: err.message, to: email });
    throw err;
  }
};

/**
 * Send a contact form email to the admin.
 * @param {object} contact - { name, email, message }
 */
const sendContactEmail = async ({ name, email, message }) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  try {
    const result = await transporter.sendMail({
      from: env.emailFrom,
      to: env.smtpUser,
      replyTo: email, // Allows admin to reply directly to the sender
      subject: `New Inquiry from ${safeName} — My Big Dream`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">New Website Inquiry ✉️</h2>
          <p>You have received a new message from your website contact form.</p>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            This message was sent from the My Big Dream website contact form.
            Reply to this email to respond directly to the sender.
          </p>
        </div>
      `,
    });
    logger.info('Contact email sent', { from: email, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error('Failed to send contact email', { error: err.message, from: email });
    throw err;
  }
};

/**
 * Send admin notification for new booking
 * @param {object} bookingData - { customer_name, email, phone, screen_name, date, time_slot }
 */
const sendAdminBookingNotification = async (bookingData) => {
  const { customer_name, email, phone, screen_name, date, time_slot } = bookingData;
  const safeName = escapeHtml(customer_name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeScreen = escapeHtml(screen_name);
  const safeTimeSlot = escapeHtml(time_slot);
  const safeDate = escapeHtml(date);
  const safeAppName = escapeHtml(env.appName);

  try {
    const result = await transporter.sendMail({
      from: env.emailFrom,
      to: env.smtpUser,
      replyTo: email,
      subject: `🎉 New Booking Alert - ${safeScreen} | ${safeAppName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">New Booking Received 🎉</h2>
          <p>A new booking has been made at <strong>${safeAppName}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="color: #333; margin-top: 0;">📋 Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef; width: 140px;">Customer</td>
                <td style="padding: 8px;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">Email</td>
                <td style="padding: 8px;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">Phone</td>
                <td style="padding: 8px;">${safePhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">Screen</td>
                <td style="padding: 8px;">Screen ${safeScreen}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">Date</td>
                <td style="padding: 8px;">${safeDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; background: #e9ecef;">Time Slot</td>
                <td style="padding: 8px;">${safeTimeSlot}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            💡 <strong>Quick Actions:</strong> Reply to this email to contact the customer directly, or check your admin dashboard for more details.
          </p>
          
          <p style="color: #aaa; font-size: 11px; margin-top: 32px;">
            This is an automated notification from ${safeAppName} booking system.
          </p>
        </div>
      `,
    });
    
    logger.info('Admin booking notification sent', { 
      to: env.smtpUser, 
      customer: safeName,
      screen: safeScreen,
      messageId: result.messageId 
    });
    
    return result;
  } catch (err) {
    logger.error('Failed to send admin booking notification', { error: err.message, customer: safeName });
    throw err;
  }
};

module.exports = { sendBookingConfirmationEmail, sendContactEmail, sendAdminBookingNotification };
