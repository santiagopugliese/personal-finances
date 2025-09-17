import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Cargando…</div>}>
      <LoginClient />
    </Suspense>
  )
}
