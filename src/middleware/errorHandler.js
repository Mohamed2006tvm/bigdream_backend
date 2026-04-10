const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Centralized Express error handler.
 * Must be the last middleware in the chain (4-param function).
 * Never leaks stack traces or internal details to the client in production.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  // Log full error details server-side (safe, never sent to client)
  logger.error(err.message, {
    requestId,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // ─── PostgreSQL Specific Errors ──────────────────────────────────────────
  // Unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A booking for this screen, date, and time slot already exists.',
    });
  }
  // Foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
    });
  }
  // Not-null constraint violation
  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      message: 'Required field is missing.',
    });
  }
  // Check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Invalid value provided.',
    });
  }
  // Connection / timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === '57P01') {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  // In production, never expose internal error details to the client
  const message = env.isProd && statusCode === 500
    ? 'Internal server error. Please try again later.'
    : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(requestId !== 'unknown' && { requestId }),
  });
};

module.exports = { errorHandler };
