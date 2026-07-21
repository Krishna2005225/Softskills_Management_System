/*
------------------------------------------------
File: run_study_migration.js
Purpose: Temporary migration script to create study_sessions table.
------------------------------------------------
*/

const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
  console.log('Running study tracking migration...');
  try {
    const sqlPath = path.join(__dirname, '../database/schema_v3_study_tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('Study tracking migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
