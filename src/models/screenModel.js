const db = require('../config/db');

/** Return all screens */
const getAllScreens = async () => {
  const { rows } = await db.query('SELECT * FROM screens ORDER BY name ASC');
  return rows;
};

/** Find a single screen by name (A / B / C) */
const getScreenByName = async (name) => {
  const { rows } = await db.query('SELECT * FROM screens WHERE name = $1', [name]);
  return rows[0] || null;
};

/** Update slots and active status for a screen */
const updateScreenSlots = async (id, slots, isActive) => {
  const { rows } = await db.query(
    'UPDATE screens SET time_slots = $2, is_active = $3 WHERE id = $1 RETURNING *',
    [id, JSON.stringify(slots), isActive]
  );
  return rows[0];
};

module.exports = { getAllScreens, getScreenByName, updateScreenSlots };
