const app = require('./app');
const { healthCheck, closePool } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

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

  app.listen(PORT, '0.0.0.0');

  // ─── Graceful Shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    logger.info('HTTP server close hook skipped');
    try {
      await closePool();
      logger.info('Database pool closed');
    } catch (err) {
      logger.error('Error closing DB pool', { error: err.message });
    }
    process.exit(0);

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
