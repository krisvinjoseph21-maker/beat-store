import type { Beat } from './store'

// Circle of fifths position (0–11). Keys adjacent on the wheel share harmonic content.
const CIRCLE_OF_FIFTHS: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5,
  'F#': 6, 'Gb': 6, 'C#': 7, 'Db': 7,
  'G#': 8, 'Ab': 8, 'D#': 9, 'Eb': 9,
  'A#': 10, 'Bb': 10, F: 11,
}

const BPM_MIN = 60
const BPM_MAX = 220

/**
 * Parse a key string like "Am", "F#", "Db" into its root and mode.
 * Minor keys end with lowercase 'm'; everything else is major.
 */
export function parseKey(raw: string): { root: string; isMinor: boolean } {
  const trimmed = raw.trim()
  const isMinor = trimmed.endsWith('m')
  const root = isMinor ? trimmed.slice(0, -1) : trimmed
  return { root, isMinor }
}

/**
 * Normalised circular distance on the circle of fifths in [0, 1].
 * 0 = same key, 1 = tritone (maximally distant).
 */
export function cofDistance(keyA: string, keyB: string): number {
  const posA = CIRCLE_OF_FIFTHS[keyA] ?? 0
  const posB = CIRCLE_OF_FIFTHS[keyB] ?? 0
  const dist = Math.abs(posA - posB)
  // Wrap around the circle (12 positions total)
  return Math.min(dist, 12 - dist) / 6
}

/**
 * Build a fixed-length numeric feature vector for a beat.
 *
 * Dimensions:
 *   [0]      normalised BPM              ∈ [0, 1]
 *   [1]      circle-of-fifths position   ∈ [0, 1]
 *   [2]      minor flag                  ∈ {0, 1}
 *   [3..G]   one-hot genre               ∈ {0, 1}
 *   [G..G+T] binary tag presence         ∈ {0, 1}
 */
export function toFeatureVector(
  beat: Beat,
  genreVocab: string[],
  tagVocab: string[],
): number[] {
  const bpmNorm = Math.max(0, Math.min(1, (beat.bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)))

  const { root, isMinor } = parseKey(beat.key ?? '')
  const cofPos = (CIRCLE_OF_FIFTHS[root] ?? 0) / 11
  const minorFlag = isMinor ? 1 : 0

  const genreVec = genreVocab.map((g) => (g === beat.genre ? 1 : 0))
  const tagVec = tagVocab.map((t) => (beat.tags?.includes(t) ? 1 : 0))

  return [bpmNorm, cofPos, minorFlag, ...genreVec, ...tagVec]
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [0, 1]: 1 = identical direction, 0 = orthogonal.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

export interface SimilarBeat {
  id: string
  title: string
  score: number
}

/**
 * Find the top-N beats most similar to the target beat.
 * Builds shared genre/tag vocabularies from the full catalog so that
 * all feature vectors occupy the same space before comparison.
 */
export function findSimilar(target: Beat, catalog: Beat[], topN = 5): SimilarBeat[] {
  const genreVocab = [...new Set(catalog.map((b) => b.genre).filter(Boolean))]
  const tagVocab = [...new Set(catalog.flatMap((b) => b.tags ?? []))]

  const targetVec = toFeatureVector(target, genreVocab, tagVocab)

  return catalog
    .filter((b) => b.id !== target.id && b.is_active)
    .map((b) => ({
      id: b.id,
      title: b.title,
      score: cosineSimilarity(targetVec, toFeatureVector(b, genreVocab, tagVocab)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}
