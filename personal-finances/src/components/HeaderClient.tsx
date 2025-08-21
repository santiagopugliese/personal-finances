'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HeaderClient() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    // Initial load
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.warn('getUser error:', error)
      setEmail(data.user?.email ?? null)
      setLoading(false)
    })

    // React to auth changes (login / logout / token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // console.log('auth event', event)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setEmail(session?.user?.email ?? null)
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setEmail(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    try {
      setSigningOut(true)
      const { error } = await supabase.auth.signOut() // default scope: 'local'
      if (error) {
        console.error('signOut error:', error)
      }
      // onAuthStateChange will setEmail(null) too, but we force it just in case:
      setEmail(null)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
      <Link href="/" className="font-semibold">Personal Finances</Link>
      <nav className="ml-auto flex items-center gap-3 text-sm">
        <Link href="/transactions/create" className="underline">Nuevo movimiento</Link>

        {loading ? (
          <span className="text-neutral-500">…</span>
        ) : email ? (
          <>
            <span className="text-neutral-600">{email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="underline cursor-pointer"
            >
              {signingOut ? 'Saliendo…' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">Login</Link>
            <Link href="/signup" className="underline">Sign Up</Link>
          </>
        )}
      </nav>
    </div>
  )
}
