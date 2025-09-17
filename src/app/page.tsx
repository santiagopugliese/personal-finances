import { Suspense } from 'react'
import HomeClient from './HomeClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Cargando…</div>}>
      <HomeClient />
    </Suspense>
  )
}
