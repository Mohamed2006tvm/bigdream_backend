const { sendBookingConfirmationEmail } = require('./emailService');
const { sendBookingConfirmationWhatsApp, sendBookingAdminNotificationWhatsApp } = require('./whatsappService');
const logger = require('../utils/logger');

/**
 * Send both email and WhatsApp confirmation notifications.
 * Uses Promise.allSettled so that failure of one does not block the other.
 *
 * @param {object} booking - { email, phone, customer_name, screen_name, time_slot, date }
 */
const sendBookingConfirmation = async (booking) => {
  const results = await Promise.allSettled([
    sendBookingConfirmationEmail(booking),
    sendBookingConfirmationWhatsApp(booking),
    sendBookingAdminNotificationWhatsApp(booking),
  ]);

  results.forEach((result, index) => {
    const channel = index === 0 ? 'Email' : index === 1 ? 'Customer WhatsApp' : 'Admin WhatsApp';
    if (result.status === 'rejected') {
      logger.warn(`${channel} notification failed`, { reason: result.reason?.message });
    } else {
      logger.info(`${channel} notification sent successfully`);
    }
  });

  return results;
};

module.exports = { sendBookingConfirmation };
