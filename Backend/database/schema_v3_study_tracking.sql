-- ------------------------------------------------
-- File: schema_v3_study_tracking.sql
-- Purpose: Adds study session tracking for students.
-- ------------------------------------------------

CREATE TABLE IF NOT EXISTS study_sessions (
    session_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    start_time    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time      TIMESTAMP WITH TIME ZONE,
    duration      INT DEFAULT 0, -- in minutes
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_student_id ON study_sessions(student_id);
