const express = require('express');
const router = express.Router();
const { createBooking, getAvailability, getAuthorizedDates } = require('../controllers/bookingController');
const { bookingLimiter } = require('../middleware/rateLimiter');

router.post('/', bookingLimiter, createBooking);
router.get('/availability/dates', getAuthorizedDates);
router.get('/availability', getAvailability);

module.exports = router;
