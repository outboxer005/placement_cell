-- Reset password for student 231FA04G32
-- DOB: 2005-07-06, which means password should be: 06072005

-- First, check if student exists and get their ID
SELECT id, regd_id, dob FROM students WHERE regd_id = '231FA04G32';

-- Delete existing password entry (if any)
DELETE FROM student_auth WHERE student_id = (SELECT id FROM students WHERE regd_id = '231FA04G32');

-- Note: After running this, the student login endpoint will automatically
-- create the password hash from their DOB when they try to login.
-- The password will be: 06072005 (DDMMYYYY format)

-- Verify student_auth is empty for this student
SELECT * FROM student_auth WHERE student_id = (SELECT id FROM students WHERE regd_id = '231FA04G32');
