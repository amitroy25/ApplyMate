import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function findInvalidHeaderName(headers?: HeadersInit): string | null {
  if (!headers) return null;

  const entries: Array<[string, string]> = headers instanceof Headers
    ? Array.from(headers.entries())
    : Array.isArray(headers)
      ? headers
      : Object.entries(headers);

  for (const [name, value] of entries) {
    try {
      new Headers([[name, value]]);
    } catch {
      return name;
    }
  }

  return null;
}

const diagnosticFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    const invalidHeader = findInvalidHeaderName(init?.headers);
    if (invalidHeader) {
      throw new TypeError(`Browser rejected an invalid "${invalidHeader}" request header.`);
    }
    throw error;
  }
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: { fetch: diagnosticFetch }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the required VITE_SUPABASE_* values and restart the app.');
  }

  return supabase;
}
