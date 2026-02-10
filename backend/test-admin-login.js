require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
    console.log('Testing Admin Login...\n');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@vignan.edu";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "ChangeMe123";

    console.log('Configuration:');
    console.log('  Admin Email:', adminEmail || 'NOT SET');
    console.log('  Admin Password:', adminPassword ? '***' : 'NOT SET');
    console.log('');

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if admin exists
    console.log('Checking for existing admins...');
    const { data: admins, error: fetchError, count } = await supabase
        .from('admins')
        .select('*', { count: 'exact' });

    if (fetchError) {
        console.error('❌ Error fetching admins:', fetchError.message);
        return;
    }

    console.log(`  Found ${count} admin(s) in database`);

    if (admins && admins.length > 0) {
        console.log('\nExisting Admins:');
        admins.forEach((admin, idx) => {
            console.log(`  ${idx + 1}. Email: ${admin.email}`);
            console.log(`     Name: ${admin.name || 'N/A'}`);
            console.log(`     Role: ${admin.role}`);
            console.log(`     Status: ${admin.status}`);
            console.log(`     Has Password Hash: ${admin.password_hash ? 'Yes' : 'No'}`);
            console.log('');
        });
    }

    // Try to login with provided credentials
    if (adminEmail && adminPassword) {
        console.log(`\nAttempting login with: ${adminEmail}`);

        const { data: admin, error: loginError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', adminEmail)
            .eq('status', 'active')
            .maybeSingle();

        if (loginError) {
            console.error('❌ Login query error:', loginError.message);
            return;
        }

        if (!admin) {
            console.log('⚠️  Admin not found with email:', adminEmail);
            console.log('   This will trigger bootstrap mode (create first admin)');

            // Test bootstrap creation
            if (count === 0) {
                console.log('\n✓ Bootstrap mode would activate (no admins exist)');
                console.log('  A new main admin would be created with:');
                console.log(`    Email: ${adminEmail}`);
                console.log(`    Password: ${adminPassword}`);
            } else {
                console.log('\n❌ Bootstrap mode WILL NOT activate (admins exist)');
                console.log('   Login will fail because email does not match existing admin');
            }
        } else {
            console.log('✓ Admin found in database');
            console.log(`  Name: ${admin.name}`);
            console.log(`  Role: ${admin.role}`);

            // Test password
            if (admin.password_hash) {
                const passwordMatch = await bcrypt.compare(adminPassword, admin.password_hash);
                if (passwordMatch) {
                    console.log('✅ Password matches! Login would succeed');
                } else {
                    console.log('❌ Password does NOT match! Login will fail');
                    console.log('   Stored hash:', admin.password_hash.substring(0, 20) + '...');
                }
            } else {
                console.log('❌ No password hash stored for this admin!');
            }
        }
    } else {
        console.log('\n⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env file');
    }
}

testAdminLogin().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
