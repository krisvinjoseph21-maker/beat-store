-- ============================================================
-- KJYOUCRAZY — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- beats
-- -------------------------------------------------------
create table if not exists public.beats (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  bpm          integer not null default 140,
  key          text not null default '',
  genre        text not null default '',
  subgenre     text not null default '',
  tags         text[] not null default '{}',
  file_url     text,          -- full/clean beat (NEVER returned to public API)
  file_path    text,          -- storage object path for signed URL generation
  preview_url  text,          -- tagged/watermarked preview (safe for public)
  preview_path text,          -- storage object path for signed preview URLs
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Public can read active beats
alter table public.beats enable row level security;

create policy "Public can read active beats"
  on public.beats for select
  using (is_active = true);

-- -------------------------------------------------------
-- orders
-- -------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default uuid_generate_v4(),
  customer_email   text not null,
  customer_name    text not null default '',
  beat_ids         text[] not null default '{}',
  license_type     text not null default 'standard',
  quantity_tier    integer not null default 1,
  total_price      numeric(10,2) not null default 0,
  stripe_session_id text unique,
  status           text not null default 'pending',
  created_at       timestamptz not null default now()
);

alter table public.orders enable row level security;
-- No public access — service role key only

-- -------------------------------------------------------
-- downloads
-- -------------------------------------------------------
create table if not exists public.downloads (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  token      text unique not null,
  expires_at timestamptz not null,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.downloads enable row level security;
-- No public access — service role key only

-- -------------------------------------------------------
-- Storage bucket: beats  *** MUST BE PRIVATE ***
-- -------------------------------------------------------
-- IMPORTANT: In Supabase Dashboard > Storage > beats bucket:
--   Toggle "Public bucket" OFF.
--   This prevents anyone with a direct URL from downloading beats.
--   Downloads are served via short-lived signed URLs (5 min) through
--   the /api/download/[token] route using the service role key.
--
-- insert into storage.buckets (id, name, public)
-- values ('beats', 'beats', false)   -- false = private
-- on conflict (id) do nothing;
--
-- No public read policy needed (service role bypasses RLS).
-- Upload policy for service role (admin upload route):
--
-- create policy "Service role can upload beats"
--   on storage.objects for insert
--   with check ( bucket_id = 'beats' );
--
-- To migrate existing beats already uploaded to a public bucket:
--   1. Toggle the bucket to private in the Supabase dashboard
--   2. Existing file_url columns will stop working for direct access
--   3. Downloads still work because they go through createSignedUrl
--
-- Run these migrations in Supabase SQL Editor if columns are missing:
-- alter table public.beats add column if not exists file_path text;
-- alter table public.beats add column if not exists preview_path text;
-- alter table public.beats add column if not exists cover_url text;
-- alter table public.beats add column if not exists pin_order integer;
-- alter table public.beats add column if not exists is_featured boolean not null default false;
-- alter table public.beats add column if not exists stems_path text;
-- alter table public.beats add column if not exists stems_url text;

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
create index if not exists beats_genre_idx on public.beats(genre);
create index if not exists beats_is_active_idx on public.beats(is_active);
create index if not exists orders_email_idx on public.orders(customer_email);
create index if not exists downloads_token_idx on public.downloads(token);
