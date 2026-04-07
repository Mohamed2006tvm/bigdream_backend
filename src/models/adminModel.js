const db = require('../config/db');

/** Find an admin user by username */
const findAdminByUsername = async (username) => {
  const { rows } = await db.query(
    'SELECT * FROM admin_users WHERE username = $1',
    [username]
  );
  return rows[0] || null;
};

/** Find admin by ID */
const findAdminById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, username FROM admin_users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAdminByUsername, findAdminById };
