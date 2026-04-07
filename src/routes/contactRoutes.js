const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const { contactRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');

/**
 * POST /api/contact
 * Public endpoint to submit contact form.
 */
router.post('/', contactRules || [], validate, submitContactForm);

module.exports = router;
