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
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: notConfiguredError.error }) }) }),
      update: () => ({ eq: async () => ({ data: null, error: notConfiguredError.error }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ status: 'SUBSCRIBED' }) }),
      subscribe: () => ({}),
    }),
    getChannels: () => [],
    removeChannel: () => {},
  } as any;
};

/**
 * Retrieve or generate a unique ID for the current browser tab.
 */
function getOrCreateTabId(): string {
  if (typeof window === 'undefined') return 'server';
  const TAB_ID_KEY = '__aero_tab_id__';
  let tabId = window.sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

const tabId = getOrCreateTabId();

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // This is the true fix: A unique storageKey per tab natively namespaces 
        // both the sessionStorage keys AND the Supabase BroadcastChannel name,
        // completely preventing cross-tab authentication interference.
        storageKey: `aero-auth-${tabId}`,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    }) 
  : createMockSupabase();

