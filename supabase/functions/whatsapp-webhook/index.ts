// Webhook publico de Meta (WhatsApp Business Cloud API). Se despliega con
// verify_jwt=false porque Meta no envia un JWT de Supabase -- la seguridad
// es propia del protocolo de Meta: el GET valida un verify_token compartido
// (handshake de suscripcion) y el POST valida la firma HMAC-SHA256
// (X-Hub-Signature-256) contra WHATSAPP_APP_SECRET antes de tocar la base
// de datos. Sin esas variables configuradas, la funcion rechaza todo.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expectedHex = signatureHeader.slice('sha256='.length)

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (computedHex.length !== expectedHex.length) return false
  let diff = 0
  for (let i = 0; i < computedHex.length; i++) diff |= computedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  return diff === 0
}

const STATUS_MAP: Record<string, string> = { sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'error' }

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (verifyToken && mode === 'subscribe' && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('forbidden', { status: 403 })
  }

  if (req.method === 'POST') {
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET')
    const rawBody = await req.text()

    if (!appSecret || !(await verifySignature(rawBody, req.headers.get('x-hub-signature-256'), appSecret))) {
      return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 401 })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    try {
      const payload = JSON.parse(rawBody)
      const statuses = payload?.entry?.flatMap((e: { changes?: { value?: { statuses?: unknown[] } }[] }) => e.changes?.flatMap((c) => c.value?.statuses ?? []) ?? []) ?? []

      for (const s of statuses as { id: string; status: string; errors?: { title?: string }[] }[]) {
        const mapped = STATUS_MAP[s.status]
        if (!mapped) continue
        await supabase
          .from('notification_deliveries')
          .update({ status: mapped, error_reason: s.errors?.[0]?.title ?? null, updated_at: new Date().toISOString() })
          .eq('meta_message_id', s.id)
      }
    } catch {
      // Cuerpo no valido: Meta espera 200 igual para no reintentar indefinidamente,
      // pero no se procesa ni se toca la base de datos mas alla de lo ya hecho.
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  return new Response('method not allowed', { status: 405 })
})
