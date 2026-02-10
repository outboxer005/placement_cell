# Database Migration Instructions

## Step 1: Disable RLS (Fix Registration Errors)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Create new query
4. Copy contents from `disable_rls.sql`
5. Run the query
6. Verify all tables show `rls_enabled = false`

**Expected Result:**
- No more "row violates row-level security policy" errors
- Student registration will work
- Address and education insertion will succeed

---

## Step 2: Enhance Drives Table

1. In Supabase SQL Editor
2. Copy contents from `sql/enhance_drives_schema.sql`
3. Run the query
4. Verify new columns appear in verification output

**Expected Result:**
- Drives table has new fields: company_name, ctc_min, ctc_max, etc.
- All existing drives have empty benefits `{}`
- All drives have branches array in eligibility

---

## Step 3: Restart Backend Server

```bash
cd server
npm run dev
```

**Expected Result:**
- No RLS errors in console
- Server starts cleanly
- "✅ Main admin configured" message appears

---

## Step 4: Test Student Registration

1. Open student app
2. Try registering a new student
3. Fill all fields including address
4. Submit registration

**Expected Result:**
- Registration succeeds
- No "Failed to upsert address" error
- No "Failed to ensure password" error
- Student can login immediately

---

## Verification Checklist

- [ ] RLS disabled on all tables
- [ ] No RLS errors when starting backend
- [ ] Student registration works
- [ ] Drives table has new columns
- [ ] Existing drives still load correctly
- [ ] Admin can create drives with new fields

---

## Rollback (If Needed)

To re-enable RLS:

```sql
-- Re-enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

**Note:** You'll need proper RLS policies and service role key for this to work.
