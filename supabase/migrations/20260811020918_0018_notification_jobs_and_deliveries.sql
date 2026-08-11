create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_date date not null,
  run_type text not null check (run_type in ('day_before','same_day')),
  status text not null default 'pendiente' check (status in ('pendiente','procesando','completado','error')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (organization_id, run_date, run_type)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  recipient_id uuid not null references public.birthday_notification_recipients(id) on delete cascade,
  template_id uuid references public.notification_templates(id) on delete set null,
  idempotency_key text not null unique,
  status text not null default 'pendiente' check (status in ('pendiente','enviado','entregado','leido','error')),
  meta_message_id text,
  meta_response jsonb,
  error_reason text,
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_jobs_org_idx on public.notification_jobs(organization_id);
create index if not exists notification_deliveries_org_idx on public.notification_deliveries(organization_id);
create index if not exists notification_deliveries_job_idx on public.notification_deliveries(job_id);
create index if not exists notification_deliveries_message_idx on public.notification_deliveries(meta_message_id);

alter table public.notification_jobs enable row level security;
alter table public.notification_deliveries enable row level security;

-- Solo lectura para miembros de la organizacion; nadie escribe desde el
-- cliente. Estas tablas solo las escribe la Edge Function con service_role
-- (bypassa RLS), igual que audit_log.
drop policy if exists "notification_jobs_org_read" on public.notification_jobs;
create policy "notification_jobs_org_read" on public.notification_jobs
  for select using (private.is_org_member(organization_id));

drop policy if exists "notification_deliveries_org_read" on public.notification_deliveries;
create policy "notification_deliveries_org_read" on public.notification_deliveries
  for select using (private.is_org_member(organization_id));
