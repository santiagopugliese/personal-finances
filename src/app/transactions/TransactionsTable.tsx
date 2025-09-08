'use client'

import { useEffect, useState } from 'react'

type Tx = {
  id: string
  date: string
  type: 'income' | 'expense'
  amount: number
  currency: 'ARS' | 'USD'
  amount_ars: number | null
  category_id: string | null
  description: string | null
}

type ApiList<T> = { data?: T; error?: string }

export default function TransactionsTable({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/transactions?limit=50', { cache: 'no-store' })
      const json = (await res.json()) as ApiList<Tx[]>
      if (!res.ok) throw new Error(json.error || 'Error al cargar')
      setRows(json.data ?? [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setErr(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])
  useEffect(() => {
    if (refreshKey !== undefined) void load()
  }, [refreshKey])

  async function remove(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    try {
      setDeleting(id)
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Error al eliminar')
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert(msg)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <div className="border-b p-3 font-medium">Últimos movimientos</div>
      {loading ? (
        <div className="p-3 text-sm text-gray-500">Cargando…</div>
      ) : err ? (
        <div className="p-3 text-sm text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">Sin movimientos.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2 text-left">Moneda</th>
              <th className="px-3 py-2 text-right">ARS</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.type === 'expense' ? 'Gasto' : 'Ingreso'}</td>
                <td className="px-3 py-2 text-right">
                  {r.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2">{r.currency}</td>
                <td className="px-3 py-2 text-right">
                  {r.amount_ars != null
                    ? r.amount_ars.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                    : '—'}
                </td>
                <td className="px-3 py-2">{r.description ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => void remove(r.id)}
                    disabled={deleting === r.id}
                    className="text-red-600 disabled:opacity-50"
                  >
                    {deleting === r.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
