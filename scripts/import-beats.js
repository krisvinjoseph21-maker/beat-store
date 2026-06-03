#!/usr/bin/env node
/**
 * KJYOUCRAZY — Bulk Beat Importer
 *
 * Usage:
 *   node scripts/import-beats.js <beats-folder> [--previews <previews-folder>]
 *
 * ──────────────────────────────────────────────────────────────
 * Folder structure (beats folder):
 *
 *   Beats/
 *     Trap/
 *       Memphis/
 *         Dark_Intentions_140bpm_Am.mp3
 *         Slide_Season_138bpm_Fm.mp3
 *       Deadpool_145bpm_Dm.mp3       ← no subgenre, goes directly under Trap
 *     Reggaeton/
 *       El_Patron_100bpm_Gm.mp3
 *     Drill/
 *       UK Drill/
 *         Midnight_145bpm_Dm.mp3
 *
 * Top-level folders  = genre
 * Sub-folders        = subgenre (optional)
 * Files directly in a genre folder get subgenre = ""
 *
 * ──────────────────────────────────────────────────────────────
 * Optional: previews folder (same structure, matched by filename stem)
 *
 *   Previews/
 *     Trap/
 *       Memphis/
 *         Dark_Intentions_140bpm_Am.mp3   ← tagged version, matched by name
 *
 *   node scripts/import-beats.js ./Beats --previews ./Previews
 *
 * If no previews folder is given, the full beat is also used as preview
 * (you can upload proper tagged previews later via the admin panel).
 *
 * ──────────────────────────────────────────────────────────────
 * BPM detection: looks for "140bpm", "140BPM", or a standalone 2-3 digit
 *                number in the 60–220 range in the filename.
 * Key detection: looks for Am, Fm, Dm, Gm, F#m, Cmaj etc.
 * Title:         everything left after removing BPM, key, underscores.
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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

// ─── Filename parsers ────────────────────────────────────────────────────────

function extractBpm(filename) {
  const m = filename.match(/[_\s\-]?(\d{2,3})\s?bpm/i)
  if (m) return parseInt(m[1], 10)
  const nums = filename.match(/(?<![a-zA-Z])(\d{2,3})(?![a-zA-Z])/g)
  if (nums) {
    for (const n of nums) {
      const v = parseInt(n, 10)
      if (v >= 60 && v <= 220) return v
    }
  }
  return 140
}

function extractKey(filename) {
  const patterns = [
    /\b([A-G][#b]?m)\b/,
    /\b([A-G][#b]?maj)\b/i,
    /[_\s\-]([A-G][#b]?m)[_\s\-.]/,
    /[_\s\-]([A-G][#b]?)[_\s\-.]/,
  ]
  for (const re of patterns) {
    const m = filename.match(re)
    if (m) return m[1]
  }
  return 'Am'
}

function parseTitle(filename) {
  let name = path.parse(filename).name
  name = name.replace(/[_\s\-]?\d{2,3}\s?bpm/gi, '')
  name = name.replace(/[_\s\-][A-G][#b]?m\b/g, '')
  name = name.replace(/[_\s\-][A-G][#b]?maj\b/gi, '')
  name = name.replace(/[_\s\-][A-G][#b]\b(?=[_\s\-.]|$)/g, '')
  name = name.replace(/[_\-]+/g, ' ').trim()
  name = name.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  return name || path.parse(filename).name
}

// ─── File collection ─────────────────────────────────────────────────────────

/** Returns { genre, subgenre, file, fullPath, stem } for every audio file */
function collectFiles(root) {
  const results = []
  if (!fs.existsSync(root)) return results
  for (const genre of fs.readdirSync(root)) {
    const genrePath = path.join(root, genre)
    if (!fs.statSync(genrePath).isDirectory()) continue
    for (const sub of fs.readdirSync(genrePath)) {
      const subPath = path.join(genrePath, sub)
      if (fs.statSync(subPath).isDirectory()) {
        // sub is a subgenre folder
        for (const file of fs.readdirSync(subPath)) {
          if (/\.(mp3|wav|flac|aif|aiff)$/i.test(file)) {
            results.push({
              genre,
              subgenre: sub,
              file,
              fullPath: path.join(subPath, file),
              stem: path.parse(file).name.toLowerCase(),
            })
          }
        }
      } else if (/\.(mp3|wav|flac|aif|aiff)$/i.test(sub)) {
        // file directly in genre folder (no subgenre)
        results.push({
          genre,
          subgenre: '',
          file: sub,
          fullPath: subPath,
          stem: path.parse(sub).name.toLowerCase(),
        })
      }
    }
  }
  return results
}

/**
 * Build a map of stem → fullPath from the previews folder.
 * Used to match preview files to full beats by filename stem.
 */
function buildPreviewMap(previewRoot) {
  const map = new Map()
  if (!previewRoot || !fs.existsSync(previewRoot)) return map
  const files = collectFiles(previewRoot)
  for (const f of files) map.set(f.stem, f.fullPath)
  return map
}

// ─── Duplicate detection ─────────────────────────────────────────────────────

async function getExistingPaths() {
  const { data, error } = await supabase.from('beats').select('file_path')
  if (error) {
    console.error('DB error:', error.message)
    return new Set()
  }
  return new Set((data ?? []).map((r) => r.file_path).filter(Boolean))
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadToStorage(localPath, storagePath, contentType) {
  const buffer = fs.readFileSync(localPath)
  const { data, error } = await supabase.storage
    .from('beats')
    .upload(storagePath, buffer, { contentType, upsert: false })

  if (error) {
    if (error.message?.includes('already exists')) {
      return { path: storagePath, alreadyExisted: true }
    }
    throw new Error(`Storage error: ${error.message}`)
  }
  return { path: data.path, alreadyExisted: false }
}

function contentType(filename) {
  if (/\.mp3$/i.test(filename)) return 'audio/mpeg'
  if (/\.wav$/i.test(filename)) return 'audio/wav'
  if (/\.flac$/i.test(filename)) return 'audio/flac'
  return 'audio/mpeg'
}

function safePath(str) {
  return str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-./]/g, '')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  if (!args[0]) {
    console.error('Usage: node scripts/import-beats.js <beats-folder> [--previews <previews-folder>]')
    process.exit(1)
  }

  const beatsFolder = path.resolve(args[0])
  let previewsFolder = null
  const previewFlag = args.indexOf('--previews')
  if (previewFlag !== -1 && args[previewFlag + 1]) {
    previewsFolder = path.resolve(args[previewFlag + 1])
  }

  if (!fs.existsSync(beatsFolder)) {
    console.error(`❌  Folder not found: ${beatsFolder}`)
    process.exit(1)
  }

  console.log('\n🎵  KJYOUCRAZY — Bulk Beat Importer')
  console.log(`📁  Beats   : ${beatsFolder}`)
  if (previewsFolder) console.log(`🎧  Previews: ${previewsFolder}`)
  else console.log(`🎧  Previews: none (full beat will be used as preview — replace later in admin)`)
  console.log()

  const files = collectFiles(beatsFolder)
  console.log(`Found ${files.length} audio file(s).\n`)
  if (files.length === 0) { console.log('Nothing to import.'); return }

  const previewMap = buildPreviewMap(previewsFolder)
  const existingPaths = await getExistingPaths()

  let imported = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < files.length; i++) {
    const { genre, subgenre, file, fullPath, stem } = files[i]
    const progress = `[${i + 1}/${files.length}]`
    const slug = safePath(`${genre}/${subgenre || 'misc'}/${file}`)
    const fullStoragePath = `full/${slug}`

    if (existingPaths.has(fullStoragePath)) {
      console.log(`${progress} SKIP  ${file} (already imported)`)
      skipped++
      continue
    }

    const title = parseTitle(file)
    const bpm = extractBpm(file)
    const key = extractKey(file)
    const previewLocal = previewMap.get(stem) ?? fullPath
    const previewStoragePath = `preview/${slug}`

    console.log(`${progress} IMPORT  "${title}"  —  ${genre}${subgenre ? '/' + subgenre : ''} · ${bpm}bpm · ${key}`)

    try {
      // Upload full beat
      const { path: uploadedFullPath } = await uploadToStorage(fullPath, fullStoragePath, contentType(file))

      // Upload preview (separate tagged file or same file as fallback)
      let previewPublicUrl = null
      try {
        const { path: uploadedPreview } = await uploadToStorage(previewLocal, previewStoragePath, contentType(file))
        const { data: urlData } = supabase.storage.from('beats').getPublicUrl(uploadedPreview)
        previewPublicUrl = urlData?.publicUrl ?? null
      } catch (previewErr) {
        console.log(`  ⚠️  Preview upload failed (${previewErr.message}), will be null`)
      }

      // Insert DB record
      const tags = [
        genre.toLowerCase(),
        subgenre ? subgenre.toLowerCase() : null,
        key.toLowerCase(),
      ].filter(Boolean)

      const { error: dbError } = await supabase.from('beats').insert({
        title,
        bpm,
        key,
        genre,
        subgenre: subgenre || '',
        tags,
        file_url: uploadedFullPath,  // stores the storage path (not a public URL)
        preview_url: previewPublicUrl,
        is_active: true,
      })

      if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

      console.log(`  ✅  Done`)
      imported++
    } catch (err) {
      console.error(`  ❌  Failed: ${err.message}`)
      failed++
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅  Imported : ${imported}`)
  console.log(`⏭️   Skipped  : ${skipped}`)
  console.log(`❌  Failed   : ${failed}`)
  console.log(`📊  Total    : ${files.length}`)
  console.log('─'.repeat(50))
  if (imported > 0 && !previewsFolder) {
    console.log('\n💡  Tip: Upload tagged previews via Admin → Upload to replace the preview_url for each beat.')
  }
  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
