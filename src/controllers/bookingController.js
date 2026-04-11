const { format, addDays } = require('date-fns');
const bookingModel = require('../models/bookingModel');
const screenModel = require('../models/screenModel');
const Setting = require('../models/settingModel');
const notificationService = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * POST /api/bookings
 * Create a new booking (user-facing).
 */
const createBooking = async (req, res, next) => {
  try {
    const { screen_name, date, time_slot, customer_name, phone, email } = req.body;

    // Resolve screen
    const screen = await screenModel.getScreenByName(screen_name);
    if (!screen) {
      return errorResponse(res, `Screen '${screen_name}' not found`, 404);
    }

    if (screen.is_active === false) {
      return errorResponse(res, `Screen '${screen_name}' is currently unavailable for bookings`, 403);
    }

    // Check for conflicts
    const conflict = await bookingModel.findConflict(screen.id, date, time_slot);
    if (conflict) {
      return errorResponse(
        res,
        'This time slot is already booked or unavailable for the selected screen and date.',
        409
      );
    }

    // Create booking
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

    // Fire notifications (non-blocking — errors logged but don't fail the request)
    notificationService
      .sendBookingConfirmation(bookingWithScreen)
      .catch((err) => logger.warn('Notification error (non-fatal)', { error: err.message }));

    return successResponse(res, bookingWithScreen, 201, 'Booking created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Returns a map of all screens and their slot statuses for the given date.
 */
const getAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(res, 'Query param "date" is required in YYYY-MM-DD format', 400);
    }

    const [screens, bookings] = await Promise.all([
      screenModel.getAllScreens(),
      bookingModel.getBookingsByDate(date),
    ]);

    // Build availability map keyed by screen name, filtering out inactive screens
    const availability = screens
      .filter(s => s.is_active !== false)
      .map((screen) => {
      const screenBookings = bookings
        .filter((b) => b.screen_id === screen.id)
        .map(({ id, time_slot, status, customer_name }) => ({
          id,
          time_slot,
          status,
          customer_name: status === 'booked' ? customer_name : null,
        }));

      return {
        screen_id: screen.id,
        screen_name: screen.name,
        date,
        time_slots: screen.time_slots,
        slots: screenBookings,
      };
    });

    return successResponse(res, { date, availability });
  } catch (err) {
    next(err);
  }
};

function normalizeAvailabilityConfig(raw) {
  const fallback = { mode: 'dynamic', days: 7, dates: [] };
  if (raw == null) return fallback;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return fallback;

  const mode = obj.mode === 'manual' ? 'manual' : 'dynamic';
  let days = Number(obj.days);
  if (!Number.isFinite(days) || days < 1) days = 7;
  if (days > 366) days = 366;
  const dates = Array.isArray(obj.dates) ? obj.dates.map(String) : [];

  return { mode, days, dates };
}

/**
 * GET /api/availability/dates
 * Returns the list of dates open for booking based on global settings.
 */
const getAuthorizedDates = async (req, res, next) => {
  try {
    let rawConfig = null;
    try {
      rawConfig = await Setting.get('availability_config');
    } catch (dbErr) {
      logger.warn('availability_config read failed; using defaults', { error: dbErr.message });
    }

    const config = normalizeAvailabilityConfig(rawConfig);

    let dates = [];
    if (config.mode === 'manual') {
      dates = config.dates;
    } else {
      for (let i = 0; i < config.days; i++) {
        dates.push(format(addDays(new Date(), i), 'yyyy-MM-dd'));
      }
    }

    return successResponse(res, dates);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getAvailability, getAuthorizedDates };
