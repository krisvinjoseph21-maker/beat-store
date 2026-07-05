import { describe, it, expect } from 'vitest'
import { checkPriceFloor, applyStructuredFilters, normalizeBpmRange, CHEAPEST_LICENSE_PRICE, type ExtractedFilters } from '../lib/vibe-filters'

const emptyFilters: ExtractedFilters = {
  priceMax: null,
  bpmMin: null,
  bpmMax: null,
  key: null,
  licenseType: null,
  genre: null,
}

describe('checkPriceFloor', () => {
  it('returns null when no price ceiling was mentioned', () => {
    expect(checkPriceFloor(null)).toBeNull()
  })

  it('returns null when the ceiling is at or above the cheapest license', () => {
    expect(checkPriceFloor(CHEAPEST_LICENSE_PRICE)).toBeNull()
    expect(checkPriceFloor(100)).toBeNull()
  })

  it('returns a warning when the ceiling is below the cheapest license (e.g. "under $30")', () => {
    const warning = checkPriceFloor(30)
    expect(warning).toContain('$30')
    expect(warning).toContain(`$${CHEAPEST_LICENSE_PRICE}`)
  })
})

describe('normalizeBpmRange', () => {
  it('leaves ranges alone that are already wide enough', () => {
    const filters = { ...emptyFilters, bpmMin: 100, bpmMax: 142 }
    expect(normalizeBpmRange(filters)).toEqual(filters)
  })

  it('widens an overly-narrow window an LLM might return for "around 140 bpm"', () => {
    const result = normalizeBpmRange({ ...emptyFilters, bpmMin: 139.5, bpmMax: 140.5 })
    expect(result.bpmMin).toBe(132)
    expect(result.bpmMax).toBe(148)
  })

  it('leaves a one-sided range untouched (only bpmMin or only bpmMax set)', () => {
    const onlyMin = { ...emptyFilters, bpmMin: 140 }
    expect(normalizeBpmRange(onlyMin)).toEqual(onlyMin)
  })
})

describe('applyStructuredFilters', () => {
  const rows = [
    { id: 'a', bpm: 140, key: 'Am', genre: 'Trap' },
    { id: 'b', bpm: 90, key: 'Fm', genre: 'R&B' },
    { id: 'c', bpm: 145, key: 'Am', genre: 'Drill' },
  ]

  it('returns all rows when filters is null', () => {
    expect(applyStructuredFilters(rows, null)).toEqual(rows)
  })

  it('filters by bpm range', () => {
    const result = applyStructuredFilters(rows, { ...emptyFilters, bpmMin: 100, bpmMax: 142 })
    expect(result.map((r) => r.id)).toEqual(['a'])
  })

  it('filters by genre case-insensitively (substring match)', () => {
    const result = applyStructuredFilters(rows, { ...emptyFilters, genre: 'trap' })
    expect(result.map((r) => r.id)).toEqual(['a'])
  })

  it('filters by key case-insensitively (exact match)', () => {
    const result = applyStructuredFilters(rows, { ...emptyFilters, key: 'am' })
    expect(result.map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('combines multiple filters', () => {
    const result = applyStructuredFilters(rows, { ...emptyFilters, key: 'am', bpmMax: 142 })
    expect(result.map((r) => r.id)).toEqual(['a'])
  })

  it('widens an overly-narrow bpm window so "around 140 bpm" still matches nearby beats', () => {
    // Widened to a 132-148 window: catches the 140 bpm beat and the 145 bpm
    // beat, correctly excludes the 90 bpm one.
    const result = applyStructuredFilters(rows, { ...emptyFilters, bpmMin: 139.5, bpmMax: 140.5 })
    expect(result.map((r) => r.id)).toEqual(['a', 'c'])
  })
})
