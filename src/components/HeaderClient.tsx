'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { AuthChangeEvent } from '@supabase/supabase-js'

export default function HeaderClient() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    // Estado inicial: usar getSession (no falla si no hay sesión)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setEmail(data.session?.user?.email ?? null)
      setLoading(false)
    })

    // Escuchar cambios de auth
    const { data: sub } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
            setEmail(session?.user?.email ?? null)
            break
          case 'SIGNED_OUT':
          case 'USER_DELETED':
            setEmail(null)
            break
          default:
            break
        }
      }
    )
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    try {
      setSigningOut(true)
      await supabase.auth.signOut({ scope: 'global' })
      setEmail(null)
      // navegación dura para evitar que quede UI vieja
      window.location.assign('/login')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
      <Link href="/" className="font-semibold">Personal Finances</Link>

      <nav className="ml-auto flex items-center gap-3 text-sm">
        {loading ? (
          <span className="text-neutral-500">…</span>
        ) : email ? (
          <>
            {/* 🔒 Enlaces protegidos — solo con sesión */}
            <Link href="/transactions" className="underline">Nuevo movimiento</Link>
            <Link href="/categories" className="rounded-xl border px-3 py-1">Categorías</Link>
            <span className="text-neutral-600">{email}</span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="underline cursor-pointer disabled:opacity-60"
            >
              {signingOut ? 'Saliendo…' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            {/* 🌐 Solo mostrar Login / Sign Up si NO hay sesión */}
            <Link href="/login" className="underline">Login</Link>
            <Link href="/signup" className="underline">Sign Up</Link>
          </>
        )}
      </nav>
    </div>
  )
}
