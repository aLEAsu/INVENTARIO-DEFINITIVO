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

## Qué incluye esta fase

- Autenticación con Supabase Auth (email/contraseña) y contexto de sesión (`src/core/auth/`).
- Modelo de organizaciones y roles (`owner`, `admin_ti`, `tecnico_ti`,
  `talento_humano`, `lector`, `colaborador`) con matriz de permisos en
  `src/core/rbac.ts`.
- Inventario de activos con paridad funcional a la app legacy (alta, edición,
  eliminación, búsqueda, filtro por estado) contra el modelo multi-organización,
  con caché offline en IndexedDB (Dexie) y cola de sincronización (`outbox`).
- Migración automática de la IndexedDB local existente (`unop-activo-db`,
  compartida con la app legacy) hacia el nuevo esquema tipado — ver
  `src/data/db.ts`.
- Tablero ejecutivo con conteos reales de activos por estado.

Fuera de alcance en esta fase (llegan en fases siguientes, documentadas en el
plan): adjuntos/fotos, QR/código de barras, stock de consumibles, inventario
físico, exportaciones, trabajadores/cumpleaños/WhatsApp, incidentes, y el
agente de monitoreo de puertos en Windows.

## Nota sobre la IndexedDB compartida con la app legacy

Esta app abre la misma base local (`unop-activo-db`) que `app.js`, subiendo su
versión de 1 a 2 para agregar índices y el campo `organizationId`. Esto es
intencional para no perder datos ya guardados en el navegador — pero una vez
que un navegador abre esta app nueva, la app legacy ya no podrá abrir esa
misma base ahí (IndexedDB no permite volver a una versión anterior). La app
legacy sigue funcionando con normalidad en cualquier otro navegador/perfil que
no haya abierto la app nueva.
