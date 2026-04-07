const { sendContactEmail } = require('../services/emailService');
const contactModel = require('../models/contactModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * POST /api/contact
 * Handle contact form submissions.
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return errorResponse(res, 'Please provide name, email, and message', 400);
    }

    // Save to database
    await contactModel.createMessage({ name, email, message });

    // Send email to owner
    await sendContactEmail({ name, email, message });

    return successResponse(res, null, 200, 'Your message has been sent successfully. We will get back to you soon!');
  } catch (err) {
    logger.error('Contact form submission error', { error: err.message });
    next(err);
  }
};

module.exports = { submitContactForm };
