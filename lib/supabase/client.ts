import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY || 'not_used';

// Client-side Supabase client (not used in this app - all operations are server-side)
export const supabase = createClient(supabaseUrl, supabaseKey);
