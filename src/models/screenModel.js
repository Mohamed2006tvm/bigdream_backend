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

/** Update slots for a screen */
const updateScreenSlots = async (id, slots) => {
  const { rows } = await db.query(
    'UPDATE screens SET time_slots = $2 WHERE id = $1 RETURNING *',
    [id, JSON.stringify(slots)]
  );
  return rows[0];
};

module.exports = { getAllScreens, getScreenByName, updateScreenSlots };
