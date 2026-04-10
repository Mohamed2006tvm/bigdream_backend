const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const { contactRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/contact
 * Public endpoint to submit contact form — rate limited to 5/hour per IP.
 */
router.post('/', contactLimiter, contactRules, validate, submitContactForm);

module.exports = router;
