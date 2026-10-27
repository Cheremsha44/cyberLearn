const db = require('../config/db');

async function findByCodeAndOrder(code, order) {
  const [rows] = await db.query(
    `
    SELECT
      e.*,
      v.is_frozen AS course_is_frozen
    FROM exercises e
    JOIN vulnerabilities v ON e.vulnerability_id = v.id
    WHERE v.code = ? AND e.order_index = ?
    LIMIT 1
    `,
    [code, order]
  );

  return rows[0];
}

async function findAllByCode(code) {
  const [rows] = await db.query(
    `
    SELECT
      e.*,
      v.is_frozen AS course_is_frozen
    FROM exercises e
    JOIN vulnerabilities v ON e.vulnerability_id = v.id
    WHERE v.code = ?
    ORDER BY e.order_index
    `,
    [code]
  );

  return rows;
}

async function findAllWithStatus(userId) {
  const [rows] = await db.query(
    `
    SELECT
      e.id,
      e.title,
      e.difficulty,
      e.order_index,
      e.is_frozen,
      v.title AS vulnerability_title,
      v.code AS vulnerability_code,
      v.is_frozen AS course_is_frozen,
      CASE WHEN ue.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_completed
    FROM exercises e
    JOIN vulnerabilities v ON e.vulnerability_id = v.id
    LEFT JOIN user_exercises ue
      ON ue.exercise_id = e.id
      AND ue.user_id = ?
    ORDER BY v.id ASC, e.order_index ASC
    `,
    [userId]
  );

  return rows;
}

async function findForAccessById(exerciseId) {
  const [rows] = await db.query(
    `
    SELECT
      e.id,
      e.is_frozen,
      v.is_frozen AS course_is_frozen
    FROM exercises e
    JOIN vulnerabilities v ON v.id = e.vulnerability_id
    WHERE e.id = ?
    LIMIT 1
    `,
    [exerciseId]
  );

  return rows[0];
}

async function countPublished() {
  const [[row]] = await db.query(
    `
    SELECT COUNT(*) AS cnt
    FROM exercises
    WHERE is_published = 1
    `
  );

  return Number(row?.cnt || 0);
}

module.exports = {
  findByCodeAndOrder,
  findAllByCode,
  findAllWithStatus,
  findForAccessById,
  countPublished
};
