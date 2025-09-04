'use client'

import RequireAuth from '@/components/RequireAuth'
import { useState } from 'react'
import TransactionForm from './TransactionForm'
import TransactionsTable from './TransactionsTable'

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>
        </div>

        <TransactionForm onCreated={() => setRefreshKey(k => k + 1)} />

        <TransactionsTable refreshKey={refreshKey} />
      </div>
    </RequireAuth>
  )
}
