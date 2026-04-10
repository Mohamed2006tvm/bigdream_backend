const express = require('express');
const router = express.Router();
const { createBooking, getAvailability, getAuthorizedDates } = require('../controllers/bookingController');
const { createBookingRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');
const { bookingLimiter } = require('../middleware/rateLimiter');

/** POST /api/bookings — Rate limited to 20 bookings/hour per IP */
router.post('/', bookingLimiter, createBookingRules, validate, createBooking);

router.get('/availability/dates', getAuthorizedDates);

router.get('/availability', getAvailability);

module.exports = router;
