create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert','update','delete')),
  actor_user_id uuid references auth.users(id),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_idx on public.audit_log(organization_id, created_at desc);
create index if not exists audit_log_record_idx on public.audit_log(table_name, record_id);

alter table public.audit_log enable row level security;

-- Solo lectura por organizacion; nadie puede insertar/editar/borrar directamente,
-- unicamente el trigger (security definer) escribe filas de auditoria.
drop policy if exists "audit_log_org_read" on public.audit_log;
create policy "audit_log_org_read" on public.audit_log
  for select using (public.is_org_member(organization_id));

create or replace function public.fn_audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_record_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_org_id := OLD.organization_id;
    v_record_id := OLD.id;
  else
    v_org_id := NEW.organization_id;
    v_record_id := NEW.id;
  end if;

  insert into public.audit_log (organization_id, table_name, record_id, action, actor_user_id, old_data, new_data)
  values (
    v_org_id,
    TG_TABLE_NAME,
    v_record_id,
    lower(TG_OP),
    auth.uid(),
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('INSERT','UPDATE') then to_jsonb(NEW) else null end
  );

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

drop trigger if exists trg_audit_assets on public.assets;
create trigger trg_audit_assets
  after insert or update or delete on public.assets
  for each row execute function public.fn_audit_row();

drop trigger if exists trg_audit_movements on public.movements;
create trigger trg_audit_movements
  after insert or update or delete on public.movements
  for each row execute function public.fn_audit_row();

drop trigger if exists trg_audit_maintenance on public.maintenance;
create trigger trg_audit_maintenance
  after insert or update or delete on public.maintenance
  for each row execute function public.fn_audit_row();
