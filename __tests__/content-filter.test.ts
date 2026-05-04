import { describe, it, expect } from 'vitest'
import { containsHarmfulContent } from '../lib/content-filter'

describe('containsHarmfulContent', () => {
  it('returns false for clean messages', () => {
    expect(containsHarmfulContent('Beat inquiry', 'Hey, can I license this beat for my mixtape?')).toBe(false)
  })

  it('returns false for edge-case clean messages', () => {
    expect(containsHarmfulContent('', '')).toBe(false)
    expect(containsHarmfulContent('Collab request', 'Looking for a producer to work with.')).toBe(false)
  })

  it('detects direct threats of violence', () => {
    expect(containsHarmfulContent('yo', 'I will kill you')).toBe(true)
    expect(containsHarmfulContent('yo', "you're dead")).toBe(true)
    expect(containsHarmfulContent('yo', 'gonna shoot you')).toBe(true)
  })

  it('detects kys abbreviation', () => {
    expect(containsHarmfulContent('sub', 'kys lol')).toBe(true)
  })

  it('detects location-based threats', () => {
    expect(containsHarmfulContent('sub', 'i know where you live')).toBe(true)
  })

  it('detects severe slurs including leet-speak variants', () => {
    // Regex targets leet-speak substitutions (1/! for i, 9 for g, 3 for e, etc.)
    expect(containsHarmfulContent('sub', 'n1gg3r')).toBe(true)
    expect(containsHarmfulContent('sub', 'f4gg0t')).toBe(true)
  })

  it('detects link spam (5+ URLs)', () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://spam${i}.com`).join(' ')
    expect(containsHarmfulContent('promo', urls)).toBe(true)
  })

  it('allows messages with fewer than 5 URLs', () => {
    const urls = 'Check https://soundcloud.com/artist and https://instagram.com/artist'
    expect(containsHarmfulContent('links', urls)).toBe(false)
  })

  it('is case-insensitive for threats', () => {
    expect(containsHarmfulContent('sub', 'I WILL KILL YOU')).toBe(true)
    expect(containsHarmfulContent('sub', "You'Re DeAd")).toBe(true)
  })

  it('does not flag partial word matches that are benign', () => {
    expect(containsHarmfulContent('subject', 'I killed it on this track')).toBe(false)
  })
})
