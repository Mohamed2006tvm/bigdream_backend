const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  updateBooking,
  blockSlot,
  manualBooking,
  updateScreenSlots,
} = require('../controllers/adminController');
const contactModel = require('../models/contactModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const Setting = require('../models/settingModel');
const { authenticate } = require('../middleware/auth');
const { updateBookingRules, blockSlotRules, createBookingRules } = require('../middleware/validationRules');
const { validate } = require('../middleware/validate');

// All admin routes are protected by JWT
router.use(authenticate);

/**
 * GET /api/admin/bookings?page=1&limit=20
 * Return all bookings (paginated).
 */
router.get('/bookings', getAllBookings);

/**
 * PATCH /api/admin/bookings/:id
 * Update booking status or time_slot.
 */
router.patch('/bookings/:id', updateBookingRules, validate, updateBooking);

/**
 * POST /api/admin/block-slot
 * Block a slot as cleaning or maintenance.
 */
router.post('/block-slot', blockSlotRules, validate, blockSlot);

/**
 * POST /api/admin/manual-booking
 * Admin creates a booking manually.
 */
router.post('/manual-booking', createBookingRules, validate, manualBooking);

/**
 * PATCH /api/admin/screens/:id/slots
 */
router.patch('/screens/:id/slots', updateScreenSlots);

/**
 * GET /api/admin/screens
 */
router.get('/screens', async (req, res, next) => {
  try {
    const { getScreens } = require('../controllers/adminController');
    return getScreens(req, res, next);
  } catch (err) { next(err); }
});

/**
 * Message Management
 */
router.get('/messages', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await contactModel.getAllMessages({ page: parseInt(page), limit: parseInt(limit) });
    return successResponse(res, data);
  } catch (err) { next(err); }
});

router.patch('/messages/:id/read', async (req, res, next) => {
  try {
    const data = await contactModel.markAsRead(req.params.id);
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
