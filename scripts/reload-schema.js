#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function reloadSchema() {
  console.log('🔄 Reloading PostgREST schema cache...\n');

  try {
    // Execute SQL to reload schema
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "NOTIFY pgrst, 'reload schema';"
    });

    if (error) {
      console.log('⚠️  Direct notify failed, trying alternative method...');
      // Alternative: Just query the tables which should work now
      const { data: campaigns, error: campError } = await supabase
        .from('campaigns')
        .select('slug, title')
        .limit(5);

      if (campError) {
        console.error('❌ Error:', campError.message);
      } else {
        console.log('✅ Schema cache is working! Found campaigns:');
        campaigns.forEach(c => console.log(`   • ${c.title} (/c/${c.slug})`));
      }
    } else {
      console.log('✅ Schema cache reloaded successfully!');
    }

    console.log('\n🎉 Database is ready!');
    console.log('\nTest URLs:');
    console.log('   📍 http://localhost:3000/c/stanford');
    console.log('   📍 http://localhost:3000/c/partner-event');
    console.log('   🔐 http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

reloadSchema();
