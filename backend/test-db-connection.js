require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('Testing Supabase Connection...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  console.log('Configuration:');
  console.log('  SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.log('  SUPABASE_SERVICE_KEY:', supabaseKey ? `Set (${supabaseKey.length} chars)` : 'NOT SET');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
  console.log('');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  console.log('✓ Supabase client created successfully\n');
  
  // Test connection by listing tables
  console.log('Testing database connection...');
  
  try {
    // Try to query students table
    const { data: students, error: studentsError, count: studentsCount } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true });
    
    if (studentsError) {
      console.error('❌ Students table error:', studentsError.message);
    } else {
      console.log(`✓ Students table: ${studentsCount !== null ? studentsCount + ' records' : 'accessible'}`);
    }
    
    // Try to query admins table
    const { data: admins, error: adminsError, count: adminsCount } = await supabase
      .from('admins')
      .select('id', { count: 'exact', head: true });
    
    if (adminsError) {
      console.error('❌ Admins table error:', adminsError.message);
    } else {
      console.log(`✓ Admins table: ${adminsCount !== null ? adminsCount + ' records' : 'accessible'}`);
    }
    
    // Try to query drives table
    const { data: drives, error: drivesError, count: drivesCount } = await supabase
      .from('drives')
      .select('id', { count: 'exact', head: true });
    
    if (drivesError) {
      console.error('❌ Drives table error:', drivesError.message);
    } else {
      console.log(`✓ Drives table: ${drivesCount !== null ? drivesCount + ' records' : 'accessible'}`);
    }
    
    // Try to query applications table
    const { data: applications, error: applicationsError, count: applicationsCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true });
    
    if (applicationsError) {
      console.error('❌ Applications table error:', applicationsError.message);
    } else {
      console.log(`✓ Applications table: ${applicationsCount !== null ? applicationsCount + ' records' : 'accessible'}`);
    }
    
    // Try to query notifications table
    const { data: notifications, error: notificationsError, count: notificationsCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true });
    
    if (notificationsError) {
      console.error('❌ Notifications table error:', notificationsError.message);
    } else {
      console.log(`✓ Notifications table: ${notificationsCount !== null ? notificationsCount + ' records' : 'accessible'}`);
    }
    
    console.log('\n✅ Database connection test completed!');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
