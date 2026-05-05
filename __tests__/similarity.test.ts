import { describe, it, expect } from 'vitest'
import { cosineSimilarity, parseKey, cofDistance, toFeatureVector, findSimilar } from '../lib/similarity'
import type { Beat } from '../lib/store'

const makeBeat = (overrides: Partial<Beat> = {}): Beat => ({
  id: 'beat-x',
  title: 'Test Beat',
  bpm: 140,
  key: 'Am',
  genre: 'Trap',
  subgenre: 'Dark Trap',
  tags: ['dark', 'hard'],
  file_url: null,
  preview_url: null,
  cover_url: null,
  stems_path: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  ...overrides,
})

// ─── cosineSimilarity ──────────────────────────────────────────────────────────

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('returns 0 when either vector is the zero vector', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0)
  })

  it('is commutative', () => {
    const a = [0.5, 0.2, 0.8]
    const b = [0.1, 0.9, 0.3]
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a))
  })

  it('is bounded in [0, 1] for non-negative vectors', () => {
    const score = cosineSimilarity([0.3, 0.7, 0.5], [0.8, 0.1, 0.4])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })
})

// ─── parseKey ─────────────────────────────────────────────────────────────────

describe('parseKey', () => {
  it('identifies minor keys by trailing m', () => {
    expect(parseKey('Am')).toEqual({ root: 'A', isMinor: true })
    expect(parseKey('F#m')).toEqual({ root: 'F#', isMinor: true })
  })

  it('identifies major keys (no trailing m)', () => {
    expect(parseKey('C')).toEqual({ root: 'C', isMinor: false })
    expect(parseKey('Bb')).toEqual({ root: 'Bb', isMinor: false })
  })
})

// ─── cofDistance ──────────────────────────────────────────────────────────────

describe('cofDistance', () => {
  it('returns 0 for the same key', () => {
    expect(cofDistance('C', 'C')).toBe(0)
  })

  it('returns max distance for the tritone (C vs F#)', () => {
    // F# is 6 steps away — maximum distance on the circle of fifths
    expect(cofDistance('C', 'F#')).toBeCloseTo(1)
  })

  it('wraps around the circle correctly (C to F is 1 step counter-clockwise)', () => {
    // C=0, F=11 → min(11, 1) = 1 → 1/6 ≈ 0.167
    expect(cofDistance('C', 'F')).toBeCloseTo(1 / 6)
  })

  it('is symmetric', () => {
    expect(cofDistance('D', 'G')).toBeCloseTo(cofDistance('G', 'D'))
  })
})

// ─── toFeatureVector ──────────────────────────────────────────────────────────

describe('toFeatureVector', () => {
  const genres = ['Trap', 'Drill', 'R&B']
  const tags = ['dark', 'hard', 'melodic']

  it('produces a vector of the correct length', () => {
    const beat = makeBeat()
    // 3 base features + 3 genre dims + 3 tag dims = 9
    expect(toFeatureVector(beat, genres, tags)).toHaveLength(3 + genres.length + tags.length)
  })

  it('normalises BPM to [0, 1]', () => {
    const vec = toFeatureVector(makeBeat({ bpm: 140 }), genres, tags)
    expect(vec[0]).toBeGreaterThan(0)
    expect(vec[0]).toBeLessThan(1)
  })

  it('sets the minor flag to 1 for a minor key beat', () => {
    const vec = toFeatureVector(makeBeat({ key: 'Am' }), genres, tags)
    expect(vec[2]).toBe(1)
  })

  it('sets the minor flag to 0 for a major key beat', () => {
    const vec = toFeatureVector(makeBeat({ key: 'C' }), genres, tags)
    expect(vec[2]).toBe(0)
  })

  it('one-hot encodes genre correctly', () => {
    const vec = toFeatureVector(makeBeat({ genre: 'Drill' }), genres, tags)
    const genreSlice = vec.slice(3, 3 + genres.length)
    expect(genreSlice).toEqual([0, 1, 0]) // Drill is index 1
  })

  it('encodes tag presence as binary', () => {
    const vec = toFeatureVector(makeBeat({ tags: ['melodic'] }), genres, tags)
    const tagSlice = vec.slice(3 + genres.length)
    expect(tagSlice).toEqual([0, 0, 1]) // only melodic present
  })
})

// ─── findSimilar ──────────────────────────────────────────────────────────────

describe('findSimilar', () => {
  const catalog: Beat[] = [
    makeBeat({ id: 'a', genre: 'Trap', bpm: 140, key: 'Am', tags: ['dark'] }),
    makeBeat({ id: 'b', genre: 'Trap', bpm: 142, key: 'Am', tags: ['dark', 'hard'] }),
    makeBeat({ id: 'c', genre: 'R&B',  bpm: 90,  key: 'Gm', tags: ['melodic', 'smooth'] }),
    makeBeat({ id: 'd', genre: 'Drill', bpm: 145, key: 'Dm', tags: ['hard'] }),
  ]

  it('excludes the target beat from results', () => {
    const results = findSimilar(catalog[0], catalog)
    expect(results.every((r) => r.id !== 'a')).toBe(true)
  })

  it('excludes inactive beats', () => {
    const inactive = makeBeat({ id: 'z', is_active: false })
    const results = findSimilar(catalog[0], [...catalog, inactive])
    expect(results.every((r) => r.id !== 'z')).toBe(true)
  })

  it('returns results sorted by descending score', () => {
    const results = findSimilar(catalog[0], catalog)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('respects the topN limit', () => {
    expect(findSimilar(catalog[0], catalog, 2)).toHaveLength(2)
  })

  it('ranks a near-identical beat higher than a stylistically distant one', () => {
    const results = findSimilar(catalog[0], catalog) // target = beat 'a' (Trap, 140bpm, Am)
    const idxB = results.findIndex((r) => r.id === 'b') // very similar
    const idxC = results.findIndex((r) => r.id === 'c') // very different
    expect(idxB).toBeLessThan(idxC)
  })
})
