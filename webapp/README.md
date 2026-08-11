# UNOP TI Hub — webapp

Frontend (React + TypeScript + Vite + PWA) del proyecto UNOP TI Hub.
Convive con la app legacy (`../index.html`, `../app.js`) — ver `../README.md`
para el contexto general. Estado final del proyecto: Fases 1-4 y 6
completas (Módulo 3, agente de puertos Windows, no implementado por
decisión del usuario). Documentación completa en [`../docs/`](../docs/),
empezando por [`../docs/architecture.md`](../docs/architecture.md) y
[`../docs/traceability-matrix.md`](../docs/traceability-matrix.md).

## Requisitos

- Node.js 20+ (probado con Node 24) y npm.
- Un proyecto Supabase con las migraciones de `../supabase/migrations/` aplicadas.

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de
   **Project Settings → API** de tu proyecto Supabase. Nunca uses la
   `service_role key` aquí: queda embebida en el bundle que se sirve al navegador.

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # type-check (tsc -b) + build de produccion a dist/
npm run preview   # servir el build de produccion localmente
npm run test      # pruebas unitarias (Vitest)
npm run lint      # oxlint
```

## Qué incluye (Fase 1 + Fase 2)

**Fundaciones (Fase 1)**
- Autenticación con Supabase Auth (email/contraseña) y contexto de sesión (`src/core/auth/`).
- Modelo de organizaciones y roles (`owner`, `admin_ti`, `tecnico_ti`,
  `talento_humano`, `lector`, `colaborador`) con matriz de permisos en
  `src/core/rbac.ts`.
- Migración automática de la IndexedDB local existente (`unop-activo-db`,
  compartida con la app legacy) hacia el nuevo esquema tipado — ver
  `src/data/db.ts`.

**Inventario completo (Fase 2)**
- Catálogos estructurados: sedes, ubicaciones, áreas, categorías con
  subcategorías (`/catalogos`).
- Directorio mínimo de trabajadores reales (`/trabajadores`) usado como
  responsable de cada activo (reemplaza el texto libre).
- Activos: proveedor, factura, costo, categoría/subcategoría/ubicación/área/
  responsable como catálogos reales, serial único por organización, búsqueda,
  filtro, paginación, vista de tarjetas en móvil, exportación CSV/Excel/PDF.
- Detalle de activo (`/inventario/:id`): historial inalterable (asignaciones +
  mantenimientos + auditoría), adjuntos/fotos en Supabase Storage, código QR
  para imprimir, asignación/devolución a trabajador, baja lógica (preserva
  trazabilidad, ya no se borra en duro desde la UI).
- Mantenimientos (`/inventario/mantenimientos`): preventivo/correctivo,
  técnico, diagnóstico, repuestos, próxima fecha.
- Consumibles y existencias (`/inventario/consumibles`): entradas/salidas,
  alerta visual bajo el mínimo.
- Inventario físico por QR (`/inventario/conteo-fisico`): sesión de conteo,
  escaneo por cámara (`html5-qrcode`) o manual, diferencias en vivo, cierre
  con acta.
- Reportes (`/inventario/reportes`): por área/responsable/condición/estado,
  exportables a PDF/Excel.
- Tablero ejecutivo con conteos reales de activos por estado.

**Decisión de seguridad**: se evaluó la librería `xlsx` (SheetJS) para
exportar Excel y se descartó por tener 2 vulnerabilidades altas sin parche en
su código de *parseo* (prototype pollution, ReDoS). Se usa `write-excel-file`
en su lugar, que solo escribe archivos (no incluye parser, así que esos CVEs
no aplican) — ver `npm audit` en este paquete para confirmar 0 vulnerabilidades.

**Simplificación consciente**: los módulos nuevos de Fase 2 (catálogos,
trabajadores, mantenimientos, consumibles, conteo físico, adjuntos) requieren
conexión — no tienen caché offline ni cola de sincronización propia como
`assets` (que sí la conserva de Fase 1). Si se necesita offline-first también
para estos módulos, es un trabajo adicional a planear.

**Trabajadores y cumpleaños (Fase 3)**
- Consentimiento explícito por trabajador para aparecer en recordatorios
  (`birthday_consent`, checkbox en el formulario).
- Protección del año de nacimiento **a nivel de dato** (no solo de UI): la
  vista `worker_birthday_calendar` (`security_invoker`, ver migración 0016)
  solo devuelve el año completo a `owner`/`admin_ti`/`talento_humano`; el
  resto de roles solo ve día/mes.
- Calendario de cumpleaños y "próximos cumpleaños" (`/trabajadores/cumpleanos`).
- Importación/exportación CSV de trabajadores con validación fila por fila
  (documento duplicado, fecha inválida, etc. no abortan el resto del archivo).
- Notificaciones por WhatsApp Business Cloud API (`/trabajadores/notificaciones`):
  destinatarios (E.164), plantillas (metadata), hora de envío configurable,
  política del 29 de febrero, historial de envíos con estado/reintentos/error.
  Dos Edge Functions desplegadas: `send-birthday-notifications` (cron horario
  vía `pg_cron`/`pg_net`, idempotencia por `unique(organization_id, run_date,
  run_type)` en `notification_jobs` + `unique(idempotency_key)` en
  `notification_deliveries` — verificado que un doble disparo del cron no
  duplica envíos) y `whatsapp-webhook` (recibe estados de entrega de Meta,
  valida la firma HMAC antes de procesar). **Modo simulación activo por
  defecto — cero mensajes reales salen hasta configurar Meta**, ver
  [`../docs/whatsapp-setup.md`](../docs/whatsapp-setup.md) para los pasos
  exactos y las variables de entorno.

**Incidentes y Comunicación TI (Fase 4)**
- Folio consecutivo legible por organización (`INC-2026-0001`), generado con
  una función atómica (`private.next_incident_folio`) que evita colisiones
  bajo creación concurrente — verificado.
- Tipos (incidente, solicitud, problema, cambio, mantenimiento, aviso),
  categorías configurables (sembradas con las 10 por defecto del pedido),
  prioridad P1-P4, flujo completo de estados, relación con activo/trabajador/
  servicio afectado.
- Bitácora (`/incidentes/:id`) con comentarios **internos** (solo
  `owner`/`admin_ti`/`tecnico_ti`) y **públicos** (todo el equipo) —
  verificado con RLS que un `colaborador` no ve los internos ni puede
  reclasificar/cerrar un incidente, aunque sí puede reportarlo y comentarlo.
- P1/P2: banner de seguimiento crítico con causa raíz, solución y acciones
  preventivas. `incident_actions` para acciones preventivas/correctivas,
  también usadas para agrupar "problemas" (vía `parent_incident_id`).
- Base de conocimiento (`/incidentes/base-conocimiento`).
- Panel de estado (`/incidentes/panel`) para todo el equipo: solo folio,
  categoría, prioridad, estado y fecha — la consulta al backend excluye
  explícitamente descripción, causa raíz, bitácora y datos del reportante.
- Reportes (`/incidentes/reportes`): por categoría/prioridad/estado/activo,
  tiempo promedio de atención y resolución, activos con reincidencia,
  exportables a PDF/Excel.
- Adjuntos reutilizando el mismo bucket/tabla de Fase 2 (`entity_type='incident'`).

Fuera de alcance: el agente de monitoreo de puertos en Windows (Fase 5).

## Nota sobre la IndexedDB compartida con la app legacy

Esta app abre la misma base local (`unop-activo-db`) que `app.js`, subiendo su
versión de 1 a 2 para agregar índices y el campo `organizationId`. Esto es
intencional para no perder datos ya guardados en el navegador — pero una vez
que un navegador abre esta app nueva, la app legacy ya no podrá abrir esa
misma base ahí (IndexedDB no permite volver a una versión anterior). La app
legacy sigue funcionando con normalidad en cualquier otro navegador/perfil que
no haya abierto la app nueva.
