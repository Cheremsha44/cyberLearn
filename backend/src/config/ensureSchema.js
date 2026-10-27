const db = require('./db');

async function addColumnIfMissing(tableName, columnName, definition) {
  try {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  } catch (err) {
    if (err?.code === 'ER_DUP_FIELDNAME') {
      return;
    }
    throw err;
  }
}

async function createTableIfMissing(createTableSql) {
  await db.query(createTableSql);
}

async function ensureFreezeSchema() {
  await addColumnIfMissing('vulnerabilities', 'is_frozen', 'TINYINT(1) NOT NULL DEFAULT 0');

  await addColumnIfMissing('exercises', 'is_frozen', 'TINYINT(1) NOT NULL DEFAULT 0');
}

async function ensureAuthSchema() {
  await addColumnIfMissing('users', 'is_blocked', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfMissing('users', 'failed_login_attempts', 'INT NOT NULL DEFAULT 0');
  await addColumnIfMissing('users', 'login_locked_until', 'DATETIME NULL');

  await createTableIfMissing(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_password_reset_token_hash (token_hash),
      KEY idx_password_reset_user (user_id),
      KEY idx_password_reset_expires_at (expires_at),
      CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

module.exports = {
  ensureFreezeSchema,
  ensureAuthSchema
};
