-- ============================================================
-- BLUES COMPANY PORTAL — Phase 2 schema
-- Run in Supabase Dashboard → SQL Editor (in this order)
-- ============================================================

-- ---------- Profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  company     text,
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile on signup (reads the metadata portal.js sends)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, company, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'company', ''),
          coalesce(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check helper (security definer avoids recursive RLS)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- ---------- Quotes ----------
create type quote_status as enum ('pending', 'quoted', 'booked', 'transit', 'delivered', 'cancelled');

create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  reference     text unique not null,
  customer_id   uuid references public.profiles(id) on delete set null, -- null = sent from website form
  customer_name text not null,
  customer_email text,
  mode          text,
  origin        text not null,
  destination   text not null,
  cargo         text,
  incoterm      text,
  ready_date    date,
  notes         text,
  status        quote_status not null default 'pending',
  created_at    timestamptz not null default now()
);

-- ---------- Shipments + milestones ----------
create table if not exists public.shipments (
  id           uuid primary key default gen_random_uuid(),
  reference    text unique not null,
  quote_id     uuid references public.quotes(id) on delete set null,
  customer_id  uuid references public.profiles(id) on delete cascade,
  mode         text,
  origin       text not null,
  destination  text not null,
  vessel       text,
  voyage       text,
  eta          date,
  current_step int not null default 0,
  status       quote_status not null default 'booked',
  created_at   timestamptz not null default now()
);

create table if not exists public.shipment_events (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  label       text not null,
  note        text,
  sort_order  int not null default 0,
  happened_at timestamptz
);

-- ---------- Documents (metadata; files live in Storage) ----------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references public.profiles(id) on delete cascade,
  shipment_id  uuid references public.shipments(id) on delete set null,
  name         text not null,
  storage_path text not null,
  mime         text,
  size         bigint,
  uploaded_at  timestamptz not null default now()
);

-- ---------- Key/value settings (business contact details etc.) ----------
create table if not exists public.settings (
  key   text primary key,
  value text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.quotes          enable row level security;
alter table public.shipments       enable row level security;
alter table public.shipment_events enable row level security;
alter table public.documents       enable row level security;
alter table public.settings        enable row level security;

-- profiles: read/update own row; admins read all
create policy "profiles_select_own"   on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id or public.is_admin());

-- quotes: customers see their own; admins see all; authenticated users can create their own
create policy "quotes_select" on public.quotes for select
  using (customer_id = auth.uid() or public.is_admin());
create policy "quotes_insert" on public.quotes for insert
  with check (customer_id = auth.uid() or customer_id is null);
create policy "quotes_update" on public.quotes for update
  using (public.is_admin());

-- shipments + events: customers see their own; admins manage all
create policy "shipments_select" on public.shipments for select
  using (customer_id = auth.uid() or public.is_admin());
create policy "shipments_admin"  on public.shipments for all
  using (public.is_admin()) with check (public.is_admin());

create policy "events_select" on public.shipment_events for select
  using (exists (select 1 from public.shipments s where s.id = shipment_id
                and (s.customer_id = auth.uid() or public.is_admin())));
create policy "events_admin"  on public.shipment_events for all
  using (public.is_admin()) with check (public.is_admin());

-- documents: customers see their own; admins manage all
create policy "documents_select" on public.documents for select
  using (customer_id = auth.uid() or public.is_admin());
create policy "documents_insert" on public.documents for insert
  with check (customer_id = auth.uid() or public.is_admin());
create policy "documents_admin"  on public.documents for delete
  using (public.is_admin());

-- settings: any signed-in user can read; only admins write
create policy "settings_read"  on public.settings for select using (auth.role() = 'authenticated');
create policy "settings_admin" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Customers read/write only inside their own folder (<uid>/...); admins anything
create policy "documents_storage_read" on storage.objects for select
  using ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin());
create policy "documents_storage_write" on storage.objects for insert
  with check ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin());
create policy "documents_storage_update" on storage.objects for update
  using ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin());
create policy "documents_storage_delete" on storage.objects for delete
  using ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin());

-- ============================================================
-- MAKE YOURSELF ADMIN (run once, after you sign up on the site)
-- ============================================================
-- update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';
-- find your UUID in Authentication → Users

-- ============================================================
-- OPTIONAL: reference number generator for quotes
-- ============================================================
create or replace function public.next_quote_reference()
returns text language plpgsql as $$
declare yr int := extract(year from now())::int; n int;
begin
  select count(*) + 155 into n from public.quotes
   where reference like 'QT-' || yr || '-%';
  return 'QT-' || yr || '-' || lpad(n::text, 4, '0');
end $$;
