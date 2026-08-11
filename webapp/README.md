# UNOP TI Hub — webapp (Fase 1)

Frontend nuevo (React + TypeScript + Vite + PWA) del proyecto UNOP TI Hub.
Convive con la app legacy (`../index.html`, `../app.js`) mientras se completan
las fases de migración — ver `../README.md` para el contexto general y
`../supabase/migrations/` para el historial de la base de datos.

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

Fuera de alcance (siguientes fases, documentadas en el plan): cumpleaños y
notificaciones WhatsApp del módulo de Trabajadores, Incidentes, y el agente
de monitoreo de puertos en Windows.

## Nota sobre la IndexedDB compartida con la app legacy

Esta app abre la misma base local (`unop-activo-db`) que `app.js`, subiendo su
versión de 1 a 2 para agregar índices y el campo `organizationId`. Esto es
intencional para no perder datos ya guardados en el navegador — pero una vez
que un navegador abre esta app nueva, la app legacy ya no podrá abrir esa
misma base ahí (IndexedDB no permite volver a una versión anterior). La app
legacy sigue funcionando con normalidad en cualquier otro navegador/perfil que
no haya abierto la app nueva.
