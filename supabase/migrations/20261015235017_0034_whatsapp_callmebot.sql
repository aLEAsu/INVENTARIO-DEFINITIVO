-- Reemplaza la API de WhatsApp Business Cloud de Meta por CallMeBot
-- (https://www.callmebot.com) en el codigo de la Edge Function: envio
-- gratuito via HTTP GET, sin cuenta de empresa ni plantillas aprobadas.
-- Cada destinatario registra su propio numero con CallMeBot (fuera de
-- esta app, ver docs/whatsapp-setup.md) y guarda aqui su apikey personal.
--
-- No se borra nada del esquema anterior (notification_templates,
-- notification_deliveries.template_id/meta_message_id/meta_response)
-- -- queda sin usar por el codigo nuevo, para no ejecutar un DROP
-- destructivo sin necesidad.

alter table public.birthday_notification_recipients
  add column if not exists callmebot_apikey text;
