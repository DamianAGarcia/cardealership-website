-- Route 12 Auto Sales — database setup
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run)

-- 1. The listings table: one row per car on the lot
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  year int not null,
  make text not null,
  model text not null,
  trim text,
  price numeric not null,
  mileage int not null,
  body_type text not null check (body_type in ('sedan','suv','truck','coupe','wagon','other')),
  fuel_type text default 'Gas',
  transmission text default 'Automatic',
  condition_note text,
  description text,
  photo_urls text[] default '{}'
);

-- 2. Turn on row-level security so we can control who can read/write
alter table listings enable row level security;

-- 3. Anyone (site visitors) can read listings — this powers the public landing page
create policy "Public can view listings"
  on listings for select
  using (true);

-- 4. Only logged-in dealership staff can add, edit, or remove listings
create policy "Authenticated staff can insert listings"
  on listings for insert
  to authenticated
  with check (true);

create policy "Authenticated staff can update listings"
  on listings for update
  to authenticated
  using (true);

create policy "Authenticated staff can delete listings"
  on listings for delete
  to authenticated
  using (true);

-- 5. Storage bucket for car photos
-- Go to Storage in the Supabase dashboard and create a bucket named "car-photos", set to Public.
-- Then run the policies below so the public can view photos, but only staff can upload/delete.

create policy "Public can view car photos"
  on storage.objects for select
  using (bucket_id = 'car-photos');

create policy "Authenticated staff can upload car photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-photos');

create policy "Authenticated staff can delete car photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-photos');
