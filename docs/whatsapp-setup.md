# Configuración de WhatsApp (CallMeBot) — UNOP TI Hub

El sistema de recordatorios de cumpleaños ya está construido y desplegado
(Edge Function `send-birthday-notifications`, cron horario, tablas de
auditoría de envíos). **Hoy corre en modo simulación**: calcula todo,
registra cada "envío" en `notification_deliveries`, pero no sale ninguna
llamada real. Esta guía es para cuando quieras activarlo de verdad.

El envío real usa [CallMeBot](https://www.callmebot.com/), **no** la API de
WhatsApp Business Cloud de Meta: es gratuito y no pide cuenta de empresa,
pero es un servicio **no oficial** (no es de Meta/WhatsApp) — puede tener
límites de envíos, demoras, o dejar de funcionar sin previo aviso. Para
notificar a un grupo pequeño y conocido (RR.HH., el equipo), funciona bien;
no es apto para mensajes masivos ni para contactar gente que no dio su
consentimiento explícito.

## 0. Paso obligatorio ya mismo (no depende de CallMeBot)

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

## 1. Cada destinatario registra su número con CallMeBot (una sola vez)

CallMeBot solo puede enviar mensajes **al mismo número que se registró** —
no sirve para contactar a cualquier persona, cada destinatario se registra a
sí mismo y obtiene su propia apikey. Esto lo hace cada persona que debe
recibir el aviso de cumpleaños (por ejemplo, alguien de RR.HH.), no el
administrador del sistema por ellos:

1. Agrega el número de teléfono oficial de CallMeBot a tus contactos de
   WhatsApp — **cópialo de [callmebot.com/blog/free-api-whatsapp-messages](https://www.callmebot.com/blog/free-api-whatsapp-messages/)**,
   el número público ha cambiado en el pasado y esa es la fuente que se
   mantiene actualizada.
2. Envíale por WhatsApp el mensaje de activación indicado en esa misma
   página (algo como "I allow callmebot to send me messages").
3. CallMeBot responde (puede tardar hasta un par de minutos) con un mensaje
   que incluye tu **apikey** personal — es un número, p. ej. `123456`.
4. En la app: **Trabajadores → Notificaciones**, agrega tu número como
   destinatario (o edítalo si ya existe) y pega esa apikey en el campo
   "Apikey de CallMeBot".

Repite esto por cada persona que deba recibir los avisos. Un destinatario
sin apikey configurada simplemente no recibe mensajes en vivo (queda
registrado como error en el historial, explicando por qué).

## 2. Variables de entorno (Edge Function Secrets)

Configúralas en **Project Settings → Edge Functions → Secrets**:

| Variable | Obligatoria desde | Propósito |
|---|---|---|
| `CRON_SECRET` | Ahora (paso 0) | Autentica al cron frente a la función de envío. |
| `WHATSAPP_SEND_MODE` | Solo al pasar a envío real | Poner exactamente `live`. Cualquier otro valor (o ausente) = simulación. |

No hace falta ningún token ni secreto de aplicación — la "credencial" es la
apikey que cada destinatario pega en su propio registro (paso 1). `SUPABASE_URL`
y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente en toda
Edge Function.

## 3. Pasar de simulación a envío real

Cuando al menos un destinatario activo tenga su apikey de CallMeBot
configurada: crea el secreto `WHATSAPP_SEND_MODE=live`. Desde ese momento,
cada cumpleaños con consentimiento del trabajador generará un mensaje real
a cada destinatario activo **que tenga apikey configurada**; los que no la
tengan quedan marcados como error, no se intenta enviarles nada. No hay
marcha atrás automática: para volver a simulación, borra o cambia ese
secreto.

Antes de activarlo en producción, prueba con un número de WhatsApp propio
como único destinatario activo.

## Nota sobre la integración anterior con Meta (retirada)

Esta app usó antes la API de WhatsApp Business Cloud de Meta (token de
acceso, plantillas aprobadas, webhook de estados de entrega firmado con
HMAC). Se reemplazó por completo por CallMeBot para no depender de una
cuenta de empresa. Las tablas `notification_templates` y las columnas
`notification_deliveries.template_id`/`meta_message_id` quedaron en el
esquema sin usar (no se borraron para no perder datos de un cambio de
esquema innecesario); la Edge Function `whatsapp-webhook` (verificación de
firma de Meta) también quedó desplegada pero inerte — ninguna de las dos
hace falta configurar ni usar.
