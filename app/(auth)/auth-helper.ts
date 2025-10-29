import { createServerSupabaseClient } from '@lib/supabase';
import { redirect } from 'next/navigation';

export type UserType = 'guest' | 'regular';

export interface AuthUser {
  id: string;
  email: string;
  type: UserType;
}

export async function auth(): Promise<AuthUser> {
  const supabase = createServerSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  // Use Supabase Auth user data directly
  const userType: UserType = user.email?.includes('guest') ? 'guest' : 'regular';
  
  return {
    id: user.id,
    email: user.email || '',
    type: userType,
  };
}
