import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl !== 'https://your-supabase-project-ref.supabase.co' &&
    !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[WorkNest] Supabase environment variables are missing or set to placeholder defaults. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are configured.'
  );
}

// Clerk Native Third-Party Authentication Token Provider
let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (getter: (() => Promise<string | null>) | null) => {
  clerkTokenGetter = getter;
};

export const getClerkToken = async (): Promise<string | null> => {
  if (clerkTokenGetter) {
    try {
      return await clerkTokenGetter();
    } catch (err) {
      console.warn('[WorkNest] Failed to retrieve Clerk token for Supabase:', err);
      return null;
    }
  }
  return null;
};

/**
 * Detect whether Clerk is configured as the auth provider.
 *
 * When Clerk is active, the Supabase client uses the `accessToken` callback
 * for third-party auth.  This replaces `supabase.auth` with a Proxy that
 * throws on every property access (by design in @supabase/supabase-js >=2.49).
 *
 * Legacy `supabase.auth.*` calls (signInWithPassword, getSession,
 * onAuthStateChange, etc.) MUST NOT be invoked when this flag is true.
 */
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
export const isClerkAuthMode: boolean = Boolean(clerkPublishableKey);

// Build client options — only attach `accessToken` when Clerk is the auth provider.
// When `accessToken` is provided, supabase-js replaces `supabase.auth` with a
// throwing Proxy, so legacy Supabase Auth methods become unusable.
const clientOptions: Parameters<typeof createClient>[2] = isClerkAuthMode
  ? {
      accessToken: async (): Promise<string | null> => {
        const clerkToken = await getClerkToken();
        return clerkToken ?? null;
      },
    }
  : {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    };

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabasePublishableKey || 'placeholder-anon-key',
  clientOptions
);

// If Clerk auth mode is enabled, supabase-js installs a Proxy on supabase.auth
// that throws whenever any auth property or method is accessed.
// Provide a safe no-op stub on (supabase as any).auth so legacy or third-party code
// calling auth methods doesn't crash the application with unhandled exceptions.
if (isClerkAuthMode) {
  (supabase as any).auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: new Error('Clerk authentication is active. Please use the Clerk sign-in interface.'),
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: new Error('Clerk authentication is active. Please use the Clerk sign-up interface.'),
    }),
    resetPasswordForEmail: async () => ({
      error: new Error('Clerk authentication is active. Password reset is managed by Clerk.'),
    }),
    updateUser: async () => ({
      data: { user: null },
      error: new Error('Clerk authentication is active. Profile updates are managed by Clerk.'),
    }),
  };
}
