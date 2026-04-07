/**
 * Send a successful JSON response.
 * @param {object} res        - Express response object
 * @param {*}      data       - Payload to return
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message    - Optional success message
 */
const successResponse = (res, data = null, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 * @param {object} res        - Express response object
 * @param {string} message    - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {*}      errors     - Optional validation errors
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { successResponse, errorResponse };
