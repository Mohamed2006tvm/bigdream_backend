const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

/**
 * Send a booking confirmation email.
 * @param {object} booking - { email, customer_name, screen_name, time_slot, date }
 */
const sendBookingConfirmationEmail = async ({ email, customer_name, screen_name, time_slot, date }) => {
  try {
    const result = await transporter.sendMail({
      from: env.emailFrom,
      to: email,
      subject: `Booking Confirmed — Screen ${screen_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">Booking Confirmed ✅</h2>
          <p>Dear <strong>${customer_name}</strong>,</p>
          <p>Your booking is confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Screen</td>
              <td style="padding: 8px;">Screen ${screen_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Date</td>
              <td style="padding: 8px;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; background: #f5f5f5;">Time</td>
              <td style="padding: 8px;">${time_slot}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; color: #666;">Thank you for choosing ${env.appName}. Please arrive 15 minutes before your scheduled time.</p>
        </div>
      `,
    });
    logger.info('Confirmation email sent', { to: email, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error('Failed to send email', { error: err.message, to: email });
    throw err;
  }
};

/**
 * Send a contact form email to the admin.
 * @param {object} contact - { name, email, message }
 */
const sendContactEmail = async ({ name, email, message }) => {
  try {
    const result = await transporter.sendMail({
      from: env.emailFrom,
      to: env.smtpUser, // Send to the owner
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">New Website Message ✉️</h2>
          <p>You have received a new message from your website contact form.</p>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">This message was sent from your Event Hall Booking platform.</p>
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

module.exports = { sendBookingConfirmationEmail, sendContactEmail };
