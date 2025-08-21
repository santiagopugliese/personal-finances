import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    // 1) Fetch blue
    const r = await fetch('https://api.bluelytics.com.ar/v2/latest', { headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`bluelytics status ${r.status}`)
    const j = await r.json()
    const sell = j?.blue?.value_sell
    if (!sell) throw new Error('blue.value_sell not found')

    // 2) Admin client
    const url = Deno.env.get('PROJECT_URL')!
    const service = Deno.env.get('SERVICE_ROLE_KEY')!
    const admin = createClient(url, service)

    // 3) Date in ART
    const rateDateART = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date()) // YYYY-MM-DD

    // 4) Upsert by PK (rate_date)
    const { error } = await admin
      .from('exchange_rates')
      .upsert({ rate_date: rateDateART, blue_sell: sell }, { onConflict: 'rate_date' })

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, rate_date: rateDateART, blue_sell: sell }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
