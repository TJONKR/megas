# Base Starter Project

A clean, production-ready Next.js starter template with authentication and database integration.

## Features

- **Next.js 15** with App Router
  - Server Components and Server Actions
  - TypeScript support
  - Turbopack for fast development

- **Authentication**
  - Supabase Auth integration
  - Protected routes via middleware
  - Login and registration pages

- **Database**
  - Supabase integration ready
  - Database migrations included
  - Row Level Security (RLS) support

- **UI Components**
  - shadcn/ui components
  - Tailwind CSS styling
  - Dark mode support with next-themes
  - Responsive design

- **Developer Experience**
  - Biome for linting and formatting
  - TypeScript strict mode
  - Path aliases configured
  - OpenTelemetry instrumentation

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in `lib/db/migrations/` to set up your database schema
3. Update your `.env.local` with your Supabase credentials

## Project Structure

```
├── app/
│   ├── (auth)/          # Authentication pages and logic
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ...              # Custom components
├── hooks/               # Custom React hooks
├── lib/
│   ├── db/              # Database queries and migrations
│   ├── constants.ts     # App constants
│   ├── errors.ts        # Error handling
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
└── middleware.ts        # Auth middleware

```

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm format` - Format code with Biome

## Customization

### Adding Protected Routes

Edit `middleware.ts` to add your protected routes:

```typescript
function isProtectedRoute(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/dashboard');
}
```

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`
- Theme configuration: Uses next-themes for dark mode

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
