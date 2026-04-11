const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');
const bookingModel = require('../models/bookingModel');
const screenModel = require('../models/screenModel');
const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const env = require('../config/env');
const logger = require('../utils/logger');

/** Cookie options for JWT — HttpOnly prevents JS access (XSS mitigation) */
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd, // HTTPS only in production
  sameSite: env.isProd ? 'none' : 'lax', // 'none' needed for cross-origin cookie (Vercel → Render)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

/**
 * POST /api/auth/login
 * Admin login — sets JWT as HttpOnly cookie AND returns it in body.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    const admin = await adminModel.findAdminByUsername(username);
    if (!admin) {
      logger.warn('Failed login attempt — user not found', { username, ip });
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      logger.warn('Failed login attempt — wrong password', { username, ip });
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    // Set secure HttpOnly cookie
    res.cookie('auth_token', token, cookieOptions);

    logger.info('Admin login successful', { username: admin.username, ip });

    return successResponse(
      res,
      { token, admin: { id: admin.id, username: admin.username } },
      200,
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
const logout = (req, res) => {
  res.clearCookie('auth_token', { ...cookieOptions, maxAge: 0 });
  return successResponse(res, null, 200, 'Logged out successfully');
};

/**
 * PATCH /api/admin/password
 * Authenticated admin changes their own password (current password required).
 */
const changePassword = async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const { currentPassword, newPassword } = req.body;

    const hash = await adminModel.getPasswordHashById(adminId);
    if (!hash) {
      return errorResponse(res, 'Admin account not found', 404);
    }

    const currentOk = await bcrypt.compare(currentPassword, hash);
    if (!currentOk) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    const sameAsOld = await bcrypt.compare(newPassword, hash);
    if (sameAsOld) {
      return errorResponse(res, 'New password must be different from your current password', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await adminModel.updatePasswordById(adminId, newHash);
    if (!updated) {
      return errorResponse(res, 'Could not update password', 500);
    }

    logger.info('Admin password changed', { adminId, username: req.admin.username });
    return successResponse(res, null, 200, 'Password updated successfully');
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
    const { status, time_slot, screen_id } = req.body;

    const existing = await bookingModel.getBookingById(id);
    if (!existing) {
      return errorResponse(res, 'Booking not found', 404);
    }

    const targetScreenId = screen_id || existing.screen_id;
    const targetTimeSlot = time_slot || existing.time_slot;

    // If updating time_slot or screen_id, check for conflicts on the new hall/slot
    if ((time_slot && time_slot !== existing.time_slot) || (screen_id && screen_id !== existing.screen_id)) {
      const conflict = await bookingModel.findConflict(targetScreenId, existing.date, targetTimeSlot);
      if (conflict && conflict.id !== id) {
        return errorResponse(res, 'The new time slot or hall is already booked for this date.', 409);
      }
    }

    const updated = await bookingModel.updateBooking(id, { status, time_slot, screen_id });
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
 * Admin manually creates a booking. Also sends notifications.
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

    const updated = await screenModel.updateScreenSlots(id, slots, is_active !== false);
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

module.exports = {
  login,
  logout,
  changePassword,
  getAllBookings,
  updateBooking,
  blockSlot,
  manualBooking,
  updateScreenSlots,
  getScreens,
};
