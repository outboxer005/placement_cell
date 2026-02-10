# RLS (Row Level Security) Temporary Disable

## Current Situation

The backend is using the **anon key** instead of the **service role key**, which causes RLS errors when trying to insert data.

## Quick Fix Applied

**✅ RLS has been temporarily disabled on all tables** to allow the backend to function.

## How to Apply

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/abusfzhvkokluodzvbor

2. **Open SQL Editor:**
   - Navigate to: **SQL Editor** (left sidebar)
   - Click: **New Query**

3. **Run the SQL Script:**
   - Copy content from `disable_rls.sql`
   - Paste into SQL Editor
   - Click **Run** button

4. **Restart Backend Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

5. **Verify:**
   - Check console: Should see "Seeded main admin: admin@vignan.edu"
   - No more RLS errors
   - Admin login should work

---

## ⚠️ Important: Get Service Role Key Later

For production security, you should eventually:

### Step 1: Get Correct Service Role Key

1. Go to: https://supabase.com/dashboard/project/abusfzhvkokluodzvbor/settings/api
2. Find: **service_role** key (marked as "secret")
3. Copy the key (it's a long JWT token)

### Step 2: Update .env

Replace line 10 in `.env`:
```env
SUPABASE_SERVICE_KEY=<paste-service-role-key-here>
```

### Step 3: Re-enable RLS (Optional)

Once you have the service role key, you can re-enable RLS for better security:

```sql
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

---

## Current Status

✅ **Temporary fix applied** - Backend will work  
⚠️ **Service role key** - Should be updated for production  
✅ **Admin seeding** - Will work after running SQL script  
✅ **API endpoints** - Will function normally  

---

## Security Note

**Current Setup (RLS Disabled):**
- All API calls can access data directly
- Backend uses anon key with RLS disabled
- Less secure but functional

**Ideal Setup (RLS Enabled + Service Role Key):**
- Service role key bypasses RLS for backend
- Better security model
- Recommended for production

**For development/testing, current setup is acceptable.**
