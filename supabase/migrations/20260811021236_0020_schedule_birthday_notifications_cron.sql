-- Genera un secreto compartido entre el cron y la Edge Function (una sola
-- vez; si ya existe no lo pisa). El usuario debe configurar EXACTAMENTE este
-- mismo valor como secreto "CRON_SECRET" de la Edge Function
-- (Project Settings > Edge Functions > Secrets), documentado en
-- docs/whatsapp-setup.md -- sin ese paso, la funcion rechaza toda invocacion
-- (falla cerrado, no abierto).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret');
  end if;
end $$;

select cron.schedule(
  'send-birthday-notifications-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://otjoywhmbddrspvyghcr.supabase.co/functions/v1/send-birthday-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
