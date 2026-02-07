const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearOTP() {
  const { data, error } = await supabase
    .from('admin_otp_requests')
    .delete()
    .eq('email', 'jan.a.rosen@gmail.com');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Cleared all OTP requests for jan.a.rosen@gmail.com');
}

clearOTP();
