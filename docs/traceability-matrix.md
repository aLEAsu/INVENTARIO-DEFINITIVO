# Matriz de trazabilidad — UNOP TI Hub

Recorre cada requisito de la especificación original y su estado, más la
checklist de las **5 revisiones obligatorias** (funcional, seguridad/privacidad,
datos, técnica, operación) aplicada a cada módulo antes de darlo por
terminado. Los hallazgos reales encontrados durante esas revisiones y su
resolución están citados explícitamente — esta matriz no es una lista de
intenciones, es un registro de lo que se verificó y lo que se corrigió.

Leyenda: ✅ implementado · 🟡 decisión explícita (simplificación consciente,
documentada) · ⛔ fuera de alcance por decisión del usuario.

---

## Fase 0-1 — Fundaciones

| Requisito | Estado | Evidencia |
|---|---|---|
| Auditar repositorio actual sin perder datos | ✅ | Auditoría inicial completa (IndexedDB `unop-activo-db`, Supabase `schema.sql`) antes de tocar código. |
| Arquitectura React+TS+Vite+PWA | ✅ | `webapp/` completo, PWA vía `vite-plugin-pwa`. |
| Migraciones SQL versionadas (nunca script manual sin historial) | ✅ | 28 archivos en `supabase/migrations/`, todas aplicadas y registradas en `supabase_migrations.schema_migrations`. |
| Organizaciones, roles, RLS, auditoría | ✅ | `organizations`, `organization_members`, `rbac.ts`, `audit_log` + trigger genérico. |
| Migración segura desde IndexedDB y Supabase existentes | ✅ | Dexie v1→v2 con reparación de huérfanos; backfill SQL de `assets`/`movements`/`maintenance` a organización por defecto, verificado con conteos antes/después. |
| No usar `service_role` en frontend | ✅ | Verificado por grep — solo aparece en Edge Functions vía `Deno.env.get`. |

## Módulo 1 — Inventario y Activos

| Requisito | Estado | Evidencia |
|---|---|---|
| Organizaciones, sedes, áreas, ubicaciones, categorías/subcategorías | ✅ | `sites`, `locations`, `areas`, `categories` (con `parent_id`). |
| Activos: código, QR, serial, marca, modelo, proveedor, factura, garantía, costo, estado, condición, responsable, ubicación | ✅ | Tabla `assets` ampliada (migración `0010`); QR vía `core/qr.ts`. |
| Adjuntos y fotografías en Storage | ✅ | Tabla `attachments` + bucket privado `attachments`. |
| Historial inalterable (altas, bajas, asignaciones, traslados, mantenimientos) | ✅ | `asset_events` vía `audit_log` + `asset_assignments` + `movements` + `maintenance`, timeline unificado en `AssetDetailPage`. |
| Asignación vinculada a trabajadores reales | ✅ | `asset_assignments` FK `workers`, reemplaza el texto libre legacy. |
| Mantenimientos preventivos/correctivos con diagnóstico, repuestos, próxima fecha | ✅ | `maintenance` ampliada (migración `0013`). |
| Inventario físico QR con diferencias y acta | ✅ | `physical_counts`/`physical_count_items`, `PhysicalCountPage.tsx`. |
| Consumibles: entradas/salidas, mínimos, alertas | ✅ | `inventory_items`/`stock_movements`, alerta visual bajo mínimo. |
| Exportaciones CSV/XLSX/PDF filtradas | ✅ | `write-excel-file` + `jspdf-autotable` en listado y reportes. |
| Búsqueda, filtros, paginación, vista móvil | ✅ | `AssetsListPage.tsx` (paginación cliente, tarjetas <640px). |
| Eliminación lógica, trazabilidad preservada | ✅ | `deleted_at` en `assets`; UI ofrece "dar de baja", no borrado duro. |
| Validación de código/serial duplicado | ✅ | `unique(organization_id, code)` y `unique(organization_id, serial)` + validación en formulario. |
| Sincronización offline con cola y visualización de pendientes | 🟡 | Solo `assets` tiene caché Dexie + `outbox` (heredado de la app legacy). Catálogos/mantenimiento/stock/conteo físico/adjuntos son online-first — decisión documentada en `webapp/README.md` por alcance de tiempo, revisable a futuro. |

**5 revisiones — Módulo 1:**
1. **Funcional**: todos los requisitos arriba tienen implementación o decisión explícita. ✅
2. **Seguridad/privacidad**: RLS probada con usuario ajeno (0 filas) y con escritura cruzada entre organizaciones (bloqueada). Bucket de Storage privado con policy por carpeta `organization_id`.
3. **Datos**: backfill de catálogos desde texto legacy verificado fila por fila (activo real `UNOP-822096` quedó correctamente vinculado). Constraints de unicidad verificados.
4. **Técnica**: `npm run build`/`npm run test` en verde en cada fase; TypeScript estricto.
5. **Operación**: exportación/backup vía `pg_dump` documentado en `runbook.md`; sin agente de monitoreo propio para este módulo (no aplica).

## Módulo 2 — Trabajadores y Cumpleaños

| Requisito | Estado | Evidencia |
|---|---|---|
| Datos mínimos de personal (no nómina completa) | ✅ | Tabla `workers`. |
| Día/mes por defecto, año protegido por permisos | ✅ | Vista `worker_birthday_calendar` con `security_invoker`; verificado con RLS real (`lector` vs `owner`). |
| Consentimiento para usar el nombre en recordatorios | ✅ | `birthday_consent`, checkbox explícito en el formulario. |
| Importación/exportación segura | ✅ | CSV (no XLSX, para no reintroducir el riesgo de parseo evitado en Módulo 1), validación fila por fila. |
| Calendario mensual y próximos cumpleaños | ✅ | `BirthdaysPage.tsx`. |
| Vista de permisos (administrador, talento humano, ingeniero TI, lector) | ✅ | Matriz de roles, ver `docs/roles-matrix.md`. |
| Destinatarios WhatsApp E.164, uno o varios | ✅ | `birthday_notification_recipients`, check constraint de formato E.164. |
| Recordatorio 1 día antes y el mismo día, hora configurable, America/Bogota | ✅ | `organization_notification_settings.send_hour_local`, cron horario evalúa `same_day`/`day_before`. |
| Plantillas aprobadas de Meta (nombre, idioma, variables, estado) | ✅ | `notification_templates`. |
| Registro de envío con idempotency key, respuesta de Meta, estado, reintentos, motivo de error | ✅ | `notification_deliveries`. |
| Webhook de estados validado | ✅ | `whatsapp-webhook`, valida firma HMAC-SHA256 antes de procesar. |
| Cero duplicados aunque el cron corra más de una vez | ✅ | Doble barrera: `unique(organization_id, run_date, run_type)` en jobs + `unique(idempotency_key)` en deliveries. Verificado con inserción doble real (solo 1 fila persistió). |
| Comportamiento configurable para 29 de febrero | ✅ | `feb29_policy` (`feb_28`/`mar_1`), probado con casos límite (Node + lógica compartida en `date-utils.ts`). |
| Modo simulación obligatorio hasta habilitación explícita | ✅ | `WHATSAPP_SEND_MODE` default `simulation`; verificado en logs reales (403 sin `CRON_SECRET`, ninguna llamada a Meta posible sin configuración explícita). |
| Edge Function + Cron diario documentados | ✅ | `send-birthday-notifications` + `pg_cron`/`pg_net`, `docs/whatsapp-setup.md`. |

**5 revisiones — Módulo 2:**
1. **Funcional**: completo según tabla arriba.
2. **Seguridad/privacidad**: año de nacimiento protegido a nivel de dato (no solo UI) — hallazgo de diseño anticipado y resuelto con `security_invoker` + `has_org_role` en la vista. Webhook rechaza payloads sin firma válida.
3. **Datos**: idempotencia verificada con inserción real duplicada (bloqueada por constraint). Folio/contador de jobs por `(organization_id, run_date, run_type)` evita reprocesar el mismo día dos veces.
4. **Técnica**: lógica de fechas extraída a `_shared/date-utils.ts` y verificada (17 casos, incluye el límite de 29 de febrero en año bisiesto y no bisiesto). Deno no estaba disponible en el entorno de desarrollo — la lógica se verificó con un harness Node equivalente; **pendiente**: correr `deno test` formalmente la primera vez que haya un entorno con Deno disponible.
5. **Operación**: `CRON_SECRET` generado y el cron ya corre cada hora, pero **requiere que el usuario configure el secreto en Edge Function Settings** (no hay herramienta para hacerlo automáticamente) — riesgo pendiente documentado en `docs/whatsapp-setup.md` paso 0.

## Módulo 3 — Monitor de Puertos (Windows)

⛔ **No implementado.** El usuario decidió explícitamente saltar la Fase 5
("SALTEMOS LA FASE 5 PASEMOS A LA FASE 6") y pasar directo al cierre del
proyecto. No existe agente .NET, ni tablas `local_agents`/`port_snapshots`/
`network_endpoints`/`network_actions` en el esquema. Esto es una decisión
del usuario registrada en la conversación, no una funcionalidad simulada o
a medio construir.

## Módulo 4 — Incidentes y Comunicación TI

| Requisito | Estado | Evidencia |
|---|---|---|
| Tipos (incidente, solicitud, problema, cambio, mantenimiento, aviso) | ✅ | `incidents.type` check constraint. |
| Categorías configurables | ✅ | `incident_categories`, sembrada con las 10 del pedido. |
| Prioridades P1-P4, impacto, urgencia, usuarios afectados, servicio/activo afectado | ✅ | Columnas en `incidents`. |
| Flujo de estados completo | ✅ | `nuevo→clasificado→en_progreso→en_espera→resuelto→cerrado`/`reabierto`. |
| Folio consecutivo legible `INC-2026-0001` | ✅ | `private.next_incident_folio()`, upsert atómico. Verificado sin colisión con creación secuencial real. |
| Bitácora con responsables, comentarios internos y públicos | ✅ | `incident_updates.visibility`, RLS diferenciada verificada con `colaborador`. |
| Adjuntos y evidencia | ✅ | `attachments` con `entity_type='incident'`. |
| Suscriptores y avisos internos de cambio de estado | 🟡 | `incident_subscribers` implementado (suscripción propia + `last_seen_at`). Avisos son in-app (contador de no vistos), **no** hay canal de email/push externo — no se pidió explícitamente infraestructura de notificación push y se consideró fuera del alcance razonable de esta fase. |
| Relación con activos, trabajadores, servicios, novedades repetidas | ✅ | FKs `asset_id`/`worker_id`/`service_id`; `parent_incident_id` agrupa incidentes bajo un problema. |
| P1/P2: timeline, causa raíz, solución, acciones preventivas, responsable, fecha compromiso | ✅ | Banner distintivo + campos dedicados + `incident_actions`. |
| Base de conocimiento | ✅ | `kb_articles`, `KnowledgeBasePage.tsx`. |
| Panel de estado sin información sensible | ✅ | `listPublicStatusSnapshot()` — consulta acotada explícitamente a folio/categoría/prioridad/estado/fecha, sin descripción ni datos del reportante. |
| Informes con tiempos de atención/resolución y reincidencias | ✅ | `IncidentReportsPage.tsx`. |
| No confundir incidente con problema | ✅ | `type='problema'` + `parent_incident_id` para agrupar incidentes repetidos bajo un problema. |

**5 revisiones — Módulo 4:**
1. **Funcional**: completo según tabla arriba, con la salvedad documentada de avisos in-app (no push externo).
2. **Seguridad/privacidad**: verificado con RLS real que `colaborador` reporta/comenta pero no reclasifica ni cierra; que solo ve comentarios públicos; que el panel de estado nunca trae columnas sensibles (verificado por diseño de la query, no solo por ocultar en UI).
3. **Datos**: folios verificados sin colisión con dos inserciones secuenciales reales. Auditoría (`audit_log`) cubre `incidents` igual que el resto de tablas mutables.
4. **Técnica**: build/test en verde.
5. **Operación**: sin dependencias operativas nuevas más allá de lo ya cubierto por `runbook.md`.

## Fase 6 — Cierre

| Requisito | Estado |
|---|---|
| Pruebas unitarias | ✅ `webapp` (7 tests Vitest) + `date-utils.test.ts` (Deno, verificado equivalente en Node por falta de Deno CLI en el entorno). |
| Pruebas de integración | 🟡 No hay suite de integración automatizada (requeriría un entorno CI con Supabase local o secretos de proyecto real, fuera del alcance de esta sesión). Cubierto en su lugar por `rls_smoke_tests.sql`, que ejercita flujos reales de extremo a extremo contra la base real. |
| Pruebas de RLS | ✅ `supabase/tests/rls_smoke_tests.sql`, 7 bloques, ejecutados y verificados contra el proyecto real en esta sesión. |
| Documentación completa | ✅ Este archivo + `architecture.md`, `roles-matrix.md`, `supabase-setup.md`, `deployment.md`, `runbook.md`, `whatsapp-setup.md`. |
| Endurecimiento de seguridad | ✅ Barrido de RLS en las 31 tablas (ninguna sin política involuntaria), 3 policies optimizadas (`auth_rls_initplan`), advisors revisados. |

## Riesgos pendientes (requieren acción del usuario, no de código)

1. **"Leaked password protection" desactivado** en Supabase Auth — ajuste
   de dashboard, ninguna herramienta disponible lo cambia por SQL/API.
2. **`CRON_SECRET` sin configurar** como secreto de Edge Function — el cron
   ya corre cada hora pero responde 403 hasta este paso manual (ver
   `docs/whatsapp-setup.md` paso 0).
3. **WhatsApp en modo simulación** — intencional hasta que el usuario tenga
   cuenta de Meta Business y complete `docs/whatsapp-setup.md`.
4. **`deno test` no ejecutado formalmente** — verificado con harness Node
   equivalente por falta de Deno CLI en este entorno; correr `deno test`
   real la próxima vez que se edite `_shared/date-utils.ts`.
5. **`multiple_permissive_policies` y `unused_index`** en el linter de
   performance de Supabase — aceptados conscientemente: son consecuencia
   del patrón deliberado de policies `_read`/`_write` separadas (más
   legible) y de un esquema con datos mínimos todavía (los índices no
   muestran uso real hasta que haya más filas). No son hallazgos de
   seguridad ni corrección, solo de rendimiento a futura escala.
6. **Módulo 3 (agente Windows) no implementado** — decisión explícita del
   usuario, no un olvido.
