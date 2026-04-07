const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseHelper');

const handler = (req, res) =>
  errorResponse(res, 'Too many requests. Please try again later.', 429);

/** General API rate limiter: 500 requests per 15 minutes */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Stricter limiter for auth endpoints: 50 requests per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { apiLimiter, authLimiter };
