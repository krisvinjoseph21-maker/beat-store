import { describe, it, expect } from 'vitest'
import { checkPriceFloor, applyStructuredFilters, CHEAPEST_LICENSE_PRICE, type ExtractedFilters } from '../lib/vibe-filters'

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
})
