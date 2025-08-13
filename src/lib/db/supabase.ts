import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export untuk backward compatibility
export default supabase

export async function signUpWithEmail({ email, password, full_name, phone }: { email: string, password: string, full_name: string, phone?: string }) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail({ email, password }: { email: string, password: string }) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getCurrentUser() {
  if (!supabase) return null;
  return supabase.auth.getUser();
}

export async function updateProfile(updates: { full_name?: string, phone?: string }) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.auth.updateUser({ data: updates });
  if (error) throw error;
  return data;
} 