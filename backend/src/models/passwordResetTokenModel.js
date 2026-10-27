const db = require('../config/db');

const PasswordResetTokenModel = {
  async invalidateActiveTokensForUser(userId) {
    await db.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ?
        AND used_at IS NULL
      `,
      [userId]
    );
  },

  async create({ userId, tokenHash, expiresAt }) {
    const [result] = await db.query(
      `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?)
      `,
      [userId, tokenHash, expiresAt]
    );

    return result.insertId;
  },

  async findByTokenHash(tokenHash) {
    const [rows] = await db.query(
      `
      SELECT
        prt.id,
        prt.user_id,
        prt.token_hash,
        prt.expires_at,
        prt.used_at,
        prt.created_at,
        u.email,
        u.username
      FROM password_reset_tokens prt
      INNER JOIN users u
        ON u.id = prt.user_id
      WHERE prt.token_hash = ?
      LIMIT 1
      `,
      [tokenHash]
    );

    return rows[0];
  },

  async markUsed(id) {
    await db.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ?
      `,
      [id]
    );
  },

  async deleteById(id) {
    await db.query(
      `
      DELETE FROM password_reset_tokens
      WHERE id = ?
      `,
      [id]
    );
  }
};

module.exports = PasswordResetTokenModel;
