const { sendBookingConfirmationEmail } = require('./emailService');
const logger = require('../utils/logger');

/**
 * Send email confirmation notifications.
 * Uses Promise.allSettled so that failure does not block.
 *
 * @param {object} booking - { email, phone, customer_name, screen_name, time_slot, date }
 */
const sendBookingConfirmation = async (booking) => {
  const results = await Promise.allSettled([
    sendBookingConfirmationEmail(booking),
  ]);

  results.forEach((result) => {
    const channel = 'Email';
    if (result.status === 'rejected') {
      logger.warn(`${channel} notification failed`, { reason: result.reason?.message });
    } else {
      logger.info(`${channel} notification sent successfully`);
    }
  });

  return results;
};

module.exports = { sendBookingConfirmation };
