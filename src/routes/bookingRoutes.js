const express = require('express');
const router = express.Router();
const { createBooking, getAvailability, getAuthorizedDates } = require('../controllers/bookingController');
const { createBookingRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');

router.post('/', createBookingRules, validate, createBooking);

router.get('/availability/dates', getAuthorizedDates);

router.get('/availability', getAvailability);

module.exports = router;
