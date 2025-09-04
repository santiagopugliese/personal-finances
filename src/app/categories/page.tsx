'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import CategoriesTable from './CategoriesTable'
import CategoryForm from './CategoryForm'

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error loading categories')
      setCategories(json.data || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onCreate(input: { name: string; color?: string }) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error creating category')
    toast.success('Categoría creada')
    await load()
  }

  async function onUpdate(id: string, input: { name?: string; color?: string }) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error updating category')
    toast.success('Cambios guardados')
    await load()
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error deleting category')
    toast.success('Categoría eliminada')
    await load()
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Categorías</h1>

      <div className="rounded-2xl border p-4">
        <h2 className="font-medium mb-3">Nueva categoría</h2>
        <CategoryForm onSubmit={onCreate} />
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="font-medium mb-3">Tus categorías</h2>
        <CategoriesTable
          loading={loading}
          categories={categories}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
