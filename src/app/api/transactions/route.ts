// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

const TxSchema = z.object({
  date: z.string(), // 'YYYY-MM-DD'
  type: z.enum(['income','expense']),
  amount: z.number().nonnegative(),
  currency: z.enum(['ARS','USD']),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  amount_ars: z.number().nonnegative().optional()
})

function getSearchParam(url: string, key: string) {
  try { return new URL(url).searchParams.get(key) } catch { return null }
}

export async function GET(req: Request) {
  const res = new NextResponse()
  const cookieStore = await cookies()
  const authHeader = req.headers.get('authorization') ?? undefined

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        }
      },
      // si mandás Authorization desde el cliente, también soportalo
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined
    }
  )

  // (opcional) exigir sesión; o podés dejarlo abierto si solo listás propias por RLS
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })

  const limit = Number(getSearchParam(req.url, 'limit') ?? '50') || 50

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }

  // ✅ siempre devolvemos JSON
  return NextResponse.json({ data: data ?? [] }, { headers: res.headers })
}

export async function POST(req: Request) {
  const res = new NextResponse()
  const cookieStore = await cookies()
  const authHeader = req.headers.get('authorization') ?? undefined

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        }
      },
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })

  const body = await req.json().catch(() => null)
  const parsed = TxSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: res.headers })
  }

  let { amount_ars } = parsed.data
  if (parsed.data.currency === 'USD' && (amount_ars == null)) {
    const { data: rateRow, error: rateErr } = await supabase
      .from('exchange_rates')
      .select('blue_sell')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (rateErr || !rateRow?.blue_sell) {
      return NextResponse.json({ error: 'No exchange rate available' }, { status: 400, headers: res.headers })
    }
    amount_ars = +(parsed.data.amount * Number(rateRow.blue_sell)).toFixed(2)
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      date: parsed.data.date,
      type: parsed.data.type,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      category_id: parsed.data.category_id ?? null,
      description: parsed.data.description ?? null,
      amount_ars: parsed.data.currency === 'ARS' ? parsed.data.amount : (amount_ars as number)
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }

  return NextResponse.json({ ok: true, data }, { headers: res.headers })
}
