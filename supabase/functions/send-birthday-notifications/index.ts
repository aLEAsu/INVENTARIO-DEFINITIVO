// Invocada por pg_cron cada hora (ver migracion 0019_enable_cron_and_net_extensions
// y el cron.schedule creado despues de desplegar esta funcion). NO usa
// verificacion de JWT de Supabase (la funcion se despliega con verify_jwt=false)
// porque quien la llama es el propio Postgres del proyecto via pg_net, no un
// usuario final -- en su lugar, se autentica con un secreto compartido
// (header "x-cron-secret") contra la variable de entorno CRON_SECRET.
//
// Envio real via CallMeBot (https://www.callmebot.com), no la API de WhatsApp
// Business Cloud de Meta: gratuito, sin cuenta de empresa ni plantillas
// aprobadas, pero no oficial -- cada destinatario debe registrar su propio
// numero con CallMeBot una vez (ver docs/whatsapp-setup.md) y guardar su
// apikey en birthday_notification_recipients.callmebot_apikey. Sin ese apikey,
// el envio para ese destinatario queda marcado como error, no se intenta.
//
// Modo simulacion por defecto: si WHATSAPP_SEND_MODE no es exactamente "live",
// NINGUNA llamada sale hacia CallMeBot. Se registra igual la fila de
// notification_deliveries (para que el resto del sistema -- historial,
// idempotencia, panel -- quede probado de punta a punta) marcada como
// simulada.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { addDays, birthdayMatchesTarget, isoDate, localDateInTimeZone } from '../_shared/date-utils.ts'

interface Worker {
  id: string
  full_name: string
  birth_date: string
}

interface Recipient {
  id: string
  phone_e164: string
  callmebot_apikey: string | null
}

function birthdayMessage(workerName: string, runType: 'same_day' | 'day_before'): string {
  return runType === 'same_day'
    ? `🎂 ¡Hoy es el cumpleaños de ${workerName}! No olvides saludarlo.`
    : `🎂 Mañana es el cumpleaños de ${workerName}. ¡Prepara tu saludo!`
}

/** Pausa breve entre envios en vivo: CallMeBot limita la frecuencia de
 * mensajes por numero destinatario y no conviene disparar todos de golpe. */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('id')
  if (orgsError) return new Response(JSON.stringify({ error: orgsError.message }), { status: 500 })

  const { data: settingsRows } = await supabase.from('organization_notification_settings').select('*')
  const settingsByOrg = new Map((settingsRows ?? []).map((s) => [s.organization_id, s]))

  let processedOrgs = 0
  let deliveriesCreated = 0
  let liveSendsAttempted = 0

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
      .select('id, phone_e164, callmebot_apikey')
      .eq('organization_id', org.id)
      .eq('active', true)

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
          const text = birthdayMessage(worker.full_name, runType)

          let status = 'enviado'
          let providerResponse: Record<string, unknown> = { simulated: true, would_send_to: recipient.phone_e164, text, run_type: runType, target_date: runDate }
          let errorReason: string | null = null

          if (sendMode === 'live') {
            if (!recipient.callmebot_apikey) {
              status = 'error'
              errorReason = 'Falta configurar el apikey de CallMeBot de este destinatario (Trabajadores -> Notificaciones).'
              providerResponse = {}
            } else {
              try {
                if (liveSendsAttempted > 0) await sleep(2000)
                liveSendsAttempted++

                const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(recipient.phone_e164)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(recipient.callmebot_apikey)}`
                const resp = await fetch(url, { method: 'GET' })
                const bodyText = await resp.text()
                providerResponse = { raw: bodyText, http_status: resp.status }

                if (resp.ok && /queued|sent|success/i.test(bodyText)) {
                  status = 'enviado'
                } else {
                  status = 'error'
                  errorReason = bodyText.slice(0, 300)
                }
              } catch (err) {
                status = 'error'
                errorReason = err instanceof Error ? err.message : 'error de red al llamar a CallMeBot'
                providerResponse = {}
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
                idempotency_key: idempotencyKey,
                status,
                meta_response: providerResponse,
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
