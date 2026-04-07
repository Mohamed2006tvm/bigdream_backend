const logger = require('../utils/logger');

/**
 * Centralized Express error handler.
 * Must be last middleware in the chain (4-param function).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });

  // Postgres unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A booking for this screen, date, and time slot already exists.',
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = { errorHandler };
