'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const [msg, setMsg] = useState('Verificando…')
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/'

  useEffect(() => {
    let mounted = true
    async function run() {
      const code = sp.get('code')
      const urlError = sp.get('error') || sp.get('error_description')

      if (urlError) {
        setMsg(`Error: ${urlError}`)
        return
      }

      // Case 1: exchange code if present
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setMsg(`Error: ${error.message}`)
          return
        }
        setMsg('¡Email verificado! Iniciando sesión…')
        setTimeout(() => router.replace(next), 800)
        return
      }

      // Case 2: no code => maybe session already exists
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        setMsg(`Error: ${error.message}`)
        return
      }
      if (data.user) {
        setMsg('Sesión detectada. Redirigiendo…')
        setTimeout(() => router.replace(next), 600)
        return
      }

      // Case 3: neither code nor session
      setMsg('Faltan parámetros de verificación.')
    }
    run()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-xl shadow">
      <p>{msg}</p>
    </div>
  )
}
