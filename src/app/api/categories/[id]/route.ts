import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabaseServer'

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: res.headers })
  }

  const { data, error } = await supabase
    .from('categories')
    .update(parsed.data)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }

  return NextResponse.json({ data }, { headers: res.headers })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  }

  return NextResponse.json({ ok: true }, { headers: res.headers })
}
