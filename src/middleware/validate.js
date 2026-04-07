const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Middleware: Run after express-validator checks.
 * Returns 400 with a list of validation errors if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Validation failed',
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

module.exports = { validate };
