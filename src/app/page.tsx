'use client'
import RequireAuth from '@/components/RequireAuth'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

type MonthlyRow = {
  month_start: string  // ISO date (p.ej. '2025-09-01')
  category_id: string | null
  expenses_ars: number
  incomes_ars: number
}
type Cat = { id: string; name: string }

/** Fila para Recharts: clave fija 'month' + columnas dinámicas por categoría (números) */
type ChartRow = { month: string } & Record<string, number>

export default function HomePage() {
  const [rows, setRows] = useState<MonthlyRow[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [monthFilter, setMonthFilter] = useState<string>('') // 'YYYY-MM' or ''

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: c }] = await Promise.all([
        supabase
          .from('v_monthly_category')
          .select('month_start,category_id,expenses_ars,incomes_ars')
          .returns<MonthlyRow[]>(),
        supabase
          .from('categories')
          .select('id,name')
          .returns<Cat[]>(),
      ])
      setRows(v ?? [])
      setCats(c ?? [])
    }
    void load()
  }, [])

  const catMap = useMemo(() => new Map(cats.map((c) => [c.id, c.name] as const)), [cats])

  const months = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) {
      const m = format(parseISO(r.month_start), 'yyyy-MM')
      s.add(m)
    }
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    if (!monthFilter) return rows
    return rows.filter((r) => format(parseISO(r.month_start), 'yyyy-MM') === monthFilter)
  }, [rows, monthFilter])

  // Recharts data: por mes → columnas por categoría (gastos)
  const chartData: ChartRow[] = useMemo(() => {
    const byMonth = new Map<string, ChartRow>()
    for (const r of filtered) {
      const key = r.month_start
      if (!byMonth.has(key)) {
        byMonth.set(key, { month: format(parseISO(key), 'MMM yyyy') })
      }
      const obj = byMonth.get(key)!
      const catName = r.category_id ? (catMap.get(r.category_id) ?? 'Sin categoría') : 'Sin categoría'
      obj[catName] = (obj[catName] ?? 0) + Number(r.expenses_ars)
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => parseISO(a[0]).getTime() - parseISO(b[0]).getTime())
      .map(([, v]) => v)
  }, [filtered, catMap])

  const series = useMemo(() => {
    const set = new Set<string>()
    chartData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== 'month') set.add(k)
      })
    })
    return Array.from(set)
  }, [chartData])

  return (
    <RequireAuth>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Resumen mensual</h1>
          <select
            className="ml-auto rounded border px-2 py-1"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="">Todos los meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {format(parseISO(m + '-01'), 'MMM yyyy')}
              </option>
            ))}
          </select>
        </header>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          {chartData.length === 0 ? (
            <p className="text-sm text-neutral-600">Sin datos aún.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {series.map((s) => (
                    <Bar key={s} dataKey={s} stackId="g" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
