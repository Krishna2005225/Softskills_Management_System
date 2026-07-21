/*
------------------------------------------------
File: check_student.js
Purpose: Inspects users and students tables to find user IDs and profiles.
------------------------------------------------
*/

const db = require('../config/db');

async function run() {
  try {
    console.log('Querying users with role STUDENT...');
    const usersRes = await db.query("SELECT user_id, name, email FROM users WHERE role = 'STUDENT'");
    console.log('Users found:', usersRes.rows);

    for (let u of usersRes.rows) {
      const studentRes = await db.query("SELECT * FROM students WHERE student_id = $1", [u.user_id]);
      console.log(`Student row for ${u.name} (${u.user_id}):`, studentRes.rows[0] || 'NONE');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
