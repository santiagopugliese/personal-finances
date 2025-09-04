'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)
    try {
      // 1) Login en el cliente (guarda sesión en localStorage)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // 2) Leer la sesión del cliente
      const {
        data: { session },
        error: sessionErr
      } = await supabase.auth.getSession()
      if (sessionErr) throw sessionErr
      if (!session) throw new Error('No session after login')

      // 3) Sincronizar sesión al servidor (cookies httpOnly)
      const res = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // asegura que el browser acepte Set-Cookie
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Error setting server session')
      }

      // 4) Redirigir (respeta ?next=)
      router.push(next)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>

      <form onSubmit={handleLogin} className="space-y-3 rounded-2xl border p-4">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-sm">Contraseña</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <div className="min-h-[1.25rem] text-sm pt-1" aria-live="polite">
          {errorMsg && <p className="text-red-600">{errorMsg}</p>}
        </div>
      </form>

      <p className="mt-3 text-sm text-neutral-600">
        ¿No tenés cuenta? <a href="/signup" className="underline">Registrate</a>
      </p>
    </div>
  )
}
