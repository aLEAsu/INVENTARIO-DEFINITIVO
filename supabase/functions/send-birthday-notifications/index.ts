// Invocada por pg_cron cada hora (ver migracion 0019_enable_cron_and_net_extensions
// y el cron.schedule creado despues de desplegar esta funcion). NO usa
// verificacion de JWT de Supabase (la funcion se despliega con verify_jwt=false)
// porque quien la llama es el propio Postgres del proyecto via pg_net, no un
// usuario final -- en su lugar, se autentica con un secreto compartido
// (header "x-cron-secret") contra la variable de entorno CRON_SECRET.
//
// Modo simulacion por defecto: si WHATSAPP_SEND_MODE no es exactamente "live",
// NINGUNA llamada sale hacia Meta. Se registra igual la fila de
// notification_deliveries (para que el resto del sistema -- historial,
// idempotencia, panel -- quede probado de punta a punta) marcada como
// simulada.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Worker {
  id: string
  full_name: string
  birth_date: string
}

interface Recipient {
  id: string
  phone_e164: string
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function localDateInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') === 24 ? 0 : get('hour') }
}

function addDays(year: number, month: number, day: number, delta: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() + delta)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

function isoDate(y: number, m: number, d: number): string {
  return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
}

/** Determina si el cumpleanos de `birthDate` cae en `target` (y/m/d), aplicando la politica de 29 de febrero. */
function birthdayMatchesTarget(
  birthMonth: number,
  birthDay: number,
  target: { year: number; month: number; day: number },
  feb29Policy: 'feb_28' | 'mar_1',
): boolean {
  if (birthMonth === target.month && birthDay === target.day) return true
  if (birthMonth === 2 && birthDay === 29 && !isLeapYear(target.year)) {
    if (feb29Policy === 'feb_28' && target.month === 2 && target.day === 28) return true
    if (feb29Policy === 'mar_1' && target.month === 3 && target.day === 1) return true
  }
  return false
}

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 403 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const sendMode = Deno.env.get('WHATSAPP_SEND_MODE') === 'live' ? 'live' : 'simulation'
  const whatsappToken = Deno.env.get('WHATSAPP_TOKEN')
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('id')
  if (orgsError) return new Response(JSON.stringify({ error: orgsError.message }), { status: 500 })

  const { data: settingsRows } = await supabase.from('organization_notification_settings').select('*')
  const settingsByOrg = new Map((settingsRows ?? []).map((s) => [s.organization_id, s]))

  let processedOrgs = 0
  let deliveriesCreated = 0

  for (const org of orgs ?? []) {
    const settings = settingsByOrg.get(org.id) ?? { send_hour_local: 8, feb29_policy: 'feb_28', timezone: 'America/Bogota' }
    const local = localDateInTimeZone(new Date(), settings.timezone)
    if (local.hour !== settings.send_hour_local) continue

    processedOrgs++

    const { data: workers } = await supabase
      .from('workers')
      .select('id, full_name, birth_date')
      .eq('organization_id', org.id)
      .eq('birthday_consent', true)
      .is('deleted_at', null)
      .not('birth_date', 'is', null)

    const { data: recipients } = await supabase
      .from('birthday_notification_recipients')
      .select('id, phone_e164')
      .eq('organization_id', org.id)
      .eq('active', true)

    const { data: template } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('organization_id', org.id)
      .eq('approval_status', 'aprobada')
      .limit(1)
      .maybeSingle()

    if (!workers?.length || !recipients?.length) continue

    for (const runType of ['same_day', 'day_before'] as const) {
      const target = runType === 'same_day' ? { year: local.year, month: local.month, day: local.day } : addDays(local.year, local.month, local.day, 1)
      const runDate = isoDate(target.year, target.month, target.day)

      const { data: job } = await supabase
        .from('notification_jobs')
        .upsert({ organization_id: org.id, run_date: runDate, run_type: runType, status: 'procesando' }, { onConflict: 'organization_id,run_date,run_type', ignoreDuplicates: true })
        .select()
        .maybeSingle()

      if (!job) continue // ya existia (idempotencia a nivel de job)

      const matchingWorkers = (workers as Worker[]).filter((w) => {
        const [, m, d] = w.birth_date.split('-').map(Number)
        return birthdayMatchesTarget(m, d, target, settings.feb29_policy as 'feb_28' | 'mar_1')
      })

      for (const worker of matchingWorkers) {
        for (const recipient of recipients as Recipient[]) {
          const idempotencyKey = `${org.id}:${worker.id}:${recipient.id}:${runDate}:${runType}`

          let status = 'enviado'
          let metaResponse: Record<string, unknown> = { simulated: true, would_send_to: recipient.phone_e164, worker: worker.full_name, run_type: runType, target_date: runDate }
          let metaMessageId: string | null = null
          let errorReason: string | null = null

          if (sendMode === 'live') {
            if (!whatsappToken || !whatsappPhoneNumberId) {
              status = 'error'
              errorReason = 'WHATSAPP_SEND_MODE=live pero faltan WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID'
              metaResponse = {}
            } else {
              try {
                const resp = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${whatsappToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: recipient.phone_e164.replace('+', ''),
                    type: 'template',
                    template: { name: 'birthday_reminder', language: { code: 'es' }, components: [{ type: 'body', parameters: [{ type: 'text', text: worker.full_name }] }] },
                  }),
                })
                const body = await resp.json()
                metaResponse = body
                if (resp.ok) {
                  metaMessageId = body?.messages?.[0]?.id ?? null
                } else {
                  status = 'error'
                  errorReason = body?.error?.message ?? `HTTP ${resp.status}`
                }
              } catch (err) {
                status = 'error'
                errorReason = err instanceof Error ? err.message : 'error de red al llamar a Meta'
                metaResponse = {}
              }
            }
          }

          const { error: insertError } = await supabase
            .from('notification_deliveries')
            .upsert(
              {
                job_id: job.id,
                organization_id: org.id,
                worker_id: worker.id,
                recipient_id: recipient.id,
                template_id: template?.id ?? null,
                idempotency_key: idempotencyKey,
                status,
                meta_message_id: metaMessageId,
                meta_response: metaResponse,
                error_reason: errorReason,
              },
              { onConflict: 'idempotency_key', ignoreDuplicates: true },
            )
            .select()

          if (!insertError) deliveriesCreated++
        }
      }

      await supabase.from('notification_jobs').update({ status: 'completado', completed_at: new Date().toISOString() }).eq('id', job.id)
    }
  }

  return new Response(JSON.stringify({ sendMode, processedOrgs, deliveriesCreated }), { headers: { 'Content-Type': 'application/json' } })
})
