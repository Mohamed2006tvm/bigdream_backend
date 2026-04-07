const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');
const env = require('../config/env');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded admin payload to req.admin.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authorization token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Invalid token', 401);
  }
};

module.exports = { authenticate };
