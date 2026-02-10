# Quick Start Guide

## For the User: Complete These Steps

### 1. Run Database Migrations (REQUIRED)

Open Supabase Dashboard → SQL Editor

**Run this first:**
```sql
-- Copy entire contents of server/disable_rls.sql
-- Paste and click RUN
```

**Then run this:**
```sql
-- Copy entire contents of server/sql/enhance_drives_schema.sql
-- Paste and click RUN
```

---

### 2. Restart Backend

```bash
cd server
npm run dev
```

**Look for:**
- ✅ No RLS errors
- ✅ Server starts cleanly

---

### 3. Test Everything

**Test 1: Student Registration**
- Open student app

 → Register new student
- Should work without "Failed to upsert address" error

**Test 2: Create Drive with New Fields**
- Login to admin dashboard
- Create new drive
- Add: company name, CTC min/max, description link
- Save and verify

**Test 3: Admin Endpoints**
```bash
# Get your admin token by logging in
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/admin/students
```

---

## API Endpoints Reference

### Student Management
- `GET /api/admin/students` - All students (branch filtered)
- `GET /api/admin/students/available/:driveId` - Eligible students
- `GET /api/admin/students/applied/:driveId` - Applied students

### Branch Management
- `GET /api/admin/branches` - All branches with stats
- `GET /api/admin/dashboard/stats` - Dashboard overview

### Drives (Enhanced)
- `POST /api/drives` - Create (now accepts ctc_min, ctc_max, links, etc.)
- `PUT /api/drives/:id` - Update (same enhanced fields)

---

## File Summary

**Database:**
- `server/disable_rls.sql` - Fixes RLS errors
- `server/sql/enhance_drives_schema.sql` - Adds 7 drive fields

**Backend:**
- `server/src/routes/admin.ts` - NEW admin routes
- `server/src/routes/drives.ts` - Enhanced with new fields
- `server/src/index.ts` - Registered admin routes

**Documentation:**
- `server/MIGRATION_INSTRUCTIONS.md` - Detailed migration steps
- `walkthrough.md` - Complete implementation walkthrough

---

## What's Done vs What's Next

**✅ DONE (Backend):**
- RLS fix ready
- 7 new drive fields ready
- Admin student management API
- Branch filtering logic
- Drive creation/update enhanced

**⏳ TODO (Requires SQL Migration First):**
- User must run SQL scripts in Supabase
- Test all endpoints
- Verify student registration works

**⏳ TODO (Frontend - After Backend Works):**
- Update drive form UI
- Add CTC input fields
- Create student list component
- Build branch selector
- Display drive benefits

---

## Questions?

If something doesn't work:
1. Check walkthrough.md for detailed troubleshooting
2. Verify SQL scripts ran successfully
3. Check backend console for errors
4. Ensure .env has correct Supabase credentials
