/*
------------------------------------------------
File: User.js
Purpose: Manages users table database queries.
Responsibilities: Registrations, updates, logins check, and password resets verification.
Dependencies: db.js
------------------------------------------------
*/

const db = require('../config/db');

module.exports = {
  /*
  Fetches user information by ID.
  Params: userId (UUID).
  Returns: User object matching ID.
  */
  findById: async (userId) => {
    const res = await db.query(
      'SELECT user_id, name, email, phone, role, department, created_at FROM users WHERE user_id = $1',
      [userId]
    );
    return res.rows[0];
  },

  /*
  Fetches user by email address (for authentication checks).
  Params: email (string).
  Returns: User object including password_hash.
  */
  findByEmail: async (email) => {
    const res = await db.query(
      'SELECT user_id, name, email, phone, password_hash, role, department FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0];
  },

  /*
  Creates a new user profile record in the database.
  Params: name, email, passwordHash, role, department.
  Returns: The newly created user record database row.
  */
  createUser: async (name, email, passwordHash, role, department) => {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, email, phone, role, department`,
      [name, email, passwordHash, role, department]
    );
    return res.rows[0];
  },

  /*
  Updates user name, department and phone in the database.
  Params: userId (UUID), name, department, phone.
  Returns: Updated user row.
  */
  updateProfile: async (userId, name, department, phone) => {
    const res = await db.query(
      `UPDATE users 
       SET name = $1, department = $2, phone = COALESCE($3, phone) 
       WHERE user_id = $4 
       RETURNING user_id, name, email, phone, role, department`,
      [name, department, phone, userId]
    );
    return res.rows[0];
  }
};
