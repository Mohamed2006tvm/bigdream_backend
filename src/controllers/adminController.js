const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');
const bookingModel = require('../models/bookingModel');
const screenModel = require('../models/screenModel');
const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Admin login — returns a signed JWT.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await adminModel.findAdminByUsername(username);
    if (!admin) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    logger.info('Admin login successful', { username: admin.username });

    return successResponse(res, { token, admin: { id: admin.id, username: admin.username } }, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings?page=1&limit=20
 * Return all bookings (paginated).
 */
const getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const search = req.query.search || '';

    const result = await bookingModel.getAllBookings({ page, limit, search });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/bookings/:id
 * Update booking status and/or time_slot.
 */
const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, time_slot } = req.body;

    const existing = await bookingModel.getBookingById(id);
    if (!existing) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // If updating time_slot, check for conflicts on the new slot
    if (time_slot && time_slot !== existing.time_slot) {
      const conflict = await bookingModel.findConflict(existing.screen_id, existing.date, time_slot);
      if (conflict && conflict.id !== id) {
        return errorResponse(res, 'The new time slot is already booked for this screen and date.', 409);
      }
    }

    const updated = await bookingModel.updateBooking(id, { status, time_slot });
    return successResponse(res, updated, 200, 'Booking updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/block-slot
 * Admin blocks a slot with status: cleaning | maintenance.
 */
const blockSlot = async (req, res, next) => {
  try {
    const { screen_name, date, time_slot, status } = req.body;

    const screen = await screenModel.getScreenByName(screen_name);
    if (!screen) {
      return errorResponse(res, `Screen '${screen_name}' not found`, 404);
    }

    // Check if slot already exists
    const conflict = await bookingModel.findConflict(screen.id, date, time_slot);
    if (conflict) {
      // If already blocked as a non-booking, allow updating the status
      if (conflict.status !== 'booked') {
        const updated = await bookingModel.updateBooking(conflict.id, { status });
        return successResponse(res, updated, 200, 'Slot status updated');
      }
      return errorResponse(res, 'Slot is already booked by a customer.', 409);
    }

    // Create a placeholder booking for cleaning/maintenance
    const blocked = await bookingModel.createBooking({
      screen_id: screen.id,
      date,
      time_slot,
      customer_name: `[${status.toUpperCase()}]`,
      phone: '0000000000',
      email: 'admin@system.local',
      status,
    });

    return successResponse(res, { ...blocked, screen_name: screen.name }, 201, `Slot blocked as ${status}`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/manual-booking
 * Admin manually creates a booking (same logic as user, bypasses rate limiter).
 * Also sends notifications.
 */
const manualBooking = async (req, res, next) => {
  try {
    const { screen_name, date, time_slot, customer_name, phone, email } = req.body;

    const screen = await screenModel.getScreenByName(screen_name);
    if (!screen) {
      return errorResponse(res, `Screen '${screen_name}' not found`, 404);
    }

    const conflict = await bookingModel.findConflict(screen.id, date, time_slot);
    if (conflict) {
      return errorResponse(res, 'This time slot is already booked or blocked.', 409);
    }

    const booking = await bookingModel.createBooking({
      screen_id: screen.id,
      date,
      time_slot,
      customer_name,
      phone,
      email,
      status: 'booked',
    });

    const bookingWithScreen = { ...booking, screen_name: screen.name };

    notificationService
      .sendBookingConfirmation(bookingWithScreen)
      .catch((err) => logger.warn('Manual booking notification error', { error: err.message }));

    return successResponse(res, bookingWithScreen, 201, 'Manual booking created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/screens/:id/slots
 * Update shift timings for a specific screen.
 */
const updateScreenSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slots, is_active } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return errorResponse(res, 'Time slots must be a non-empty array', 400);
    }

    const updated = await screenModel.updateScreenSlots(id, slots, is_active !== undefined ? is_active : true);
    if (!updated) {
      return errorResponse(res, 'Screen not found', 404);
    }

    return successResponse(res, updated, 200, 'Screen timings updated successfully');
  } catch (err) {
    next(err);
  }
};
/**
 * GET /api/admin/screens
 * Return all screens for admin management.
 */
const getScreens = async (req, res, next) => {
  try {
    const screens = await screenModel.getAllScreens();
    return successResponse(res, screens);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getAllBookings, updateBooking, blockSlot, manualBooking, updateScreenSlots, getScreens };
