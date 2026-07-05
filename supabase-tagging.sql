-- ============================================================
-- KJYOUCRAZY — Auto-tagged full-length previews
-- Run this in the Supabase SQL Editor, after supabase-schema.sql
-- ============================================================

-- -------------------------------------------------------
-- producer_tag — the reusable voice-tag clip, uploaded once via the
-- admin panel and re-applied to the catalog by scripts/tag-beats.js.
-- -------------------------------------------------------
create table if not exists public.producer_tag (
  id           uuid primary key default uuid_generate_v4(),
  storage_path text not null,
  public_url   text not null,
  uploaded_at  timestamptz not null default now()
);

alter table public.producer_tag enable row level security;
-- No public policies — same pattern as orders/downloads. Admin/service-role only.

create index if not exists producer_tag_uploaded_at_idx on public.producer_tag(uploaded_at desc);

-- -------------------------------------------------------
-- beats — tagging bookkeeping columns
-- -------------------------------------------------------
-- true only when the producer deliberately uploaded a custom preview
-- file (AdminClient.tsx's autoPreview === false). scripts/tag-beats.js
-- must skip these beats entirely.
alter table public.beats add column if not exists preview_is_manual boolean not null default false;

-- Public-facing signal: true once scripts/tag-beats.js has generated a
-- real full-length tagged preview. Read by the storefront player to
-- decide whether the 30s safety cutoff applies (see BottomPlayer.tsx).
alter table public.beats add column if not exists preview_is_tagged boolean not null default false;

-- Which producer_tag version produced the current preview_url — lets the
-- script detect "the tag changed since this beat was last processed."
alter table public.beats add column if not exists preview_tagged_with_tag_id uuid references public.producer_tag(id);

-- beats already has a public "select using (is_active = true)" RLS
-- policy (supabase-schema.sql) — these new columns ride along under that
-- automatically, no RLS changes needed here.
