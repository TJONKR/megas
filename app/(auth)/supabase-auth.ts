import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side client for use in API routes and server actions
export const createServerSupabaseClient = () => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const cookieStore = await cookies();
        return cookieStore.get(name)?.value;
      },
      async set(name: string, value: string, options: any) {
        try {
          console.log('Setting cookie:', name, 'value length:', value.length, 'options:', options);
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
          console.log('Cookie set successfully');
        } catch (error) {
          console.error('Error setting cookie:', error);
          console.error('Error details:', {
            name,
            valueLength: value.length,
            options,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack'
          });
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      async remove(name: string, options: any) {
        try {
          console.log('Removing cookie:', name);
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options });
          console.log('Cookie removed successfully');
        } catch (error) {
          console.error('Error removing cookie:', error);
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};

export async function signInWithEmail(email: string, password: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  return session;
}

export async function getUser() {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}@example.com`;
  const password = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}
