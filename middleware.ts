import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { guestRegex, } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware called for path:', pathname);

  // Allow auth routes to pass through
  if (['/login', '/register'].includes(pathname)) {
    console.log('Allowing auth route to pass through:', pathname);
    return NextResponse.next();
  }

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const value = request.cookies.get(name)?.value;
          console.log('Getting cookie:', name, '=', value ? 'exists' : 'not found');
          return value;
        },
        async set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          const response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        async remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          const response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession();

  console.log('Session check result:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
    error: error?.message
  });

  if (!session) {
    const redirectUrl = encodeURIComponent(request.url);
    console.log('No session found, redirecting to login');
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  // Check if user is a guest
  const isGuest = guestRegex.test(session.user?.email ?? '');

  // Redirect authenticated users away from auth pages
  if (session && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('Session valid, allowing access to:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
