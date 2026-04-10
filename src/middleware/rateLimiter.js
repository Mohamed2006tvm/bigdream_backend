const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseHelper');

const isTest = process.env.NODE_ENV === 'test';

const handler = (req, res) =>
  errorResponse(res, 'Too many requests. Please try again later.', 429);

/** General API rate limiter: 500 requests per 15 minutes */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? Infinity : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => isTest,
});

/** Stricter limiter for auth endpoints: 10 requests per 15 minutes */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? Infinity : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => isTest,
});

/** Booking creation limiter: 20 bookings per hour per IP */
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? Infinity : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => isTest,
});

/** Contact form limiter: 5 submissions per hour per IP */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? Infinity : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => isTest,
});

module.exports = { apiLimiter, authLimiter, bookingLimiter, contactLimiter };
