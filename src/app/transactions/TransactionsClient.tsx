'use client'

import RequireAuth from '@/components/RequireAuth'
import { useState } from 'react'
import TransactionForm from './TransactionForm'
import TransactionsTable from './TransactionsTable'

export default function TransactionsClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Movimientos</h1>

        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 font-medium">Nuevo movimiento</h2>
          <TransactionForm onCreated={() => setRefreshKey((k) => k + 1)} />
        </div>

        <TransactionsTable refreshKey={refreshKey} />
      </div>
    </RequireAuth>
  )
}
