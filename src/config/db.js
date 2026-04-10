const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
  // Force SSL for Render or any remote DB; only disable for localhost
  ssl: (env.databaseUrl.includes('localhost') || env.databaseUrl.includes('127.0.0.1')) ? false : { rejectUnauthorized: false },
  // Connection pool limits
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
});

pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Execute a parameterized query against the pool.
 */
const query = (text, params) => pool.query(text, params);

/**
 * Verify database connectivity. Used by server startup & /health endpoint.
 */
const healthCheck = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
};

/**
 * Gracefully drain and close all pool connections.
 */
const closePool = () => pool.end();

module.exports = { query, pool, healthCheck, closePool };
