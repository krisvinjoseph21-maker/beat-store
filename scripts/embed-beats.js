#!/usr/bin/env node
/**
 * KJYOUCRAZY — Vibe Search: batch beat embedder
 *
 * Generates a 384-dim embedding for every beat's metadata (title, genre,
 * subgenre, bpm, key, tags) using the free, local Supabase/gte-small model
 * (via @huggingface/transformers — no OpenAI/Anthropic usage, no API cost)
 * and upserts it into public.beat_embeddings for pgvector similarity search.
 *
 * Usage:
 *   node scripts/embed-beats.js            # embed beats missing/stale embeddings
 *   node scripts/embed-beats.js --all      # re-embed every beat regardless
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Requires supabase-vibe-search.sql to have been run in the Supabase SQL
 * editor first (creates the pgvector extension, beat_embeddings table, and
 * match_beats() function).
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const MODEL_ID = 'Supabase/gte-small'

// ─── Load .env.local ────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌  .env.local not found.')
    process.exit(1)
  }
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Kept in sync with lib/embeddings.ts's buildBeatEmbeddingText — this script
// runs standalone via plain `node`, so it can't import that TS module directly.
function buildBeatEmbeddingText(beat) {
  const parts = [
    beat.title,
    [beat.genre, beat.subgenre].filter(Boolean).join(' '),
    `${beat.bpm} BPM`,
    beat.key ? `key of ${beat.key}` : null,
    beat.tags?.length ? `Tags: ${beat.tags.join(', ')}` : null,
  ].filter(Boolean)
  return parts.join(' — ')
}

async function main() {
  const reembedAll = process.argv.includes('--all')

  console.log('\n🔎  KJYOUCRAZY — Vibe Search batch embedder')
  console.log(`📦  Model: ${MODEL_ID}${reembedAll ? '  (re-embedding ALL beats)' : ''}\n`)

  const { data: beats, error: beatsError } = await supabase
    .from('beats')
    .select('id, title, bpm, key, genre, subgenre, tags')
  if (beatsError) {
    console.error('❌  Failed to fetch beats:', beatsError.message)
    process.exit(1)
  }

  let alreadyEmbedded = new Set()
  if (!reembedAll) {
    const { data: existing, error: existingError } = await supabase
      .from('beat_embeddings')
      .select('beat_id')
    if (existingError) {
      console.error('❌  Failed to fetch existing embeddings:', existingError.message)
      process.exit(1)
    }
    alreadyEmbedded = new Set((existing ?? []).map((r) => r.beat_id))
  }

  const toEmbed = beats.filter((b) => reembedAll || !alreadyEmbedded.has(b.id))
  console.log(`Found ${beats.length} beat(s), ${toEmbed.length} to embed.\n`)
  if (toEmbed.length === 0) {
    console.log('Nothing to do.')
    return
  }

  console.log('Loading embedding model (one-time download on first run)...')
  const { pipeline } = await import('@huggingface/transformers')
  const extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })
  console.log('Model ready.\n')

  let embedded = 0
  let failed = 0

  for (let i = 0; i < toEmbed.length; i++) {
    const beat = toEmbed[i]
    const progress = `[${i + 1}/${toEmbed.length}]`
    const text = buildBeatEmbeddingText(beat)

    try {
      const output = await extractor(text, { pooling: 'mean', normalize: true })
      const embedding = Array.from(output.data)

      const { error: upsertError } = await supabase
        .from('beat_embeddings')
        .upsert({
          beat_id: beat.id,
          embedding,
          embedded_text: text,
          model: MODEL_ID,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) throw new Error(upsertError.message)

      console.log(`${progress} ✅  "${beat.title}"`)
      embedded++
    } catch (err) {
      console.error(`${progress} ❌  "${beat.title}" — ${err.message}`)
      failed++
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅  Embedded : ${embedded}`)
  console.log(`❌  Failed   : ${failed}`)
  console.log(`📊  Total    : ${toEmbed.length}`)
  console.log('─'.repeat(50) + '\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
