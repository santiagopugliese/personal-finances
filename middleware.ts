import { NextRequest, NextResponse } from 'next/server'
import { initSupabaseForMiddleware } from '@/utils/supabase/middleware'

const PUBLIC_PAGES = new Set<string>(['/login', '/signup'])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // excluir estáticos / auth utils / api
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/assets') || /\.[\w]+$/.test(pathname)
  const isAuthUtility = pathname.startsWith('/api/auth/set-session')
  const isApi = pathname.startsWith('/api/')
  if (isStatic || isAuthUtility || isApi) return NextResponse.next()

  // crear una respuesta "contenedor" para Set-Cookie
  const res = NextResponse.next()

  // crear supabase con bridge de cookies req -> res
  const supabase = initSupabaseForMiddleware(req, res)

  // refresca tokens si hace falta y nos dice si hay user
  const { data: { user } } = await supabase.auth.getUser()

  const needsAuth =
    pathname === '/' ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/categories')

  if (!user && needsAuth && !PUBLIC_PAGES.has(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // devolver SIEMPRE 'res' (lleva posibles Set-Cookie)
  return res
}

export const config = {
  matcher: ['/((?!.*\\.).*)'],
}
