'use client'
import { useState } from 'react'

export default function CategoryForm({
  onSubmit
}: {
  onSubmit: (v: { name: string; color?: string }) => Promise<void> | void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#999999')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setSubmitting(true)
      await onSubmit({ name: name.trim(), color })
      setName('')
      setColor('#999999')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="block text-sm mb-1">Nombre</label>
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Ej. Comida, Transporte"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Color</label>
        <input
          type="color"
          className="h-10 w-16 rounded"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl border px-4 py-2 md:ml-2"
      >
        {submitting ? 'Creando…' : 'Crear'}
      </button>
    </form>
  )
}
