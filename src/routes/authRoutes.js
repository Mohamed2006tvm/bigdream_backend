const express = require('express');
const router = express.Router();
const { login } = require('../controllers/adminController');
const { loginRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/login
 * Admin login — returns JWT token.
 */
router.post('/login', authLimiter, loginRules, validate, login);

module.exports = router;
