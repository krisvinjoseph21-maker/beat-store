#!/usr/bin/env node
/**
 * KJYOUCRAZY — WAV → MP3 batch converter
 *
 * Beats are uploaded as a WAV master (file_path). This script finds every
 * beat missing an MP3 derivative, downloads its WAV master, converts it to
 * a 320kbps MP3 with ffmpeg, uploads the result to storage, and records the
 * path in beats.mp3_path.
 *
 * Delivery uses this at checkout:
 *   Basic Lease              -> mp3_path (falls back to the WAV if missing)
 *   Premium / Unlimited Lease -> file_path (WAV) + mp3_path (MP3)
 *
 * Usage:
 *   node scripts/convert-mp3.js            # convert beats missing an mp3_path
 *   node scripts/convert-mp3.js --all      # re-convert every eligible beat regardless
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Requires the mp3_path column (see supabase-schema.sql):
 *   alter table public.beats add column if not exists mp3_path text;
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path)
ffmpeg.setFfprobePath(require('@ffprobe-installer/ffprobe').path)

// ─── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const reprocessAll = args.includes('--all')

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

// ─── Storage helpers ────────────────────────────────────────────────────────

async function downloadToTemp(storagePath, tempName) {
  const { data, error } = await supabase.storage.from('beats').download(storagePath)
  if (error) throw new Error(`download ${storagePath}: ${error.message}`)
  const buffer = Buffer.from(await data.arrayBuffer())
  const tempPath = path.join(os.tmpdir(), tempName)
  fs.writeFileSync(tempPath, buffer)
  return tempPath
}

function convertToMp3(wavPath, outPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .format('mp3')
      .on('error', reject)
      .on('end', resolve)
      .save(outPath)
  })
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎧  KJYOUCRAZY — WAV → MP3 batch converter')
  console.log(`⚙️   ${reprocessAll ? 'reprocessing ALL eligible beats' : 'converting beats missing an mp3_path'}\n`)

  const { data: beats, error: beatsError } = await supabase
    .from('beats')
    .select('id, title, file_path, mp3_path')
  if (beatsError) { console.error('❌  Failed to fetch beats:', beatsError.message); process.exit(1) }

  const eligible = beats.filter((b) => {
    if (!b.file_path) return false
    if (reprocessAll) return true
    return !b.mp3_path
  })

  console.log(`Found ${beats.length} beat(s), ${eligible.length} eligible to convert.\n`)
  if (eligible.length === 0) { console.log('Nothing to do.'); return }

  let converted = 0
  let failed = 0

  for (let i = 0; i < eligible.length; i++) {
    const beat = eligible[i]
    const progress = `[${i + 1}/${eligible.length}]`
    let wavTempPath, outPath
    try {
      wavTempPath = await downloadToTemp(beat.file_path, `wav-${crypto.randomUUID()}.audio`)
      outPath = path.join(os.tmpdir(), `mp3-${crypto.randomUUID()}.mp3`)
      await convertToMp3(wavTempPath, outPath)

      const buffer = fs.readFileSync(outPath)
      const storagePath = `mp3/${Date.now()}-${beat.id}.mp3`
      const { error: uploadError } = await supabase.storage
        .from('beats')
        .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: false })
      if (uploadError) throw new Error(`storage upload: ${uploadError.message}`)

      const { error: updateError } = await supabase
        .from('beats')
        .update({ mp3_path: storagePath })
        .eq('id', beat.id)
      if (updateError) throw new Error(`db update: ${updateError.message}`)

      console.log(`${progress} ✅  "${beat.title}"`)
      converted++
    } catch (err) {
      console.error(`${progress} ❌  "${beat.title}" — ${err.message}`)
      failed++
    } finally {
      if (wavTempPath && fs.existsSync(wavTempPath)) fs.unlinkSync(wavTempPath)
      if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath)
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅  Converted : ${converted}`)
  console.log(`❌  Failed    : ${failed}`)
  console.log(`📊  Total     : ${eligible.length}`)
  console.log('─'.repeat(50) + '\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
