'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const ok = !!data.session
      setAllowed(ok)
      setChecking(false)
      if (!ok) {
        const next = pathname + (search?.toString() ? `?${search}` : '')
        router.replace(`/login?next=${encodeURIComponent(next)}`)
      }
    })
    return () => { mounted = false }
  }, [router, pathname, search])

  if (checking) {
    return <div className="p-6 text-sm text-neutral-600">Verificando sesión…</div>
  }
  if (!allowed) return null
  return <>{children}</>
}
