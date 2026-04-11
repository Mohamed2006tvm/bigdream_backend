/**
 * Vercel Serverless entry — exports the Express app so all routes work on one function.
 * For long-running servers (Railway, Render, VPS), use `npm start` → src/server.js instead.
 */
module.exports = require('../src/app');
