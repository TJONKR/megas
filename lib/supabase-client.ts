import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side client with cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return document.cookie.split(';').map((cookie) => {
        const [name, value] = cookie.trim().split('=');
        return { name, value };
      });
    },
    setAll(cookies: { name: string; value: string; options?: any }[]) {
      cookies.forEach(({ name, value, options }) => {
        document.cookie = `${name}=${value}; path=/; max-age=${options?.maxAge || 31536000}; secure; samesite=lax`;
      });
    },
  },
});
