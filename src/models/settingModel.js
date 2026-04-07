const db = require('../config/db');

const Setting = {
  get: async (key) => {
    const { rows } = await db.query('SELECT value FROM global_settings WHERE key = $1', [key]);
    return rows[0] ? rows[0].value : null;
  },

  update: async (key, value) => {
    const { rows } = await db.query(
      `INSERT INTO global_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
       RETURNING value`,
      [key, JSON.stringify(value)]
    );
    return rows[0].value;
  }
};

module.exports = Setting;
