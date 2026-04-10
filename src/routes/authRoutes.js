const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/adminController');
const { loginRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/auth/login
 * Admin login — returns JWT token + sets HttpOnly cookie.
 */
router.post('/login', authLimiter, loginRules, validate, login);

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
router.post('/logout', logout);

module.exports = router;
