-- ------------------------------------------------
-- File: schema_v2_faculty_tasks.sql
-- Purpose: Faculty-Student Task Management System migration.
-- Adds: faculty_student_assignments, tasks, task_assignments tables.
-- Run this AFTER the original schema.sql
-- ------------------------------------------------

-- 1. Faculty-Student Assignment Map
-- Links a faculty member to students in their batch.
CREATE TABLE IF NOT EXISTS faculty_student_assignments (
    assignment_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id      UUID NOT NULL REFERENCES faculties(faculty_id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_faculty_student UNIQUE (faculty_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_fsa_faculty ON faculty_student_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fsa_student ON faculty_student_assignments(student_id);


-- 2. Tasks Table
-- Stores tasks created by faculty members.
CREATE TABLE IF NOT EXISTS tasks (
    task_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by      UUID NOT NULL REFERENCES faculties(faculty_id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    task_type       VARCHAR(50) NOT NULL CHECK (task_type IN (
                        'MOCK_INTERVIEW',
                        'GD_PRACTICE',
                        'APTITUDE_TEST',
                        'RESUME_REVIEW',
                        'CODING_CHALLENGE',
                        'READING',
                        'CUSTOM'
                    )),
    due_date        TIMESTAMP WITH TIME ZONE,
    max_score       INT DEFAULT 100,
    instructions    TEXT,
    resources_url   VARCHAR(512),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);


-- 3. Task Assignments Table
-- Tracks which task is assigned to which student, their submission, and evaluation.
CREATE TABLE IF NOT EXISTS task_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    status          VARCHAR(30) DEFAULT 'ASSIGNED' CHECK (status IN (
                        'ASSIGNED',
                        'IN_PROGRESS',
                        'SUBMITTED',
                        'EVALUATED',
                        'OVERDUE'
                    )),
    submitted_at    TIMESTAMP WITH TIME ZONE,
    submission_url  VARCHAR(512),
    submission_text TEXT,
    score           INT CHECK (score BETWEEN 0 AND 100),
    feedback        TEXT,
    evaluated_by    UUID REFERENCES faculties(faculty_id) ON DELETE SET NULL,
    evaluated_at    TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_task_student UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ta_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_ta_student_id ON task_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_ta_status ON task_assignments(status);
