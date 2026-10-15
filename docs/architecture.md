# Arquitectura — UNOP TI Hub

## Vista general

```mermaid
flowchart TB
    subgraph Cliente["Navegador (webapp/)"]
        UI["React + TypeScript + Vite + PWA"]
        Dexie["IndexedDB (Dexie)\ncache offline de activos"]
        UI <--> Dexie
    end

    subgraph Supabase["Proyecto Supabase (otjoywhmbddrspvyghcr)"]
        Auth["Auth\n(email/contraseña)"]
        PG["Postgres\n~31 tablas + RLS por organización"]
        Storage["Storage\nbucket privado 'attachments'"]
        Cron["pg_cron + pg_net\ndisparo horario"]
        EF1["Edge Function\nsend-birthday-notifications"]
        EF2["Edge Function\nwhatsapp-webhook"]
        Vault["Vault\nsecreto compartido cron"]
    end

    subgraph Meta["Meta (WhatsApp Business Cloud API)"]
        WA["API de envío"]
        WH["Webhook de estados de entrega"]
    end

    UI -- "anon key, JWT de usuario" --> Auth
    UI -- "anon key, respeta RLS" --> PG
    UI -- "anon key, respeta RLS" --> Storage
    Cron -- "x-cron-secret (Vault)" --> EF1
    EF1 -- "service_role\n(bypassa RLS)" --> PG
    EF1 -- "solo si WHATSAPP_SEND_MODE=live" --> WA
    WH -- "firma HMAC" --> EF2
    EF2 -- "service_role" --> PG
    Vault -.-> Cron

    style EF1 fill:#0b3b60,color:#fff
    style EF2 fill:#0b3b60,color:#fff
```

**Principio de seguridad central**: el cliente (navegador) solo tiene la
`anon key` y siempre pasa por RLS. La `service_role key` (que ignora RLS)
solo existe dentro de las Edge Functions, inyectada automáticamente por
Supabase como variable de entorno — nunca en código de cliente ni en
variables `VITE_*` (esas quedan embebidas en el bundle público).

## Módulos y rutas

| Módulo | Ruta base | Páginas |
|---|---|---|
| Tablero | `/` | Dashboard con conteos por módulo |
| Inventario | `/inventario`, `/catalogos` | Activos, detalle, mantenimientos, consumibles, conteo físico QR, reportes, catálogos |
| Trabajadores | `/trabajadores` | Directorio, cumpleaños, notificaciones WhatsApp |
| Incidentes | `/incidentes` | Listado, detalle/bitácora, base de conocimiento, panel de estado, reportes |

## Modelo de datos (ERD por módulo)

```mermaid
erDiagram
    organizations ||--o{ organization_members : tiene
    organizations ||--o{ profiles : "(via auth.users)"

    organizations ||--o{ assets : posee
    organizations ||--o{ workers : emplea
    organizations ||--o{ incidents : registra

    sites ||--o{ locations : contiene
    categories ||--o{ categories : "subcategoría de"
    assets }o--|| categories : clasificado_en
    assets }o--o| locations : ubicado_en
    assets }o--o| areas : pertenece_a
    assets }o--o| workers : asignado_a
    assets ||--o{ asset_assignments : historial
    assets ||--o{ maintenance : mantenimientos
    assets ||--o{ movements : movimientos
    assets ||--o{ attachments : adjuntos

    physical_counts ||--o{ physical_count_items : items
    physical_count_items }o--|| assets : verifica

    inventory_items ||--o{ stock_movements : movimientos

    workers ||--o{ asset_assignments : recibe
    workers ||--o| worker_birthday_calendar : "vista (año protegido)"
    workers ||--o{ birthday_notification_recipients : "(no directo)"

    notification_jobs ||--o{ notification_deliveries : genera
    notification_templates ||--o{ notification_deliveries : usa
    birthday_notification_recipients ||--o{ notification_deliveries : recibe

    incident_categories ||--o{ incidents : clasifica
    services ||--o{ incidents : afecta
    incidents ||--o{ incident_updates : bitácora
    incidents ||--o{ incident_actions : acciones
    incidents ||--o{ incident_subscribers : suscriptores
    incidents }o--o| incidents : "agrupado bajo (problema)"
    incidents ||--o{ attachments : evidencia
    kb_articles }o--o| incidents : origina_en

    audit_log }o--|| organizations : "auditoría (todas las tablas mutables)"
```

*(Diagrama simplificado — el detalle exacto de columnas está en cada
archivo de `supabase/migrations/`.)*

## Decisiones técnicas clave

- **Frontend sin framework de estado global**: React + Context API
  (`SessionContext`) alcanza para el tamaño de la app; se evitó Redux/Zustand
  para no añadir dependencias sin necesidad real.
- **Offline solo donde importa**: `assets` conserva caché Dexie + cola
  `outbox` (heredado de la app legacy, ver `webapp/src/data/db.ts`). Los
  módulos agregados en Fases 2-4 (catálogos, trabajadores, mantenimiento,
  incidentes, notificaciones) son online-first — decisión consciente
  documentada en `webapp/README.md`, revisable si se necesita offline ahí
  también.
- **IndexedDB compartida con la app legacy**: mismo `DB_NAME`, subiendo de
  v1 a v2, para no perder datos ya guardados en el navegador del usuario.
- **`write-excel-file` en vez de `xlsx`**: la librería `xlsx` (SheetJS)
  tiene 2 CVEs altos sin parche en su código de *parseo*; como el sistema
  solo **genera** Excel (nunca lee archivos subidos), se usó una librería
  que no incluye ese código en absoluto.
- **Columnas legacy conservadas como snapshot**: al ampliar `assets` con
  FKs a catálogos reales (Fase 2), las columnas de texto originales
  (`category`, `location`, `area`, `responsible`) no se borraron — quedan
  como historial y respaldo de lo que había antes de la migración.
- **RLS en vez de filtros de aplicación**: toda restricción de acceso
  (organización, rol, visibilidad interno/público, año de nacimiento) se
  implementa como policy de Postgres, no como `if` en el frontend — así un
  bug de UI no puede filtrar datos de otra organización.
- **Folios e idempotencia resueltos en la base de datos, no en la app**:
  el generador de folios (`private.next_incident_folio`) y las claves de
  idempotencia de notificaciones usan constraints únicos, no lógica de
  aplicación — sobreviven a reintentos, dobles clics y al cron disparando
  dos veces.

## Multi-trabajo y blueprints de oficio (migraciones 0030-0032)

UNOP TI Hub pasó de ser una app de un solo tenant (UNOP) a una herramienta
personal de un ingeniero que se mueve entre trabajos/clientes distintos,
manteniendo intactos los tres módulos (inventario, trabajadores, incidentes)
en vez de reducir el alcance:

- **Multi-organización real en el frontend**: `organization_members` ya
  soportaba varias filas por usuario (el esquema nunca lo impidió); lo que
  faltaba era que `SessionContext` dejara de asumir una sola membresía
  (`.maybeSingle()`). Ahora carga todas las membresías del usuario, mantiene
  un `activeOrgId` persistido en `localStorage`, y expone `memberships` +
  `switchOrganization()`. El selector vive en `ui/Layout.tsx`
  (`OrgSwitcher`).
- **Crear un trabajo nuevo**: no hay policy de `INSERT` directa sobre
  `organizations`/`organization_members` (evitaría que un usuario se
  auto-agregue a una organización ajena). En su lugar, `create_organization(p_name)`
  es una función `security definer` que inserta la organización y agrega al
  llamante como `owner` en una sola transacción. Ruta `/trabajos/nuevo`
  (`NewOrganizationPage`), accesible con sesión pero sin membresía
  (`ProtectedRoute requireMembership={false}`).
- **Campos personalizados** (`custom_field_definitions` / `custom_field_values`):
  cada organización define sus propios campos (texto, número, fecha,
  booleano, lista) para activos, trabajadores o incidentes, sin tocar
  código. Se administran en `/catalogos` (pestaña "Campos personalizados")
  y se editan con el componente genérico `ui/CustomFieldsPanel.tsx`, cableado
  hoy en el detalle de activos e incidentes.
- **Blueprints de oficio** (`trade_blueprints` + `apply_blueprint_to_organization`):
  paquetes reutilizables y versionados (JSON) que agrupan categorías/subcategorías,
  campos personalizados y categorías de incidente para un rubro técnico. Al
  crear un trabajo, el ingeniero elige un blueprint de sistema (`is_system = true`,
  visible para cualquier usuario) o uno personal propio, y
  `apply_blueprint_to_organization` los aplica de forma idempotente. Se
  sembraron dos blueprints de sistema: **"Generico"** (mínimo, cualquier
  rubro) e **"IT / Oficina"**, este último reconstruido automáticamente a
  partir de la configuración real de UNOP (no es un rubro inventado sin
  validar). Cada aplicación queda registrada en
  `organization_blueprint_applications` para trazabilidad.
- **Pendiente explícito**: cablear `CustomFieldsPanel` también en el modal
  de trabajadores (`WorkerFormModal`, solo tiene sentido en modo edición,
  cuando el trabajador ya tiene `id`); UI para exportar/importar blueprints
  personales como JSON; UI para que un `owner` cree blueprints personales
  nuevos desde una organización ya configurada (hoy solo existen los dos
  blueprints de sistema sembrados por migración).
