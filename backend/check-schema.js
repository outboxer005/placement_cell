const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
    console.log('Checking students table schema...\n');

    // Get one student record to see actual columns
    const { data, error } = await db.from('students').select('*').limit(1);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data[0]) {
        console.log('✅ Columns in students table:');
        Object.keys(data[0]).sort().forEach(col => {
            const value = data[0][col];
            const type = value === null ? 'null' : typeof value;
            console.log(`  - ${col}: ${type}`);
        });
    } else {
        console.log('No student records found');
    }
}

checkSchema();
