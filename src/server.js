const app = require('./app');
const env = require('./config/env');
const { healthCheck, closePool } = require('./config/db');
const logger = require('./utils/logger');

const PORT = env.port;

const startServer = async () => {
  // ─── Verify DB connectivity before accepting traffic ─────────────────────
  try {
    logger.info('Checking database connectivity...');
    await healthCheck();
    logger.info('Database connection verified ✅');
  } catch (err) {
    logger.error('Database connection failed on startup — aborting', { error: err.message });
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`🚀 ${env.appName} server running on port ${PORT} [${env.nodeEnv}]`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await closePool();
        logger.info('Database pool closed');
      } catch (err) {
        logger.error('Error closing DB pool', { error: err.message });
      }
      process.exit(0);
    });

    // Force shutdown after 10 seconds if requests hang
    setTimeout(() => {
      logger.warn('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Uncaught Error Handlers ────────────────────────────────────────────
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: String(reason) });
    process.exit(1);
  });
};

startServer();
