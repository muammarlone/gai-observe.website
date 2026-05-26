import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.supabase.co') &&
      !parsed.hostname.includes('your_project_ref')
    );
  } catch {
    return false;
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('_sb_warn')) {
    sessionStorage.setItem('_sb_warn', '1');
    console.warn('Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  }
} else if (!isValidSupabaseUrl(supabaseUrl)) {
  console.error('VITE_SUPABASE_URL must be a valid https://*.supabase.co URL. Supabase disabled.');
}

export const supabase =
  supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
