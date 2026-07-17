-- Kamuk tables on Infinity Supabase (rxruvpfdpgowmpvydacd)
-- Run in Supabase SQL Editor when ready for dedicated tables.
-- Until then, Kamuk apps use KV rows in infinity_sessions (KMSTU_/KMUSR_/KMSES_).

create table if not exists public.kamuk_students (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.kamuk_users (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.kamuk_sessions (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.kamuk_resources (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.kamuk_students enable row level security;
alter table public.kamuk_users enable row level security;
alter table public.kamuk_sessions enable row level security;
alter table public.kamuk_resources enable row level security;

-- Mirror Infinity anon access pattern (open policies for training ops tools)
do $$ begin
  create policy kamuk_students_anon_all on public.kamuk_students for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy kamuk_users_anon_all on public.kamuk_users for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy kamuk_sessions_anon_all on public.kamuk_sessions for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy kamuk_resources_anon_all on public.kamuk_resources for all to anon using (true) with check (true);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on public.kamuk_students to anon, authenticated;
grant select, insert, update, delete on public.kamuk_users to anon, authenticated;
grant select, insert, update, delete on public.kamuk_sessions to anon, authenticated;
grant select, insert, update, delete on public.kamuk_resources to anon, authenticated;
