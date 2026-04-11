const express = require('express');
const router = express.Router();
const { createBooking, getAvailability, getAuthorizedDates } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/availability/dates', getAuthorizedDates);
router.get('/availability', getAvailability);

module.exports = router;
