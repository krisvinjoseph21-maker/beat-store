#!/usr/bin/env node
/**
 * KJYOUCRAZY — Auto-tagged full-length preview generator
 *
 * Takes the producer tag uploaded via the admin panel and mixes it into
 * every eligible beat's full-length audio, repeating every ~30 seconds
 * throughout the whole track (ducking the beat's volume slightly under
 * each tag hit), then uploads the result as that beat's new preview —
 * replacing the 30-second trim with a full-length, theft-protected stream.
 *
 * Usage:
 *   node scripts/tag-beats.js            # tag beats missing/stale tagged previews
 *   node scripts/tag-beats.js --all      # re-tag every eligible beat regardless
 *
 * Skips any beat with preview_is_manual = true (producer's own uploaded
 * preview override) — those are left untouched.
 *
 * Options:
 *   --interval <seconds>   how often the tag repeats (default 30)
 *   --offset <seconds>     when the first tag hit lands (default 2)
 *   --duck <0-1>           beat volume during each tag hit (default 0.75)
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Requires supabase-tagging.sql to have been run in the Supabase SQL
 * editor first, and a tag clip uploaded via the admin panel.
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
function flagValue(name, fallback) {
  const i = args.indexOf(name)
  if (i === -1 || !args[i + 1]) return fallback
  const v = Number(args[i + 1])
  return Number.isFinite(v) ? v : fallback
}
const INTERVAL = flagValue('--interval', 30)
const OFFSET = flagValue('--offset', 2)
const DUCK = Math.min(1, Math.max(0, flagValue('--duck', 0.75)))

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

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err)
      resolve(data.format.duration)
    })
  })
}

// ─── The actual mix ─────────────────────────────────────────────────────────

function mixTaggedPreview(beatPath, tagPath, beatDuration, tagDuration, outPath) {
  const offsets = []
  for (let t = OFFSET; t < beatDuration; t += INTERVAL) offsets.push(t)
  if (offsets.length === 0) offsets.push(0)

  const duckChain = offsets
    .map((t) => `volume=${DUCK}:enable='between(t,${t},${t + tagDuration})'`)
    .join(',')
  const filters = [`[0:a]${duckChain}[ducked]`]
  const tagLabels = offsets.map((t, i) => {
    const label = `tag${i}`
    const delayMs = Math.round(t * 1000)
    filters.push(`[1:a]adelay=${delayMs}|${delayMs},volume=1.6[${label}]`)
    return `[${label}]`
  })
  filters.push(`[ducked]${tagLabels.join('')}amix=inputs=${offsets.length + 1}:duration=first:dropout_transition=0,volume=1.8[out]`)

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(beatPath)
      .input(tagPath)
      .complexFilter(filters.join(';'), 'out')
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .format('mp3')
      .on('error', reject)
      .on('end', resolve)
      .save(outPath)
  })
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏷️   KJYOUCRAZY — Auto-tag batch processor')
  console.log(`⚙️   interval=${INTERVAL}s offset=${OFFSET}s duck=${DUCK}${reprocessAll ? '  (reprocessing ALL eligible beats)' : ''}\n`)

  const { data: tag, error: tagError } = await supabase
    .from('producer_tag')
    .select('id, storage_path')
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (tagError) { console.error('❌  Failed to fetch producer tag:', tagError.message); process.exit(1) }
  if (!tag) { console.error('❌  No tag uploaded yet — upload one via the admin panel first.'); process.exit(1) }

  const { data: beats, error: beatsError } = await supabase
    .from('beats')
    .select('id, title, file_path, preview_is_manual, preview_tagged_with_tag_id')
  if (beatsError) { console.error('❌  Failed to fetch beats:', beatsError.message); process.exit(1) }

  const eligible = beats.filter((b) => {
    if (b.preview_is_manual) return false
    if (!b.file_path) return false
    if (reprocessAll) return true
    return b.preview_tagged_with_tag_id !== tag.id
  })

  console.log(`Found ${beats.length} beat(s), ${eligible.length} eligible to tag.\n`)
  if (eligible.length === 0) { console.log('Nothing to do.'); return }

  const tagTempPath = await downloadToTemp(tag.storage_path, `tag-${crypto.randomUUID()}.audio`)
  const tagDuration = await getDuration(tagTempPath)

  let tagged = 0
  let failed = 0

  for (let i = 0; i < eligible.length; i++) {
    const beat = eligible[i]
    const progress = `[${i + 1}/${eligible.length}]`
    let beatTempPath, outPath
    try {
      beatTempPath = await downloadToTemp(beat.file_path, `beat-${crypto.randomUUID()}.audio`)
      const beatDuration = await getDuration(beatTempPath)

      outPath = path.join(os.tmpdir(), `tagged-${crypto.randomUUID()}.mp3`)
      await mixTaggedPreview(beatTempPath, tagTempPath, beatDuration, tagDuration, outPath)

      const buffer = fs.readFileSync(outPath)
      const storagePath = `preview/${Date.now()}-${beat.id}-tagged.mp3`
      const { error: uploadError } = await supabase.storage
        .from('beats')
        .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: false })
      if (uploadError) throw new Error(`storage upload: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from('beats').getPublicUrl(storagePath)

      const { error: updateError } = await supabase
        .from('beats')
        .update({
          preview_url: urlData.publicUrl,
          preview_path: storagePath,
          preview_is_tagged: true,
          preview_tagged_with_tag_id: tag.id,
        })
        .eq('id', beat.id)
      if (updateError) throw new Error(`db update: ${updateError.message}`)

      console.log(`${progress} ✅  "${beat.title}" (${beatDuration.toFixed(0)}s)`)
      tagged++
    } catch (err) {
      console.error(`${progress} ❌  "${beat.title}" — ${err.message}`)
      failed++
    } finally {
      if (beatTempPath && fs.existsSync(beatTempPath)) fs.unlinkSync(beatTempPath)
      if (outPath && fs.existsSync(outPath)) fs.unlinkSync(outPath)
    }
  }

  if (fs.existsSync(tagTempPath)) fs.unlinkSync(tagTempPath)

  console.log('\n' + '─'.repeat(50))
  console.log(`✅  Tagged  : ${tagged}`)
  console.log(`❌  Failed  : ${failed}`)
  console.log(`📊  Total   : ${eligible.length}`)
  console.log('─'.repeat(50) + '\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
