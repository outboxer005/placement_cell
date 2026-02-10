-- ==========================================
-- FIX STUDENT LOGIN FOR 231FA04G32
-- ==========================================
-- This student exists but password hash doesn't match DOB
-- Run this in Supabase SQL Editor to reset password

-- Step 1: Check student exists and get details
SELECT id, regd_id, first_name, last_name, dob, branch 
FROM students 
WHERE regd_id = '231FA04G32';

-- Step 2: Delete existing password (will be auto-recreated on next login)
DELETE FROM student_auth 
WHERE student_id = (
  SELECT id FROM students WHERE regd_id = '231FA04G32'
);

-- Step 3: Verify password entry is deleted
SELECT sa.* 
FROM student_auth sa
WHERE sa.student_id = (
  SELECT id FROM students WHERE regd_id = '231FA04G32'
);

-- Expected result: No rows (password deleted)
-- After running this, try logging in with:
--   Registration ID: 231FA04G32
--   Password: 06072005 (DOB in DDMMYYYY format)
-- The system will auto-create the correct password hash on login
