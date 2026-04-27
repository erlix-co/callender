-- Option A (no auth): simplest setup for shared DB.
-- Run this in Supabase SQL editor.
-- NOTE: Disabling RLS / permissive access is NOT secure for public apps.

create table if not exists public.categories (
  id text primary key,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  created_at date not null,
  amount numeric not null,
  category_id text not null references public.categories(id) on delete restrict,
  product text not null,
  store text not null,
  payment_method text not null,
  updater_name text not null
);

create table if not exists public.budgets (
  id text primary key default 'main',
  monthly text not null default ''
);

create table if not exists public.store_memory (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.app_settings (
  id text primary key default 'main',
  include_other_in_totals boolean not null default false
);

insert into public.budgets (id, monthly)
values ('main', '')
on conflict (id) do nothing;

insert into public.store_memory (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.app_settings (id, include_other_in_totals)
values ('main', false)
on conflict (id) do nothing;

-- Option A: keep RLS disabled (default) for quick start.
-- If you enabled RLS earlier, you can disable it like this:
-- alter table public.categories disable row level security;
-- alter table public.expenses disable row level security;
-- alter table public.budgets disable row level security;
-- alter table public.store_memory disable row level security;
-- alter table public.app_settings disable row level security;

