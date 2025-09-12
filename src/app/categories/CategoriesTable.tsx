'use client'
import { useState } from 'react'

type Category = { id: string; name: string; color?: string | null }

export default function CategoriesTable({
  loading,
  categories,
  onUpdate,
  onDelete,
}: {
  loading: boolean
  categories: Category[] // ✅ allow null in color
  onUpdate: (id: string, input: { name?: string; color?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tmp, setTmp] = useState<{ name: string; color?: string }>({
    name: '',
    color: '#999999',
  })
  const [busy, setBusy] = useState<string | null>(null)

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setTmp({ name: cat.name, color: cat.color ?? '#999999' })
  }

  async function save(id: string) {
    setBusy(id)
    try {
      await onUpdate(id, tmp)
      setEditingId(null)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Cargando…</div>
  if (!categories?.length) return <div className="text-sm text-gray-500">Sin categorías aún.</div>

  return (
    <div className="divide-y rounded-xl border">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center gap-3 p-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: c.color ?? '#999999' }} // ✅ null-safe
          />

          {editingId === c.id ? (
            <>
              <input
                className="flex-1 rounded border px-2 py-1"
                value={tmp.name}
                onChange={(e) => setTmp((t) => ({ ...t, name: e.target.value }))}
              />
              <input
                type="color"
                className="h-8 w-12 rounded"
                value={tmp.color ?? '#999999'} // ✅ ensure string
                onChange={(e) => setTmp((t) => ({ ...t, color: e.target.value }))}
              />
              <button
                className="rounded border px-3 py-1"
                onClick={() => save(c.id)}
                disabled={busy === c.id}
              >
                {busy === c.id ? 'Guardando…' : 'Guardar'}
              </button>
              <button className="rounded border px-3 py-1" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.id}</div>
              </div>
              <button className="rounded border px-3 py-1" onClick={() => startEdit(c)}>
                Editar
              </button>
              <button className="rounded border px-3 py-1" onClick={() => onDelete(c.id)}>
                Eliminar
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
