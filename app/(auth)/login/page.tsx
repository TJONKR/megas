'use client';

import { AuthForm } from '@components/auth-form';
import { SubmitButton } from '@components/submit-button';
import { toast } from '@components/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { login, type LoginActionState } from '../actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, setState] = useState<LoginActionState>({
    status: 'idle',
  });

  const handleSubmit = async (formData: FormData) => {
    console.log('Form submitted');
    setEmail(formData.get('email') as string);
    const result = await login(state, formData);
    setState(result);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-400">
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
        <Suspense fallback={null}>
          <LoginRedirectEffects state={state} setIsSuccessful={setIsSuccessful} />
        </Suspense>
      </div>
    </div>
  );
}

function LoginRedirectEffects({
  state,
  setIsSuccessful,
}: {
  state: LoginActionState;
  setIsSuccessful: (value: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('Login state changed:', state);

    // Guard against undefined state
    if (!state) {
      return;
    }

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

      setTimeout(() => {
        console.log('Attempting redirect...');
        try {
          console.log('Calling router.refresh()...');
          router.refresh();
          const dest = searchParams.get('redirect') || '/';
          console.log(`Calling router.push("${dest}")...`);
          router.push(dest);
          console.log('Router navigation completed');
        } catch (error) {
          console.error('Router navigation failed:', error);
        }
      }, 1000);
    }
  }, [state, router, searchParams, setIsSuccessful]);

  return null;
}
