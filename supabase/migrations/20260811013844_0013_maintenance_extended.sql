alter table public.maintenance add column if not exists technician text;
alter table public.maintenance add column if not exists diagnosis text;
alter table public.maintenance add column if not exists parts_used text;
alter table public.maintenance add column if not exists next_due_date date;
