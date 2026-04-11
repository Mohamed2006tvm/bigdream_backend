const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  updateBooking,
  blockSlot,
  manualBooking,
  updateScreenSlots,
  getScreens,
} = require('../controllers/adminController');
const contactModel = require('../models/contactModel');
const { successResponse } = require('../utils/responseHelper');
const Setting = require('../models/settingModel');
const { authenticate } = require('../middleware/auth');

// All admin routes are protected by JWT
router.use(authenticate);

router.get('/bookings', getAllBookings);
router.patch('/bookings/:id', updateBooking);
router.post('/block-slot', blockSlot);
router.post('/manual-booking', manualBooking);
router.patch('/screens/:id/slots', updateScreenSlots);
router.get('/screens', getScreens);

/**
 * Message Management
 */
router.get('/messages', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await contactModel.getAllMessages({
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100),
    });
    return successResponse(res, data);
  } catch (err) { next(err); }
});

router.patch('/messages/:id/read', async (req, res, next) => {
  try {
    const { is_read } = req.body;
    const data = await contactModel.updateInquiryStatus(req.params.id, is_read !== false);
    return successResponse(res, data);
  } catch (err) { next(err); }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    await contactModel.deleteMessage(req.params.id);
    return successResponse(res, null, 200, 'Message deleted');
  } catch (err) { next(err); }
});

/**
 * Settings Management
 */
router.get('/settings/:key', async (req, res, next) => {
  try {
    const value = await Setting.get(req.params.key);
    return successResponse(res, value);
  } catch (err) { next(err); }
});

router.patch('/settings/:key', async (req, res, next) => {
  try {
    const value = await Setting.update(req.params.key, req.body.value);
    return successResponse(res, value, 200, 'Setting updated');
  } catch (err) { next(err); }
});

module.exports = router;
