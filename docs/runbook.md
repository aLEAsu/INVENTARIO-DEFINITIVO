# Runbook de operación y recuperación ante fallos — UNOP TI Hub

## Backups

- **Supabase gestiona backups automáticos** en planes de pago (point-in-time
  recovery). En plan Free no hay backups automáticos — exporta manualmente
  antes de cambios grandes:
  ```sql
  -- Desde el SQL Editor, o con pg_dump si tienes la connection string:
  -- Project Settings → Database → Connection string
  ```
  ```bash
  pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup-$(date +%Y%m%d).sql
  ```
- **Adjuntos en Storage**: no están incluidos en un `pg_dump` de la base de
  datos. Para respaldarlos, usar el dashboard de Storage o la API de
  Supabase para descargar el contenido del bucket `attachments`.
- **App legacy**: cada usuario puede exportar un JSON de respaldo desde
  **Configuración → Copia de seguridad** — independiente de Supabase.

## Restauración

1. Si Supabase tiene point-in-time recovery habilitado: **Project Settings
   → Database → Backups** → elegir punto en el tiempo → restaurar (crea un
   proyecto nuevo o restaura in-place según el plan).
2. Si es restauración manual desde `pg_dump`:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup-YYYYMMDD.sql
   ```
3. Tras cualquier restauración, correr
   [`supabase/tests/rls_smoke_tests.sql`](../supabase/tests/rls_smoke_tests.sql)
   para confirmar que RLS sigue intacto antes de dar el sistema por
   recuperado.

## Si una migración falla a mitad de camino

Cada migración en `supabase/migrations/` fue escrita para ser **idempotente**
donde es viable (`create table if not exists`, `create index if not
exists`, `drop policy if exists` antes de recrear) — reintentar la misma
migración normalmente es seguro. Si aun así falla:

1. Revisar el mensaje de error exacto — casi siempre indica qué objeto ya
   existe o qué falta.
2. `select * from supabase_migrations.schema_migrations order by version
   desc limit 5;` para ver qué quedó registrado como aplicado.
3. Si la migración modificó datos (no solo esquema) y falló a mitad de
   camino, Postgres ya revirtió automáticamente esa transacción — no queda
   estado intermedio corrupto (cada migración corre en una sola transacción
   implícita).
4. Corregir el SQL del archivo, y volver a aplicarlo.

## Rotación de claves si se filtran

- **Anon/publishable key filtrada**: es pública por diseño (embebida en el
  frontend) — no requiere rotación de emergencia, pero si se sospecha abuso,
  puede regenerarse desde **Project Settings → API** (requiere actualizar
  `VITE_SUPABASE_ANON_KEY` en el build del frontend).
- **`service_role` key filtrada**: **crítico** — esa clave bypassa RLS
  completamente. Regenerar inmediatamente desde **Project Settings → API**,
  y actualizar el secreto en cualquier Edge Function que la use
  explícitamente (aunque `SUPABASE_SERVICE_ROLE_KEY` se inyecta
  automáticamente, así que solo hace falta el redeploy, no reconfigurar).
- **`CRON_SECRET` / `WHATSAPP_APP_SECRET` / `WHATSAPP_TOKEN` filtrados**:
  regenerar el valor (nuevo secreto aleatorio o nuevo token desde Meta),
  actualizar en **Edge Functions → Secrets**, y si es `CRON_SECRET`, también
  actualizar el valor almacenado en Vault (`select vault.update_secret(...)`
  o recrear con `vault.create_secret` y actualizar el `cron.schedule` para
  referenciarlo).

## Revertir un despliegue del frontend

Al ser un build estático versionado en git, revertir es:
```bash
git revert <commit-del-cambio-problematico>
# o, si el hosting guarda builds anteriores, simplemente re-apuntar al
# deploy previo desde el dashboard del proveedor de hosting.
```
Las migraciones de base de datos **no se revierten automáticamente** con un
`git revert` del frontend — son independientes. Si el problema es de datos,
usar la sección de restauración arriba.

## Si el cron de cumpleaños deja de disparar

1. Verificar que el job existe: `select * from cron.job where jobname =
   'send-birthday-notifications-hourly';`
2. Verificar las últimas ejecuciones: `select * from cron.job_run_details
   order by start_time desc limit 10;`
3. Si el `CRON_SECRET` cambió sin actualizar Vault, la función responderá
   403 — ver logs de la Edge Function (**Edge Functions → send-birthday-notifications → Logs**).

## Contacto de emergencia / escalamiento

Este runbook asume que quien opera el sistema tiene acceso al dashboard de
Supabase del proyecto (`otjoywhmbddrspvyghcr`) y a este repositorio. No hay
un proveedor externo de soporte contratado — todo el soporte es interno del
área de TI de UNOP.
