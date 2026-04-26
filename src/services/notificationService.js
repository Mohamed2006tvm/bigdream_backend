const { sendBookingConfirmationEmail } = require('./emailService');
const { sendAdminBookingNotification } = require('./web3formsService');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Send email confirmation notifications.
 * Uses Promise.allSettled so that failure does not block.
 *
 * @param {object} booking - { email, phone, customer_name, screen_name, time_slot, date }
 */
const sendBookingConfirmation = async (booking) => {
  const notifications = [
    sendBookingConfirmationEmail(booking),
  ];

  // Add admin notification via Web3 Forms if API key is available
  if (env.web3formsApiKey && env.smtpUser) {
    notifications.push(
      sendAdminBookingNotification(booking, env.smtpUser)
        .catch(err => logger.warn('Admin notification via Web3 Forms failed', { error: err.message }))
    );
  }

  const results = await Promise.allSettled(notifications);

  results.forEach((result, index) => {
    const channel = index === 0 ? 'Customer Email' : index === 1 ? 'Admin Notification (Web3 Forms)' : 'Unknown';
    if (result.status === 'rejected') {
      logger.warn(`${channel} notification failed`, { reason: result.reason?.message });
    } else {
      logger.info(`${channel} notification sent successfully`);
    }
  });

  return results;
};

module.exports = { sendBookingConfirmation };
