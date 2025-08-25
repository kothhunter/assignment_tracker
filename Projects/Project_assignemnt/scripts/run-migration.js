const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '..', 'database-migration-planning-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running database migration...');
    console.log('SQL Content:');
    console.log(sqlContent.substring(0, 200) + '...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration completed successfully!');
    console.log('Result:', data);
    
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();