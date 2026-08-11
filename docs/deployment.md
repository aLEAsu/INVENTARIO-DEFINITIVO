# Despliegue — UNOP TI Hub

## `webapp/` (frontend)

Es una SPA estática tras el build — se puede hospedar en cualquier hosting
de archivos estáticos con soporte de rutas SPA (fallback a `index.html`).

### Build

```bash
cd webapp
npm install
npm run build   # genera webapp/dist/
```

### Variables de entorno requeridas en el build

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase de producción |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon/publishable) — **nunca** `service_role` |

Estas quedan **embebidas en el bundle público** en tiempo de build (es
normal y seguro para la anon key, ya que toda protección real la da RLS).
Configúralas como variables de entorno del proveedor de hosting elegido
(no como secretos — terminan en el HTML/JS servido de todas formas).

### Hosting

Cualquier host de estáticos funciona (Netlify, Vercel, Cloudflare Pages, un
bucket S3+CloudFront, o un servidor IIS/nginx propio de la clínica). Checklist:

- Servir `webapp/dist/` completo.
- Configurar **fallback SPA**: cualquier ruta no encontrada (`/inventario`,
  `/incidentes/xyz`, etc.) debe servir `index.html` (React Router maneja el
  resto en el cliente). Sin esto, refrescar la página en una ruta interna
  da 404.
- HTTPS obligatorio (la PWA y el Service Worker no se registran en HTTP
  salvo `localhost`).
- El `manifest.webmanifest` generado por `vite-plugin-pwa` ya trae el
  branding correcto ("UNOP TI Hub") — no requiere configuración adicional.

### Checklist de producción en Supabase

- [ ] Las 28 migraciones de `supabase/migrations/` aplicadas (verificar con
      `list_migrations` o `supabase migration list`).
- [ ] Bucket `attachments` existe y es **privado**.
- [ ] `CRON_SECRET` configurado como secreto de Edge Function (ver
      `docs/whatsapp-setup.md`).
- [ ] "Leaked password protection" habilitado en Authentication → Policies.
- [ ] `WHATSAPP_SEND_MODE` **ausente o `simulation`** hasta que el envío
      real esté probado end-to-end (default seguro, no hace falta tocarlo
      para quedarse en simulación).
- [ ] Backups automáticos de Supabase activos (plan Pro+ los incluye; en
      Free, exportar manualmente antes de cambios grandes — ver `runbook.md`).

## Edge Functions

Se despliegan con la Supabase CLI o el MCP de Supabase (como se hizo en
este proyecto). Cualquier cambio a `supabase/functions/*/index.ts` o a
`supabase/functions/_shared/*` requiere re-desplegar la función que lo usa:

```bash
supabase functions deploy send-birthday-notifications --no-verify-jwt
supabase functions deploy whatsapp-webhook --no-verify-jwt
```
