const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate } = require('../middleware/auth');

// Public route to get slots
router.get('/time-slots', settingController.getTimeSlots);

// Admin only route to update slots
router.patch('/time-slots', authenticate, settingController.updateTimeSlots);

module.exports = router;
