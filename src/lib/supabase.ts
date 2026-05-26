/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const configured = Boolean(supabaseUrl && supabaseAnonKey);

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!configured) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// Lazy accessor — returns null instead of throwing when not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient();
    if (!client) {
      console.warn(`Supabase not configured, ignoring .${String(prop)}`);
      return undefined;
    }
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return (...args: any[]) => value.apply(client, args);
    }
    return value;
  },
}) as SupabaseClient;

export function isSupabaseConfigured(): boolean {
  return configured;
}
