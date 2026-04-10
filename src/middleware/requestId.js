const { v4: uuidv4 } = require('uuid');

/**
 * Middleware: Attach a unique X-Request-ID to every request and response.
 * Enables distributed tracing across logs.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = { requestId };
