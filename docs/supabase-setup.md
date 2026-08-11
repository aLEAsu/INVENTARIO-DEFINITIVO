# Configurar un proyecto Supabase desde cero — UNOP TI Hub

Esta guía es para levantar un proyecto Supabase **nuevo** (por ejemplo, para
un ambiente de staging separado del real). Si vas a seguir usando el
proyecto ya existente (`otjoywhmbddrspvyghcr`), no necesitas nada de esto:
ya tiene las 28 migraciones aplicadas.

## 1. Crear el proyecto

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Elige región cercana (p. ej. `us-west-2` o la más cercana a Colombia
   disponible). Guarda la contraseña de base de datos generada.

## 2. Aplicar las migraciones en orden

Todas están en [`supabase/migrations/`](../supabase/migrations/), numeradas
`0001` a `0028`. Deben aplicarse **en orden** (cada una asume que las
anteriores ya corrieron).

**Opción A — Supabase CLI** (recomendada si tienes Docker/CLI instalados):
```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

**Opción B — SQL Editor manual**: abre cada archivo de
`supabase/migrations/` en orden numérico, pega su contenido completo en
**SQL Editor → New query**, y ejecuta uno por uno. No saltar ninguno: hay
dependencias entre ellas (funciones, columnas, extensiones).

**Extensiones**: las migraciones `0019` habilitan `pg_cron` y `pg_net`
automáticamente (`create extension if not exists`). Si tu plan de Supabase
no las tiene disponibles, esa migración fallará — en ese caso, el módulo de
notificaciones WhatsApp no podrá programarse por cron (se puede invocar la
Edge Function manualmente igual).

## 3. Bucket de Storage

La migración `0012_attachments.sql` ya crea el bucket `attachments`
(privado) y sus policies. Verifica en **Storage** del dashboard que
aparezca — si por algún motivo no se creó, créalo manualmente como
**privado** con el mismo nombre exacto `attachments` y vuelve a aplicar la
sección de policies de esa migración.

## 4. Autenticación

1. **Authentication → Providers → Email**: verifica que esté habilitado.
2. **Authentication → Policies → Password**: habilita "Leaked password
   protection" (no se puede activar por SQL/API — ver `docs/traceability-matrix.md`,
   es un riesgo pendiente conocido en el proyecto actual).
3. **Authentication → Users → Add user**: crea el primer usuario
   (marca *Auto Confirm User*).

## 5. Crear la primera organización y hacerte owner

Con el usuario ya creado, en el **SQL Editor**:
```sql
insert into public.organizations (name) values ('Tu Organización')
returning id; -- copia este id

insert into public.organization_members (organization_id, user_id, role)
values ('EL_ID_COPIADO', 'EL_USER_ID_DEL_USUARIO_CREADO', 'owner');
```
El `user_id` del usuario se ve en **Authentication → Users**.

## 6. Deploy de las Edge Functions

Con la CLI de Supabase:
```bash
supabase functions deploy send-birthday-notifications --no-verify-jwt
supabase functions deploy whatsapp-webhook --no-verify-jwt
```
(`--no-verify-jwt` porque ambas implementan su propia autenticación —
secreto compartido y firma HMAC respectivamente, ver comentarios en cada
`index.ts`).

## 7. Configurar el cron y sus secretos

Ver [`docs/whatsapp-setup.md`](whatsapp-setup.md), sección "Paso 0" — genera
el secreto en Vault, programa el `cron.schedule`, y configura `CRON_SECRET`
como secreto de Edge Function con el mismo valor.

## 8. Variables de entorno del frontend

Copia `webapp/.env.example` a `webapp/.env.local` y completa con la
**Project URL** y la **anon/publishable key** de tu nuevo proyecto
(**Project Settings → API**). Nunca la `service_role key` aquí.

## Verificación final

- `select * from public.organizations;` devuelve tu organización.
- Login en la app con el usuario creado, deberías ver el tablero.
- Correr [`supabase/tests/rls_smoke_tests.sql`](../supabase/tests/rls_smoke_tests.sql)
  completo para confirmar que RLS quedó igual de bien configurado que en el
  proyecto original.
