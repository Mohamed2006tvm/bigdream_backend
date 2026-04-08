const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
});

const runSqlFile = async (filePath) => {
  console.log(`[SQL] Executing ${path.basename(filePath)}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`[SQL] Successfully executed ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`[SQL] Error executing ${path.basename(filePath)}:`, err.message);
    throw err;
  }
};

const bcrypt = require('bcryptjs');

const setupAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  console.log(`[DB] Syncing admin user: ${username}...`);
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO admin_users (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
      [username, hashedPassword]
    );
    console.log(`[DB] Admin user '${username}' is up to date.`);
  } catch (err) {
    console.error('[DB] Failed to sync admin user:', err.message);
    throw err;
  }
};

const setup = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    await runSqlFile(schemaPath);
    await runSqlFile(seedPath);
    await setupAdmin();

    console.log('[DB] Database initialization complete! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('[DB] Setup failed:', err.message);
    process.exit(1);
  }
};

setup();
