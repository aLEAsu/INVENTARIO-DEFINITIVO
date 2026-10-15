# UNOP TI Hub

Frontend (React + TypeScript + Vite) del proyecto **UNOP TI Hub**: una
plataforma modular para gestión de Inventario, Trabajadores/Cumpleaños e
Incidentes/Comunicación TI. Ver [`webapp/README.md`](webapp/README.md)
para instalarlo y correrlo.

El esquema de base de datos vive versionado en
[`supabase/migrations/`](supabase/migrations/) (ver esa carpeta para el
historial completo); `supabase/schema.sql` se conserva solo como
referencia histórica del esquema original y ya no debe usarse para
configurar un proyecto nuevo — usa las migraciones.

## Estado del proyecto (Fases 1-4 y 6 completas + pivote multi-trabajo)

`webapp/` implementa los 3 módulos funcionales del pedido original
(Inventario, Trabajadores/Cumpleaños con WhatsApp en modo simulación, e
Incidentes/Comunicación TI). El **Módulo 3 (agente de monitoreo de puertos
en Windows) no se implementó**, por decisión explícita del usuario de saltar
esa fase.

Desde las migraciones 0030-0032, el sistema dejó de ser un tenant único
(UNOP) para ser una herramienta multi-trabajo: un ingeniero puede crear
varios "trabajos" (organizaciones) bajo una sola cuenta, cambiar entre ellos
desde el header, y arrancar cada uno a partir de un **blueprint de oficio**
(categorías + campos personalizados + categorías de incidente reutilizables).
Ver [`docs/architecture.md`](docs/architecture.md#multi-trabajo-y-blueprints-de-oficio-migraciones-0030-0032)
para el detalle. Documentación completa del proyecto:

| Documento | Contenido |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura, diagramas Mermaid, ERD, decisiones técnicas. |
| [`docs/roles-matrix.md`](docs/roles-matrix.md) | Matriz formal de roles y permisos. |
| [`docs/traceability-matrix.md`](docs/traceability-matrix.md) | Cada requisito original vs. su estado, con las 5 revisiones por módulo y hallazgos reales. |
| [`docs/supabase-setup.md`](docs/supabase-setup.md) | Levantar un proyecto Supabase nuevo desde cero. |
| [`docs/deployment.md`](docs/deployment.md) | Build y despliegue de `webapp/`, checklist de producción. |
| [`docs/runbook.md`](docs/runbook.md) | Backups, restauración, rotación de claves, recuperación ante fallos. |
| [`docs/whatsapp-setup.md`](docs/whatsapp-setup.md) | Configuración de Meta WhatsApp Business Cloud API, paso a paso. |
| [`supabase/tests/rls_smoke_tests.sql`](supabase/tests/rls_smoke_tests.sql) | Pruebas de RLS reejecutables contra el proyecto real. |

## Configurar el respaldo en Supabase

Para un proyecto Supabase nuevo, aplica las migraciones de
[`supabase/migrations/`](supabase/migrations/) en orden (con la CLI de
Supabase o pegándolas una por una en el SQL Editor) — no uses `schema.sql`,
que quedó desactualizado tras la Fase 1. Ver
[`docs/supabase-setup.md`](docs/supabase-setup.md) para el procedimiento
completo.

## Estructura

| Archivo | Propósito |
|---|---|
| `webapp/` | App (React + TS + Vite) — UNOP TI Hub. |
| `supabase/schema.sql` | Esquema original — referencia histórica, ya no usar para setup nuevo. |
| `supabase/migrations/` | Historial real y versionado del esquema de base de datos. |
| `supabase/functions/` | Edge Functions (notificaciones de cumpleaños, webhook de WhatsApp). |
| `docs/` | Documentación de arquitectura, roles, despliegue y operación. |
