// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirectTo = url.searchParams.get('next') || '/'

  // Usamos una respuesta para poder setear cookies
  const res = NextResponse.redirect(new URL(redirectTo, req.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => res.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  )

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return res
}
