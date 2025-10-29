'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useActionState } from 'react';
import { toast } from '@components/toast';
import { AuthForm } from '@components/auth-form';
import { SubmitButton } from '@components/submit-button';
import { login, type LoginActionState } from '../actions';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    console.log('Login state changed:', state);
    
    if (state.status === 'failed') {
      console.error('Login failed');
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      console.error('Login validation failed');
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      console.log('Login successful, redirecting...');
      setIsSuccessful(true);
      
      // Add a small delay to ensure session is established
      setTimeout(() => {
        console.log('Attempting redirect...');
        try {
          console.log('Calling router.refresh()...');
          router.refresh();
          console.log('Calling router.push("/")...');
          router.push('/');
          console.log('Router navigation completed');
        } catch (error) {
          console.error('Router navigation failed:', error);
        }
      }, 1000);
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    console.log('Form submitted');
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
