-- Ensure employee audit columns exist.
-- This migration repairs environments where the migration history
-- contains 0002 but the employees table is missing these columns.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
