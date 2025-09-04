// src/lib/supabaseServer.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { NextResponse } from 'next/server'

export async function createSupabaseServer(res: NextResponse) {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        }
      }
    }
  )
}
