import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe anon client — used only for Supabase Auth on the client side.
 * Never holds the service role key.
 * Lazily validated so the build does not crash when env vars are absent.
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

/**
 * Returns a browser-safe Supabase client using the anon key.
 * Call this only from client components that need Auth (login, session check).
 */
export function getSupabaseBrowser() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

let _supabase: ReturnType<typeof getSupabaseBrowser> | null = null;

/**
 * Singleton browser client for use in client components.
 * Lazily initialised — safe to import in files that may be evaluated
 * during SSR/build before NEXT_PUBLIC_* env vars are injected.
 */
export function getSupabaseClient() {
  if (!_supabase) _supabase = getSupabaseBrowser();
  return _supabase;
}

/**
 * @deprecated Use getSupabaseClient() to avoid module-load crashes when
 * env vars are absent during SSR. Kept as a re-export for compatibility.
 */
export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  },
} as ReturnType<typeof getSupabaseBrowser>;

/**
 * Returns a server-only Supabase client using the service role key.
 * This key bypasses RLS — call only from API routes and server components.
 * NEVER import this in client components.
 */
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey)
    throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
