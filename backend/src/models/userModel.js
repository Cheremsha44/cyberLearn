const db = require('../config/db');

const UserModel = {
  /* ======================
     BASIC USER METHODS
     ====================== */

  async create(user) {
    const {
      username,
      email,
      password,
      role = 'user',
      bio = 'Изучаю кибербезопасность и этичный хакинг',
      level = 'Beginner',
      study_hours = 0,
      avatar = 'default-avatar.png'
    } = user;

    const [result] = await db.query(
      `
      INSERT INTO users (
        username,
        email,
        password,
        role,
        bio,
        level,
        study_hours,
        avatar
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [username, email, password, role, bio, level, study_hours, avatar]
    );

    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await db.query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows[0];
  },

  async findAll() {
    const [rows] = await db.query(
      `
      SELECT
        id,
        username,
        email,
        role,
        bio,
        level,
        study_hours,
        avatar,
        created_at,
        is_blocked
      FROM users
      ORDER BY created_at DESC
      `
    );
    return rows;
  },

  async updateBio(userId, bio) {
    const [result] = await db.query(`UPDATE users SET bio = ? WHERE id = ?`, [bio, userId]);
    return result.affectedRows > 0;
  },

  async updatePassword(userId, passwordHash) {
    const [result] = await db.query(`UPDATE users SET password = ? WHERE id = ?`, [
      passwordHash,
      userId
    ]);
    return result.affectedRows > 0;
  },

  async updateRole(id, role) {
    const [result] = await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
    return result.affectedRows > 0;
  },

  async setBlocked(id, isBlocked) {
    const [result] = await db.query(`UPDATE users SET is_blocked = ? WHERE id = ?`, [
      isBlocked ? 1 : 0,
      id
    ]);
    return result.affectedRows > 0;
  },

  async registerFailedLoginAttempt(userId, maxAttempts, lockMinutes) {
    const user = await this.findById(userId);

    if (!user) {
      return {
        locked: false,
        attemptsLeft: 0
      };
    }

    const currentAttempts = Number(user.failed_login_attempts || 0);
    const nextAttempts = currentAttempts + 1;

    if (nextAttempts >= maxAttempts) {
      await db.query(
        `
        UPDATE users
        SET failed_login_attempts = ?,
            login_locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
        WHERE id = ?
        `,
        [maxAttempts, lockMinutes, userId]
      );

      const [[lockedUser]] = await db.query(
        `
        SELECT
          login_locked_until,
          GREATEST(TIMESTAMPDIFF(SECOND, NOW(), login_locked_until), 0) AS retry_after_seconds
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
      );

      return {
        locked: true,
        attemptsLeft: 0,
        lockedUntil: lockedUser?.login_locked_until || null,
        retryAfterSeconds: Number(lockedUser?.retry_after_seconds || 0)
      };
    }

    await db.query(
      `
      UPDATE users
      SET failed_login_attempts = ?,
          login_locked_until = NULL
      WHERE id = ?
      `,
      [nextAttempts, userId]
    );

    return {
      locked: false,
      attemptsLeft: Math.max(0, maxAttempts - nextAttempts),
      lockedUntil: null,
      retryAfterSeconds: 0
    };
  },

  async resetLoginProtection(userId) {
    await db.query(
      `
      UPDATE users
      SET failed_login_attempts = 0,
          login_locked_until = NULL
      WHERE id = ?
      `,
      [userId]
    );
  },

  async getLoginLockStatus(userId) {
    const [[row]] = await db.query(
      `
      SELECT
        login_locked_until,
        GREATEST(TIMESTAMPDIFF(SECOND, NOW(), login_locked_until), 0) AS retry_after_seconds,
        CASE
          WHEN login_locked_until IS NOT NULL AND login_locked_until > NOW() THEN 1
          ELSE 0
        END AS is_locked
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    return {
      isLocked: Number(row?.is_locked || 0) === 1,
      lockedUntil: row?.login_locked_until || null,
      retryAfterSeconds: Number(row?.retry_after_seconds || 0)
    };
  },

  /* ======================
     STUDY TIME
     ====================== */

  async incrementStudyTime(userId, minutes) {
    await db.query(
      `
      UPDATE users
      SET study_hours = study_hours + ?
      WHERE id = ?
      `,
      [minutes, userId]
    );
  },

  async getUserRating(userId) {
    const [rows] = await db.query(
      `
      SELECT
        target.id AS user_id,
        ranked.completed_count,
        ranked.rank_position,
        totals.total_participants
      FROM users target
      CROSS JOIN (
        SELECT COUNT(*) AS total_participants
        FROM users
        WHERE role = 'user'
      ) totals
      LEFT JOIN (
        SELECT
          uc.user_id,
          uc.completed_count,
          (
            SELECT COUNT(*) + 1
            FROM (
              SELECT
                u2.id AS user_id,
                COUNT(ue2.exercise_id) AS completed_count
              FROM users u2
              LEFT JOIN user_exercises ue2
                ON ue2.user_id = u2.id
              WHERE u2.role = 'user'
              GROUP BY u2.id
            ) leaderboard
            WHERE leaderboard.completed_count > uc.completed_count
               OR (
                 leaderboard.completed_count = uc.completed_count
                 AND leaderboard.user_id < uc.user_id
               )
          ) AS rank_position
        FROM (
          SELECT
            u.id AS user_id,
            COUNT(ue.exercise_id) AS completed_count
          FROM users u
          LEFT JOIN user_exercises ue
            ON ue.user_id = u.id
          WHERE u.role = 'user'
          GROUP BY u.id
        ) uc
      ) ranked
        ON ranked.user_id = target.id
      WHERE target.id = ?
      LIMIT 1
      `,
      [userId]
    );

    return rows[0];
  }
};

module.exports = UserModel;
