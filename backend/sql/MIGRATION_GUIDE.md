# Database Migration Guide

## Overview
This migration adds two missing columns to the `students` table that are required by the application but were missing from the database schema.

## Columns Being Added
1. `break_in_studies` (BOOLEAN, nullable) - Tracks if a student has taken breaks in their studies
2. `has_backlogs` (BOOLEAN, nullable) - Tracks if a student has pending backlogs

## How to Apply the Migration

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Login to your account
3. Select your project

### Step 2: Access SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New query" button

### Step 3: Run the Migration
1. Open the file [`add_student_columns.sql`](./add_student_columns.sql)
2. Copy all the SQL content
3. Paste it into the SQL Editor in Supabase
4. Click "Run" button

### Step 4: Verify the Migration
The script includes a verification query at the end. After running, you should see output showing:
```
column_name        | data_type | is_nullable
--------------------|-----------|------------
break_in_studies   | boolean   | YES
has_backlogs       | boolean   | YES
```

## What This Fixes
- **Error**: "Could not find the 'breakInStudies' column of 'students' in the schema cache"
- **Impact**: Student registration and profile updates were failing
- **Solution**: Adds the missing columns with proper snake_case naming

## Backend Changes
The backend code has been updated to properly map camelCase API fields to snake_case database columns:
- API field `breakInStudies` → DB column `break_in_studies`
- API field `hasBacklogs` → DB column `has_backlogs`

## Rollback (if needed)
If you need to rollback this migration, run:
```sql
ALTER TABLE public.students DROP COLUMN IF EXISTS break_in_studies;
ALTER TABLE public.students DROP COLUMN IF EXISTS has_backlogs;
```

## Notes
- Columns are nullable by default, so existing student records won't be affected
- The migration uses `IF NOT EXISTS` to safely run multiple times
- Both columns default to NULL for existing students
