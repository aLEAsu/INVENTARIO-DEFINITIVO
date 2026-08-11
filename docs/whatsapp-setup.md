# Configuración de WhatsApp Business Cloud API — UNOP TI Hub

El sistema de recordatorios de cumpleaños ya está construido y desplegado
(Edge Functions `send-birthday-notifications` y `whatsapp-webhook`, cron
horario, tablas de auditoría de envíos). **Hoy corre en modo simulación**:
calcula todo, registra cada "envío" en `notification_deliveries`, pero no
sale ninguna llamada real a Meta. Esta guía es para cuando quieras activarlo
de verdad.

## 0. Paso obligatorio ya mismo (no depende de Meta)

El cron que dispara la función cada hora necesita un secreto compartido
(`CRON_SECRET`) que ya se generó y quedó guardado en Supabase Vault. Sin
configurarlo, la función seguirá funcionando en modo simulación pero
**rechazará todas las invocaciones del cron** (falla cerrado, no manda nada
por error). Para activarlo:

1. En el **SQL Editor** de tu proyecto Supabase, ejecuta:
   ```sql
   select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret';
   ```
2. Copia el valor que te devuelve.
3. Ve a **Project Settings → Edge Functions → Secrets** y crea un secreto
   llamado `CRON_SECRET` con ese mismo valor.

Con eso, el cron ya puede invocar la función cada hora en modo simulación —
puedes verificarlo mirando la tabla `notification_jobs`/`notification_deliveries`
al día siguiente, o forzando una ejecución manual desde **Edge Functions →
send-birthday-notifications → Invoke** con el header `x-cron-secret` igual
al valor copiado.

## 1. Crear la app de Meta y la cuenta de WhatsApp Business

1. Entra a [developers.facebook.com](https://developers.facebook.com/) y
   crea una cuenta de desarrollador si no tienes una.
2. **Mis apps → Crear app → tipo "Empresa"**.
3. Dentro de la app, agrega el producto **WhatsApp**.
4. Meta crea automáticamente un número de prueba. Para producción real,
   agrega y verifica tu propio número en **WhatsApp → Configuración de la
   API → Números de teléfono**.
5. Anota:
   - **Phone Number ID** (en Configuración de la API) → variable
     `WHATSAPP_PHONE_NUMBER_ID`.
   - **Token de acceso**: genera uno **permanente** (no el temporal de 24h)
     desde **Configuración de la app → Usuarios del sistema**, creando un
     usuario del sistema con rol Admin y generando un token con permiso
     `whatsapp_business_messaging` → variable `WHATSAPP_TOKEN`.
   - **App Secret**: en **Configuración → Básica** de la app → variable
     `WHATSAPP_APP_SECRET`.

## 2. Crear y aprobar la plantilla de mensaje

Meta exige que todo mensaje fuera de una conversación abierta por el
usuario use una **plantilla aprobada**.

1. En **WhatsApp Manager → Plantillas de mensajes → Crear plantilla**.
2. Categoría: **Utilidad**. Nombre: `birthday_reminder` (debe coincidir
   exactamente con lo que usa la Edge Function — si usas otro nombre,
   ajústalo en `supabase/functions/send-birthday-notifications/index.ts`).
3. Idioma: Español.
4. Cuerpo sugerido: `Hoy es el cumpleaños de {{1}}. ¡No olviden felicitarlo!`
   (una sola variable: el nombre del trabajador).
5. Envía a revisión. Meta suele aprobar plantillas simples en minutos a
   pocas horas. El estado se refleja en el campo `approval_status` de la
   tabla `notification_templates` — actualízalo manualmente desde
   **Trabajadores → Notificaciones** en la app una vez Meta la apruebe (no
   hay sincronización automática de estado de plantillas todavía).

## 3. Configurar el webhook de estados de entrega

1. En **WhatsApp → Configuración → Webhook**, URL de callback:
   `https://otjoywhmbddrspvyghcr.supabase.co/functions/v1/whatsapp-webhook`
2. **Verify token**: inventa un valor y guárdalo también como secreto de
   Edge Function `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (Project Settings → Edge
   Functions → Secrets). Debe ser el mismo valor en ambos lados.
3. Suscríbete al campo **messages** (incluye los `statuses` de entrega:
   enviado/entregado/leído/fallido).
4. Meta hará un `GET` de verificación inmediatamente — si el verify token
   coincide, se suscribe. Si falla, revisa que el secreto esté bien copiado
   (sin espacios) y reintenta.

## 4. Variables de entorno completas (Edge Function Secrets)

Configúralas en **Project Settings → Edge Functions → Secrets**:

| Variable | Obligatoria desde | Propósito |
|---|---|---|
| `CRON_SECRET` | Ahora (paso 0) | Autentica al cron frente a la función de envío. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Al configurar el webhook (paso 3) | Handshake de suscripción de Meta. |
| `WHATSAPP_APP_SECRET` | Al configurar el webhook (paso 3) | Valida la firma HMAC de cada callback de Meta. |
| `WHATSAPP_TOKEN` | Solo al pasar a envío real | Token de acceso para llamar a la Cloud API. |
| `WHATSAPP_PHONE_NUMBER_ID` | Solo al pasar a envío real | Número emisor de los mensajes. |
| `WHATSAPP_SEND_MODE` | Solo al pasar a envío real | Poner exactamente `live`. Cualquier otro valor (o ausente) = simulación. |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase
automáticamente en toda Edge Function — no hace falta configurarlos.

## 5. Pasar de simulación a envío real

Solo cuando tengas plantilla **aprobada** y las 5 variables de arriba
configuradas: crea el secreto `WHATSAPP_SEND_MODE=live`. Desde ese momento,
cada cumpleaños con consentimiento y con al menos un destinatario activo
generará un mensaje real. No hay marcha atrás automática: para volver a
simulación, borra o cambia ese secreto.

Antes de activarlo en producción, prueba con una organización de prueba y un
número de WhatsApp propio como destinatario.
