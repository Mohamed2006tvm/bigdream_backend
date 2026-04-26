const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Send admin notification using Web3 Forms
 * @param {object} bookingData - { customer_name, email, phone, screen_name, date, time_slot }
 * @param {string} adminEmail - Admin email to receive notification
 */
const sendAdminBookingNotification = async (bookingData, adminEmail) => {
  const { customer_name, email, phone, screen_name, date, time_slot } = bookingData;
  
  try {
    const formData = {
      access_key: env.web3formsApiKey,
      subject: `New Booking Alert - ${screen_name} - ${date}`,
      from_name: 'My Big Dream System',
      to: adminEmail,
      message: `
A new booking has been made at My Big Dream:

📋 Booking Details:
• Customer: ${customer_name}
• Email: ${email}
• Phone: ${phone}
• Screen: ${screen_name}
• Date: ${date}
• Time Slot: ${time_slot}

Please check your admin dashboard for more details.
      `.trim(),
      replyTo: email, // Allow admin to reply directly to customer
    };

    const response = await axios.post('https://api.web3forms.com/submit', formData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 second timeout
    });

    if (response.data.success) {
      logger.info('Admin notification sent via Web3 Forms', { 
        adminEmail, 
        customer: customer_name,
        screen: screen_name,
        date,
        time_slot 
      });
      return { success: true, messageId: response.data.message_id };
    } else {
      throw new Error(response.data.message || 'Web3 Forms submission failed');
    }
  } catch (error) {
    logger.error('Failed to send admin notification via Web3 Forms', {
      error: error.message,
      adminEmail,
      customer: customer_name,
    });
    throw error;
  }
};

module.exports = { sendAdminBookingNotification };
