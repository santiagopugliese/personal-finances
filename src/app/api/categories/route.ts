import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabaseServer'

const CatSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

export async function GET() {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })

  return NextResponse.json({ data }, { headers: res.headers })
}

export async function POST(req: Request) {
  const res = new NextResponse()
  const supabase = await createSupabaseServer(res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers })

  const body = await req.json()
  const parsed = CatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: res.headers })
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: parsed.data.name, color: parsed.data.color ?? '#999999' })
    .select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
  return NextResponse.json({ data }, { headers: res.headers })
}
