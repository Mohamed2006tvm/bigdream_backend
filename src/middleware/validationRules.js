const { body } = require('express-validator');

const createBookingRules = [
  body('screen_name')
    .trim()
    .escape()
    .isIn(['A', 'B', 'C'])
    .withMessage('screen_name must be A, B, or C'),
  body('date')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error('Booking date cannot be in the past');
      return true;
    }),
  body('time_slot')
    .trim()
    .matches(/^\d{1,2}:\d{2}\s*[\-\u2013\u2014]\s*\d{1,2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM - HH:MM format'),
  body('customer_name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('customer_name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('customer_name must be between 2 and 255 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required')
    .matches(/^\+?[\d\s\-]{7,20}$/)
    .withMessage('phone must be a valid number'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('email must be a valid email address')
    .isLength({ max: 320 })
    .normalizeEmail(),
];

const updateBookingRules = [
  body('status')
    .optional()
    .trim()
    .isIn(['booked', 'cancelled', 'cleaning', 'maintenance'])
    .withMessage('status must be one of: booked, cancelled, cleaning, maintenance'),
  body('time_slot')
    .optional()
    .trim()
    .matches(/^\d{1,2}:\d{2}\s*[\-\u2013\u2014]\s*\d{1,2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM - HH:MM format'),
  body('screen_id')
    .optional()
    .isUUID()
    .withMessage('screen_id must be a valid UUID'),
];

const blockSlotRules = [
  body('screen_name')
    .trim()
    .escape()
    .isIn(['A', 'B', 'C'])
    .withMessage('screen_name must be A, B, or C'),
  body('date')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  body('time_slot')
    .trim()
    .matches(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)
    .withMessage('time_slot must be in HH:MM-HH:MM format'),
  body('status')
    .trim()
    .isIn(['cleaning', 'maintenance'])
    .withMessage('status must be cleaning or maintenance'),
];

const loginRules = [
  body('username')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('username is required')
    .isLength({ max: 100 }),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ max: 200 }),
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('currentPassword is required')
    .isLength({ max: 200 }),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('newPassword must be 8–128 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('newPassword must include at least one letter and one number'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('confirmPassword is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('confirmPassword must match newPassword'),
];

const contactRules = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 }),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .isLength({ max: 320 })
    .normalizeEmail(),
  body('message')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 2, max: 2000 })
    .withMessage('Message must be between 2 and 2000 characters'),
];

module.exports = {
  createBookingRules,
  updateBookingRules,
  blockSlotRules,
  loginRules,
  changePasswordRules,
  contactRules,
};
