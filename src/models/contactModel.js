const db = require('../config/db');

/**
 * Save a new contact message to the database.
 */
const createMessage = async ({ name, email, message }) => {
  const { rows } = await db.query(
    `INSERT INTO contact_messages (name, email, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, email, message]
  );
  return rows[0];
};

/**
 * Get all contact messages (paginated).
 */
const getAllMessages = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT * FROM contact_messages 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  
  const countResult = await db.query('SELECT COUNT(*) FROM contact_messages');
  const total = parseInt(countResult.rows[0].count, 10);
  
  return { messages: rows, total, page, limit };
};

/**
 * Mark a message as read.
 */
const markAsRead = async (id) => {
  const { rows } = await db.query(
    'UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
};

/**
 * Delete a message.
 */
const deleteMessage = async (id) => {
  await db.query('DELETE FROM contact_messages WHERE id = $1', [id]);
};

module.exports = {
  createMessage,
  getAllMessages,
  markAsRead,
  deleteMessage
};
