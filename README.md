# Activo → UNOP TI Hub

Este repositorio contiene dos aplicaciones mientras dura la migración:

- **App legacy** (`index.html`, `app.js`, este README) — la PWA de inventario
  original, en JavaScript puro. Sigue funcionando y se documenta abajo tal
  cual siempre ha estado.
- **`webapp/`** — el frontend nuevo (React + TypeScript + Vite) del proyecto
  **UNOP TI Hub**, que evoluciona el inventario hacia una plataforma modular
  (Inventario, Trabajadores/Cumpleaños, Monitor de Puertos, Incidentes TI).
  Ver [`webapp/README.md`](webapp/README.md) para instalarlo y correrlo.

Ambas apuntan al mismo proyecto Supabase. El esquema de base de datos ahora
vive versionado en [`supabase/migrations/`](supabase/migrations/) (ver esa
carpeta para el historial completo); `supabase/schema.sql` se conserva solo
como referencia histórica del esquema original y ya no debe usarse para
configurar un proyecto nuevo — usa las migraciones.

---

## App legacy — Inventario clínico UNO-P

Aplicación de inventario personal para activos clínicos y administrativos. Está diseñada para que puedas registrar bienes sin internet y respaldarlos automáticamente en Supabase cuando la conexión regrese.

## Incluye

- Registro de cualquier activo: computadores, impresoras, red, UPS, mobiliario u otros.
- Código interno único, serial, marca, modelo, ubicación, área, responsable, garantía y observaciones.
- Asignaciones, traslados, devoluciones e historial por activo.
- Registro de mantenimientos preventivos y correctivos, proveedor, costo y estado.
- Panel de indicadores, reportes y exportación del inventario a CSV (abrible en Excel).
- Catálogos editables para categorías, ubicaciones, áreas y estado físico.
- Copia de seguridad JSON e importación para cambiar de equipo.
- PWA instalable y almacenamiento local con IndexedDB; funciona sin internet tras el primer inicio.
- Sincronización privada con Supabase cuando exista conexión.

## Iniciar hoy, sin instalar nada

1. Haz doble clic en `Iniciar-Activo.bat`.
2. Se abrirá `http://localhost:8123` en tu navegador. Mantén abierta la consola mientras uses la aplicación.
3. En el navegador puedes usar el menú de opciones y elegir **Instalar aplicación** para usarla como una app de escritorio.

> No abras `index.html` con doble clic: el servidor local es necesario para que la aplicación se instale y pueda funcionar offline correctamente.

## Configurar el respaldo gratuito en Supabase

> Para un proyecto Supabase nuevo, aplica las migraciones de
> [`supabase/migrations/`](supabase/migrations/) en orden (con la CLI de
> Supabase o pegándolas una por una en el SQL Editor) en vez de usar
> `schema.sql`, que quedó desactualizado tras la Fase 1.

1. Crea una cuenta y un proyecto gratuito en [Supabase](https://supabase.com/dashboard).
2. En el proyecto entra a **SQL Editor** → **New query**. Abre el archivo [schema.sql](supabase/schema.sql), copia todo su contenido, pégalo y pulsa **Run**.
3. En **Authentication** → **Providers** → **Email**, verifica que Email esté habilitado.
4. En **Authentication** → **Users** → **Add user**, crea tu único usuario con correo y contraseña. Si aparece la opción, marca *Auto Confirm User*.
5. Ve a **Project Settings** → **API** y copia:
   - **Project URL**
   - **anon public key** (nunca la clave `service_role`)
6. En la aplicación abre **Configuración**. Pega URL y clave, pulsa **Guardar y conectar**, inicia sesión con el usuario creado y pulsa **Sincronizar ahora**.

El esquema incluye RLS (seguridad por filas): incluso si alguien consiguiera la clave pública, no podrá leer tus datos sin iniciar sesión con tu usuario.

## Uso recomendado al recibir el inventario

1. Abre **Activos** → **Registrar activo** por cada bien recibido.
2. Usa el código oficial de la clínica como *Código interno*. Si no existe, la aplicación propone uno temporal `UNOP-XXXXXX`.
3. Registra serial, ubicación exacta, responsable y estado físico. Es la información más valiosa para auditoría.
4. Si el activo queda a cargo de alguien, usa **Movimientos** → **Asignación**: quedará trazabilidad y el estado se actualizará automáticamente.
5. Al finalizar la jornada, verifica el indicador de conexión y pulsa **Sincronizar ahora**. Descarga también una copia JSON semanal desde **Reportes** o **Configuración**.

## Estructura

| Archivo | Propósito |
|---|---|
| `index.html`, `styles.css`, `app.js` | Interfaz y lógica de la aplicación legacy. |
| `sw.js`, `manifest.webmanifest` | Instalación y funcionamiento sin internet (app legacy). |
| `supabase/schema.sql` | Esquema original — referencia histórica, ya no usar para setup nuevo. |
| `supabase/migrations/` | Historial real y versionado del esquema de base de datos. |
| `webapp/` | App nueva (React + TS + Vite) — UNOP TI Hub. |
| `Iniciar-Activo.bat`, `Start-Local.ps1` | Servidor local de la app legacy, sin dependencias. |

## Importante

- La sincronización es de respaldo: no borres datos locales antes de confirmar que se sincronizaron.
- Si usas otro navegador o equipo, importa una copia JSON o amplía la aplicación para descargar registros desde Supabase antes de trabajar allí.
- Los archivos adjuntos y fotografías no se incluyen en esta primera versión; conviene añadirlos en una fase posterior con Supabase Storage si los necesitas.
