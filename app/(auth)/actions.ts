'use server';

import { z } from 'zod';
import { createServerSupabaseClient } from './supabase-auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: 'idle' | 'invalid_data' | 'failed' | 'success';
};

export type RegisterActionState = {
  status: 'idle' | 'invalid_data' | 'failed' | 'success';
};

export async function login(
  prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    console.log('Login validation failed:', validatedFields.error);
    return { status: 'invalid_data' };
  }

  const { email, password } = validatedFields.data;

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Check if session was actually set
    const { data: { session } } = await supabase.auth.getSession();

    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' };
  }
}

export async function register(
  prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const validatedFields = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    console.log('Register validation failed:', validatedFields.error);
    return { status: 'invalid_data' };
  }

  const { email, password } = validatedFields.data;

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Check if session was actually set
    const { data: { session } } = await supabase.auth.getSession();

    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' };
  }
}
