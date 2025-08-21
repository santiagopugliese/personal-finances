'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { format } from 'date-fns'

type Category = { category_id?: string; name: string }

export default function NewTxPage() {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState<string>('')
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
  const [category, setCategory] = useState<string>('')
  const [desc, setDesc] = useState<string>('')
  const [cats, setCats] = useState<Category[]>([])
  const [blue, setBlue] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Cargar categorías y último dólar blue
  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from('categories').select('category_id,name'),
        supabase.from('exchange_rates').select('rate_date,blue_sell').order('rate_date', { ascending: false }).limit(1)
      ])
      setCats((c ?? []).map(x => ({ category_id: (x as any).category_id, name: (x as any).name })))
      const last = r?.[0]?.blue_sell
      setBlue(typeof last === 'number' ? last : null)
    }
    load()
  }, [])

  const amountNumber = useMemo(() => Number(amount.replace(',', '.')) || 0, [amount])

  const previewARS = useMemo(() => {
    if (currency === 'ARS') return amountNumber
    if (!blue) return null
    return +(amountNumber * blue).toFixed(2)
  }, [amountNumber, currency, blue])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!amountNumber || amountNumber <= 0) { setErr('Ingresá un monto válido.'); return }
    if (currency === 'USD' && !blue) { setErr('No tengo la cotización del blue todavía.'); return }

    const amount_ars = currency === 'ARS' ? amountNumber : +(amountNumber * (blue as number)).toFixed(2)

    try {
      setSaving(true)
      const { error } = await supabase.from('transactions').insert({
        date,
        type,
        amount: amountNumber,
        currency,
        amount_ars,
        category_id: category || null,
        description: desc || null,
      })
      if (error) throw error
      setMsg('¡Movimiento guardado!')
      // reset básico (dejamos la fecha/categoría)
      setAmount('')
      setDesc('')
    } catch (e: any) {
      setErr(e.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Fecha</span>
            <input type="date" className="border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Tipo</span>
            <select className="border rounded px-2 py-1" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Moneda</span>
            <select className="border rounded px-2 py-1" value={currency} onChange={e=>setCurrency(e.target.value as any)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm">Monto</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              className="border rounded px-2 py-1"
              value={amount}
              onChange={e=>setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-sm">Categoría</span>
            <select className="border rounded px-2 py-1" value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="">(Sin categoría)</option>
              {cats.map(c => {
                const id = c.category_id ?? c.name
                return <option key={id} value={id}>{c.name}</option>
              })}
            </select>
          </label>

          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-sm">Descripción</span>
            <input className="border rounded px-2 py-1" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="(opcional)" />
          </label>
        </div>

        <div className="text-sm text-neutral-600">
          {currency === 'USD' && (
            <>
              <span>Cotización blue: {blue ? `$${blue.toFixed(2)} ARS/USD` : 'cargando…'}</span><br />
              <span>Previsualización en ARS: {previewARS !== null ? `$${previewARS.toLocaleString('es-AR')}` : '—'}</span>
            </>
          )}
          {currency === 'ARS' && (
            <span>Monto en ARS: {amount ? `$${amount}` : '—'}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>

        <div className="min-h-[1.25rem] pt-1 text-sm" aria-live="polite">
          {err && <p className="text-red-600">{err}</p>}
          {msg && <p className="text-green-700">{msg}</p>}
        </div>
      </form>
    </div>
  )
}
