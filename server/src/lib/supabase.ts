import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL || 'https://qcgrkqchmhsgimvtbfne.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

// Service role client — bypasses RLS for server-side operations
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
