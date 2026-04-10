const db = require('../config/db');

/**
 * Check if a slot is already taken for a given screen, date, and time_slot.
 * Returns the conflicting booking row or null.
 */
const findConflict = async (screen_id, date, time_slot) => {
  const { rows } = await db.query(
    `SELECT id, status FROM bookings
     WHERE screen_id = $1 AND date = $2 AND time_slot = $3 AND status != 'cancelled'
     LIMIT 1`,
    [screen_id, date, time_slot]
  );
  return rows[0] || null;
};

/**
 * Create a new booking.
 */
const createBooking = async ({ screen_id, date, time_slot, customer_name, phone, email, status = 'booked' }) => {
  const { rows } = await db.query(
    `INSERT INTO bookings (screen_id, date, time_slot, customer_name, phone, email, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [screen_id, date, time_slot, customer_name, phone, email, status]
  );
  return rows[0];
};

/**
 * Get all bookings with screen name (paginated + search).
 */
const getAllBookings = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const offset = (page - 1) * limit;
  const values = [limit, offset];
  let searchClause = '';

  if (search) {
    values.push(`%${search}%`);
    searchClause = `WHERE (b.email ILIKE $3 OR b.phone ILIKE $3 OR b.customer_name ILIKE $3)`;
  }

  const query = `
    SELECT b.*, s.name AS screen_name
    FROM bookings b
    JOIN screens s ON s.id = b.screen_id
    ${searchClause}
    ORDER BY b.date DESC, b.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const { rows } = await db.query(query, values);

  const countQuery = `
    SELECT COUNT(*) 
    FROM bookings b
    ${searchClause.replace('b.', '')}
  `;
  const countResult = await db.query(countQuery, search ? [values[2]] : []);
  const total = parseInt(countResult.rows[0].count, 10);

  return { bookings: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get a single booking by ID.
 */
const getBookingById = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, s.name AS screen_name
     FROM bookings b
     JOIN screens s ON s.id = b.screen_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Update booking fields (status and/or time_slot).
 * Only provided keys are updated.
 */
const updateBooking = async (id, fields) => {
  const allowed = ['status', 'time_slot', 'screen_id'];
  const updates = [];
  const values = [];

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      updates.push(`${key} = $${values.length}`);
    }
  });

  if (updates.length === 0) return null;

  values.push(id);
  const { rows } = await db.query(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] || null;
};

/**
 * Get all bookings for a specific date (for availability check).
 */
const getBookingsByDate = async (date) => {
  const { rows } = await db.query(
    `SELECT b.*, s.name AS screen_name
     FROM bookings b
     JOIN screens s ON s.id = b.screen_id
     WHERE b.date = $1 AND b.status != 'cancelled'`,
    [date]
  );
  return rows;
};

module.exports = {
  findConflict,
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  getBookingsByDate,
};
