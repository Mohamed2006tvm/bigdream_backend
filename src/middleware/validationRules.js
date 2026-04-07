const { body } = require('express-validator');

const createBookingRules = [
  body('screen_name')
    .trim()
    .isIn(['A', 'B', 'C'])
    .withMessage('screen_name must be A, B, or C'),
  body('date')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date (YYYY-MM-DD)'),
  body('time_slot')
    .trim()
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM-HH:MM format'),
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('customer_name is required')
    .isLength({ max: 255 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required')
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage('phone must be a valid international number (E.164)'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('email must be a valid email address')
    .normalizeEmail(),
];

const updateBookingRules = [
  body('status')
    .optional()
    .isIn(['booked', 'cancelled', 'cleaning', 'maintenance'])
    .withMessage('status must be one of: booked, cancelled, cleaning, maintenance'),
  body('time_slot')
    .optional()
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM-HH:MM format'),
];

const blockSlotRules = [
  body('screen_name')
    .trim()
    .isIn(['A', 'B', 'C'])
    .withMessage('screen_name must be A, B, or C'),
  body('date')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  body('time_slot')
    .trim()
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM-HH:MM format'),
  body('status')
    .isIn(['cleaning', 'maintenance'])
    .withMessage('status must be cleaning or maintenance'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('username is required'),
  body('password').notEmpty().withMessage('password is required'),
];

const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
];

module.exports = { createBookingRules, updateBookingRules, blockSlotRules, loginRules, contactRules };
