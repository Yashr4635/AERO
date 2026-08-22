import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'AERO Configuration Error\n\nMissing:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_PUBLISHABLE_KEY\n\nAdd these values to .env and restart the development server to enable authentication and backend features.'
  );
}

const createMockSupabase = () => {
  const notConfiguredError = { error: new Error('Supabase is not configured. Please add credentials to .env') };
  
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => notConfiguredError,
      signInWithOAuth: async () => notConfiguredError,
      signUp: async () => notConfiguredError,
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ order: async () => ({ data: [], error: notConfiguredError.error }) }),
        order: async () => ({ data: [], error: notConfiguredError.error })
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: notConfiguredError.error }) }) })
    })
  } as any;
};

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : createMockSupabase();
