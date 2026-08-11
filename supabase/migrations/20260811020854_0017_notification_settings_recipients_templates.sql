create table if not exists public.organization_notification_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  send_hour_local smallint not null default 8 check (send_hour_local between 0 and 23),
  feb29_policy text not null default 'feb_28' check (feb29_policy in ('feb_28','mar_1')),
  timezone text not null default 'America/Bogota'
);

create table if not exists public.birthday_notification_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9]\d{6,14}$'),
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, phone_e164)
);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  language text not null default 'es',
  meta_template_name text not null,
  variables jsonb not null default '[]',
  approval_status text not null default 'pendiente' check (approval_status in ('pendiente','aprobada','rechazada')),
  created_at timestamptz not null default now(),
  unique (organization_id, meta_template_name, language)
);

alter table public.organization_notification_settings enable row level security;
alter table public.birthday_notification_recipients enable row level security;
alter table public.notification_templates enable row level security;

drop policy if exists "notif_settings_org_read" on public.organization_notification_settings;
create policy "notif_settings_org_read" on public.organization_notification_settings
  for select using (private.is_org_member(organization_id));
drop policy if exists "notif_settings_org_write" on public.organization_notification_settings;
create policy "notif_settings_org_write" on public.organization_notification_settings
  for all using (private.has_org_role(organization_id, array['owner','admin_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti']));

drop policy if exists "notif_recipients_org_read" on public.birthday_notification_recipients;
create policy "notif_recipients_org_read" on public.birthday_notification_recipients
  for select using (private.is_org_member(organization_id));
drop policy if exists "notif_recipients_org_write" on public.birthday_notification_recipients;
create policy "notif_recipients_org_write" on public.birthday_notification_recipients
  for all using (private.has_org_role(organization_id, array['owner','admin_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti']));

drop policy if exists "notif_templates_org_read" on public.notification_templates;
create policy "notif_templates_org_read" on public.notification_templates
  for select using (private.is_org_member(organization_id));
drop policy if exists "notif_templates_org_write" on public.notification_templates;
create policy "notif_templates_org_write" on public.notification_templates
  for all using (private.has_org_role(organization_id, array['owner','admin_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti']));
