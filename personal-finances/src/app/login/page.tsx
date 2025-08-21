'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setInfoMsg('¡Login correcto! Redirigiendo…')
    // pequeña pausa para que se vea el mensaje
    setTimeout(() => router.push('/'), 900)
    setLoading(false)
  }

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-xl font-semibold mb-4">Login</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="border rounded px-3 py-2 w-full"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2 w-full"
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-60"
          aria-busy={loading}
          aria-live="polite"
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Entrando…' : 'Login'}
        </button>
      </form>

      <div className="mt-3 min-h-[1.25rem]" aria-live="polite">
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {infoMsg && <p className="text-green-600 text-sm">{infoMsg}</p>}
      </div>

      <p className="text-sm mt-2">
        ¿No tenés cuenta? <a className="underline" href="/signup">Sign Up</a>
      </p>
    </div>
  )
}
