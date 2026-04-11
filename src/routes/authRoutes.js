const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/adminController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/logout', logout);

module.exports = router;
