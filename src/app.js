require('./config/env'); // validate env vars first
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middleware/errorHandler');
const { requestId } = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const env = require('./config/env');

const allowedOrigins = [
  ...new Set(
    [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://mybigdream.vercel.app',
      'https://www.mydreamsurprise.com',
      'https://mydreamsurprise.com',
      env.frontendUrl,
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      ...env.additionalCorsOrigins,
    ].filter(Boolean)
  ),
];

// Routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingRoutes = require('./routes/settingRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.disable('x-powered-by');

// ─── Trust Proxy ─────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── Request ID (attach before all logging) ──────────────────────────────────
app.use(requestId);

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Security headers (API: allow cross-origin fetches when CORS allows the origin)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    hsts: env.isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─── CORS — callback form; use callback(null, false) for deny (never callback(Error): that becomes HTTP 500)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  })
);

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsing (size limits reduce abuse of JSON/urlencoded payloads) ─────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(hpp());

// ─── HTTP Request Logger ─────────────────────────────────────────────────────
if (env.nodeEnv !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}



// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/contact', contactRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
const healthHandler = (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
};
app.get('/health', healthHandler);
// Alias for clients whose axios baseURL is `.../api` (e.g. wake-up ping → GET .../api/health)
app.get('/api/health', healthHandler);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  const { requestId: rid } = req;
  res.status(404).json({
    success: false,
    message: 'Route not found',
    ...(rid && { requestId: rid }),
  });
});

// ─── Centralized Error Handler ───────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
