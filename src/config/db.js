const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const isVercel = process.env.VERCEL === '1';

const pool = new Pool({
  connectionString: env.databaseUrl,
  // Force SSL for Render or any remote DB; only disable for localhost
  ssl: (env.databaseUrl.includes('localhost') || env.databaseUrl.includes('127.0.0.1')) ? false : { rejectUnauthorized: false },
  // Vercel: one short-lived process per invocation — keep pool tiny to protect Neon limits
  max: isVercel ? 1 : 10,
  min: isVercel ? 0 : 2,
  idleTimeoutMillis: isVercel ? 5000 : 30000,
  connectionTimeoutMillis: 10000,
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
