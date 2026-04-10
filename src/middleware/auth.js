const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const env = require('../config/env');

/**
 * Middleware: Verify JWT from HttpOnly cookie (preferred) or Authorization header.
 * Attaches decoded admin payload to req.admin.
 */
const authenticate = (req, res, next) => {
  let token = null;

  // 1. Prefer HttpOnly cookie (more secure, not accessible to JS)
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }
  // 2. Fallback: Authorization header (for API clients / testing)
  else {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return errorResponse(res, 'Authentication required', 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

module.exports = { authenticate };
