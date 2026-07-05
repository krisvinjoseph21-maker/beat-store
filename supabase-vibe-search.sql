-- ============================================================
-- KJYOUCRAZY — Vibe Search (pgvector semantic search)
-- Run this in the Supabase SQL Editor, after supabase-schema.sql
-- ============================================================

-- pgvector is free on all Supabase tiers.
create extension if not exists vector;

-- -------------------------------------------------------
-- beat_embeddings
-- -------------------------------------------------------
-- One row per beat, holding a 384-dim embedding of its metadata
-- (title/genre/subgenre/bpm/key/tags), generated locally by
-- scripts/embed-beats.js using the free Supabase/gte-small model —
-- no paid embedding API involved.
create table if not exists public.beat_embeddings (
  beat_id       uuid primary key references public.beats(id) on delete cascade,
  embedding     vector(384) not null,
  embedded_text text not null,
  model         text not null default 'Supabase/gte-small',
  updated_at    timestamptz not null default now()
);

alter table public.beat_embeddings enable row level security;
-- No public policies — same pattern as orders/downloads. This table is
-- only reachable through the match_beats() SECURITY DEFINER function
-- below, which hard-filters is_active itself and never selects private
-- beats columns (file_url/file_path/stems_path/preview_path).

create index if not exists beat_embeddings_hnsw_idx
  on public.beat_embeddings using hnsw (embedding vector_cosine_ops);

-- -------------------------------------------------------
-- match_beats — cosine similarity search over active beats
-- -------------------------------------------------------
create or replace function public.match_beats(
  query_embedding vector(384),
  match_count int default 24,
  min_similarity float default 0.0
)
returns table (
  id           uuid,
  title        text,
  bpm          integer,
  key          text,
  genre        text,
  subgenre     text,
  tags         text[],
  cover_url    text,
  preview_url  text,
  created_at   timestamptz,
  similarity   float
)
language sql stable security definer set search_path = public
as $$
  select
    b.id, b.title, b.bpm, b.key, b.genre, b.subgenre, b.tags,
    b.cover_url, b.preview_url, b.created_at,
    1 - (be.embedding <=> query_embedding) as similarity
  from public.beat_embeddings be
  join public.beats b on b.id = be.beat_id
  where b.is_active = true
    and 1 - (be.embedding <=> query_embedding) >= min_similarity
  order by be.embedding <=> query_embedding
  limit match_count;
$$;

-- Callable by unauthenticated storefront visitors — safe because the
-- function body above is the only thing enforcing is_active and column
-- visibility, regardless of which client (anon/service-role) invokes it.
grant execute on function public.match_beats(vector, int, float) to anon, authenticated;

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
create index if not exists beat_embeddings_updated_at_idx on public.beat_embeddings(updated_at);
