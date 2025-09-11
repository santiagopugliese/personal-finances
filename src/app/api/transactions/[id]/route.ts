import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabaseServer'

const PatchSchema = z.object({
  date: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  amount_ars: z.number().nonnegative().optional(),
})

export async function PATCH(req: Request, context: unknown) {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })
  }

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: res.headers })
  }

  const { id } = (context as { params: { id: string } }).params

  const { data: current, error: currErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (currErr) {
    return NextResponse.json({ error: currErr.message }, { status: 400, headers: res.headers })
  }
  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: res.headers })
  }

  const finalDate = parsed.data.date ?? current.date
  const finalType = parsed.data.type ?? current.type
  const finalAmount = parsed.data.amount ?? Number(current.amount)
  const finalCurrency = parsed.data.currency ?? current.currency
  const finalCategoryId =
    parsed.data.category_id !== undefined ? parsed.data.category_id : current.category_id
  const finalDescription =
    parsed.data.description !== undefined ? parsed.data.description : current.description

  if (finalCategoryId) {
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('id', finalCategoryId)
      .maybeSingle()
    if (catErr || !cat) {
      return NextResponse.json({ error: 'Invalid category_id' }, { status: 400, headers: res.headers })
    }
  }

  let finalAmountArs =
    parsed.data.amount_ars !== undefined ? parsed.data.amount_ars : current.amount_ars

  const amountOrCurrencyChanged =
    parsed.data.amount !== undefined || parsed.data.currency !== undefined

  if (finalCurrency === 'ARS') {
    finalAmountArs = finalAmount
  } else if (finalAmountArs == null || amountOrCurrencyChanged) {
    const { data: rateRow, error: rateErr } = await supabase
      .from('exchange_rates')
      .select('blue_sell')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (rateErr || !rateRow?.blue_sell) {
      return NextResponse.json({ error: 'No exchange rate available' }, { status: 400, headers: res.headers })
    }
    finalAmountArs = +(finalAmount * Number(rateRow.blue_sell)).toFixed(2)
  }

  const updatePayload = {
    date: finalDate,
    type: finalType,
    amount: finalAmount,
    currency: finalCurrency,
    category_id: finalCategoryId ?? null,
    description: finalDescription ?? null,
    amount_ars: finalAmountArs,
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }
  return NextResponse.json({ ok: true, data }, { headers: res.headers })
}

export async function DELETE(_req: Request, context: unknown) {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })
  }

  const { id } = (context as { params: { id: string } }).params

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }

  return NextResponse.json({ ok: true }, { headers: res.headers })
}
