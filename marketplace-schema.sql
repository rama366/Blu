-- Run once in Supabase SQL Editor after schema.sql.
-- The board is available only to signed-in users; contact details are shared
-- only inside an inquiry between its sender and the listing owner.

begin;

insert into public.profiles (id, full_name, company, phone)
select id,
       coalesce(raw_user_meta_data->>'full_name', ''),
       coalesce(raw_user_meta_data->>'company', ''),
       coalesce(raw_user_meta_data->>'phone', '')
from auth.users
on conflict (id) do nothing;

revoke update on table public.profiles from anon, authenticated;
grant update (full_name, company, phone) on table public.profiles to authenticated;

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('truck', 'load')),
  origin text not null check (char_length(trim(origin)) between 2 and 120),
  destination text not null check (char_length(trim(destination)) between 2 and 120),
  pickup_date date not null,
  vehicle_type text check (vehicle_type is null or char_length(vehicle_type) <= 80),
  capacity_tons numeric(8, 2) check (capacity_tons is null or capacity_tons > 0),
  cargo_description text check (cargo_description is null or char_length(cargo_description) <= 500),
  price_amount numeric(12, 2) check (price_amount is null or price_amount >= 0),
  price_currency text not null default 'TZS' check (price_currency in ('TZS', 'USD')),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'open' check (status in ('open', 'matched', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_truck_details check (
    listing_type <> 'truck' or (vehicle_type is not null and capacity_tons is not null)
  ),
  constraint marketplace_load_details check (
    listing_type <> 'load' or (cargo_description is not null and char_length(trim(cargo_description)) > 0)
  )
);

create index if not exists marketplace_listings_board_idx
  on public.marketplace_listings (status, listing_type, pickup_date);
create index if not exists marketplace_listings_owner_idx
  on public.marketplace_listings (owner_id, created_at desc);

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null check (listing_type in ('truck', 'load')),
  origin text not null,
  destination text not null,
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  contact_method text not null check (char_length(trim(contact_method)) between 3 and 160),
  message text not null check (char_length(trim(message)) between 10 and 1500),
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_inquiries_sender_idx
  on public.marketplace_inquiries (sender_id, created_at desc);
create index if not exists marketplace_inquiries_listing_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

alter table public.marketplace_listings enable row level security;
alter table public.marketplace_inquiries enable row level security;

drop policy if exists marketplace_listings_read on public.marketplace_listings;
create policy marketplace_listings_read on public.marketplace_listings
  for select to authenticated
  using (status = 'open' or owner_id = auth.uid() or public.is_admin());

drop policy if exists marketplace_listings_insert on public.marketplace_listings;
create policy marketplace_listings_insert on public.marketplace_listings
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists marketplace_listings_update on public.marketplace_listings;
create policy marketplace_listings_update on public.marketplace_listings
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists marketplace_listings_delete on public.marketplace_listings;
create policy marketplace_listings_delete on public.marketplace_listings
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists marketplace_inquiries_read on public.marketplace_inquiries;
create policy marketplace_inquiries_read on public.marketplace_inquiries
  for select to authenticated
  using (
    sender_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.marketplace_listings listing
      where listing.id = listing_id and listing.owner_id = auth.uid()
    )
  );

drop policy if exists marketplace_inquiries_insert on public.marketplace_inquiries;
create policy marketplace_inquiries_insert on public.marketplace_inquiries
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.marketplace_listings listing
      where listing.id = listing_id
        and listing.status = 'open'
        and listing.owner_id <> auth.uid()
    )
  );

drop policy if exists marketplace_inquiries_update on public.marketplace_inquiries;
create policy marketplace_inquiries_update on public.marketplace_inquiries
  for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.marketplace_listings listing
      where listing.id = listing_id and listing.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.marketplace_listings listing
      where listing.id = listing_id and listing.owner_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.marketplace_listings to authenticated;
grant select, insert, update on public.marketplace_inquiries to authenticated;

commit;