# Matriz de roles y permisos — UNOP TI Hub

Fuente de verdad en la aplicación: [`webapp/src/core/rbac.ts`](../webapp/src/core/rbac.ts)
(matriz usada por la UI para mostrar/ocultar acciones). La aplicación real
de estos permisos ocurre en las **policies de RLS** de cada tabla en
`supabase/migrations/`, no solo en el frontend — la matriz de abajo es la
intención de diseño; el detalle exacto de cada policy está en la migración
correspondiente.

## Roles

| Rol | Equivale a (pedido original) | Descripción |
|---|---|---|
| `owner` | Administrador / Propietario | Control total de la organización. |
| `admin_ti` | Administrador TI | Gestión completa de inventario, incidentes y configuración de notificaciones; escritura (no admin) en trabajadores. |
| `tecnico_ti` | Ingeniero TI | Operación diaria: inventario, incidentes, red — sin gestión de catálogos/miembros. |
| `talento_humano` | Talento Humano | Gestión completa de trabajadores (incluye año de nacimiento); solo lectura del resto. |
| `lector` | Lector | Solo lectura en todos los módulos. |
| `colaborador` | Colaborador | Reporta y comenta incidentes; sin acceso de escritura a inventario/trabajadores. |

## Matriz por módulo

`none` < `read` < `write` < `admin` (cada nivel incluye los anteriores).

| Módulo | owner | admin_ti | tecnico_ti | talento_humano | lector | colaborador |
|---|---|---|---|---|---|---|
| Tablero | read | read | read | read | read | read |
| Inventario (activos, mantenimiento, stock, conteo físico, catálogos) | admin | admin | write | read | read | none |
| Trabajadores (directorio, cumpleaños) | admin | write | read | admin | read | none |
| Monitor de puertos (Fase 5, no implementado) | admin | admin | write | none | read | none |
| Incidentes | admin | admin | write | read | read | write* |

`*` **Excepción documentada**: `colaborador` tiene nivel `write` en
incidentes en la matriz de la UI, pero la policy real de Postgres
(`incidents_org_update`, migración `0024`) **solo permite `insert`** a
`colaborador` — no puede cambiar estado, prioridad, ni cerrar un incidente
(eso requiere `owner`/`admin_ti`/`tecnico_ti`, ver `incidents_org_update`).
Verificado con prueba de RLS real (ver `supabase/tests/rls_smoke_tests.sql`,
bloque 4): un `colaborador` pudo reportar y comentar, pero su intento de
`UPDATE status='cerrado'` fue bloqueado (0 filas afectadas).

## Excepciones de RLS más allá de la matriz de módulos

Estas reglas **no** están expresadas como nivel de módulo en `rbac.ts`
porque son más finas que "leer/escribir un módulo completo":

| Regla | Dónde vive | Quién pasa |
|---|---|---|
| Año de nacimiento completo de un trabajador | Vista `worker_birthday_calendar` (migración `0016`) | Solo `owner`, `admin_ti`, `talento_humano`. El resto ve únicamente día/mes. |
| Comentarios internos de un incidente (`visibility='interno'`) | `incident_updates_read` (migración `0025`) | Solo `owner`, `admin_ti`, `tecnico_ti`. |
| Insertar comentario en un incidente | `incident_updates_insert` | `owner`, `admin_ti`, `tecnico_ti`, `colaborador` (no `lector` ni `talento_humano`). |
| Gestión de miembros de la organización | `org_members_manage` (migración `0002`) | Solo `owner`, `admin_ti`. |
| Suscripción a un incidente | `incident_subscribers_own_write` | Cada usuario administra únicamente su propia fila. |
| Escritura en `audit_log`, `notification_jobs`, `notification_deliveries` | Sin policy de insert/update para clientes | Nadie desde el cliente — solo las Edge Functions con `service_role` (para notificaciones) o el trigger `fn_audit_row` (para auditoría). |

## Multi-organización

Todas las tablas de negocio tienen `organization_id` y una policy base
`is_org_member(organization_id)` — un usuario nunca ve ni escribe datos de
una organización de la que no es miembro (`organization_members`),
independientemente de su rol. Verificado repetidamente en cada fase con un
usuario ajeno de prueba (ver `supabase/tests/rls_smoke_tests.sql`, bloque 1).
