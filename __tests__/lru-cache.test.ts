import { describe, it, expect } from 'vitest'
import { LRUCache } from '../lib/lru-cache'

describe('LRUCache', () => {
  // ─── Construction ──────────────────────────────────────────────────────────

  it('starts empty', () => {
    const cache = new LRUCache<string, number>(3)
    expect(cache.size).toBe(0)
  })

  it('throws for capacity < 1', () => {
    expect(() => new LRUCache(0)).toThrow(RangeError)
    expect(() => new LRUCache(-5)).toThrow(RangeError)
  })

  it('throws for non-integer capacity', () => {
    expect(() => new LRUCache(2.5)).toThrow(RangeError)
  })

  // ─── Basic get / set ───────────────────────────────────────────────────────

  it('returns undefined for missing keys', () => {
    const cache = new LRUCache<string, number>(3)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
  })

  it('overwrites an existing key without growing the cache', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('a', 1)
    cache.set('a', 99)
    expect(cache.get('a')).toBe(99)
    expect(cache.size).toBe(1)
  })

  it('has() returns true only for present keys', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('x', 42)
    expect(cache.has('x')).toBe(true)
    expect(cache.has('y')).toBe(false)
  })

  // ─── Eviction ─────────────────────────────────────────────────────────────

  it('evicts the least recently used entry when over capacity', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3) // 'a' should be evicted
    expect(cache.has('a')).toBe(false)
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('reading a key promotes it and protects it from eviction', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // 'a' is now MRU; 'b' becomes LRU
    cache.set('c', 3) // 'b' should be evicted, not 'a'
    expect(cache.has('b')).toBe(false)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
  })

  it('updating an existing key promotes it to MRU', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10) // update 'a' → it becomes MRU; 'b' is LRU
    cache.set('c', 3)  // 'b' should be evicted
    expect(cache.has('b')).toBe(false)
    expect(cache.get('a')).toBe(10)
  })

  it('tracks size accurately across inserts and evictions', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.size).toBe(3)
    cache.set('d', 4) // evicts one
    expect(cache.size).toBe(3)
  })

  // ─── Delete / clear ───────────────────────────────────────────────────────

  it('delete removes an entry and returns true', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('a', 1)
    expect(cache.delete('a')).toBe(true)
    expect(cache.has('a')).toBe(false)
    expect(cache.size).toBe(0)
  })

  it('delete on a missing key returns false', () => {
    const cache = new LRUCache<string, number>(3)
    expect(cache.delete('ghost')).toBe(false)
  })

  it('clear empties the cache', () => {
    const cache = new LRUCache<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(false)
  })

  it('can set new entries after clear', () => {
    const cache = new LRUCache<string, number>(2)
    cache.set('a', 1)
    cache.clear()
    cache.set('b', 2)
    expect(cache.get('b')).toBe(2)
    expect(cache.size).toBe(1)
  })

  // ─── Capacity 1 edge case ─────────────────────────────────────────────────

  it('handles capacity of 1 correctly', () => {
    const cache = new LRUCache<string, number>(1)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.has('a')).toBe(false)
    expect(cache.get('b')).toBe(2)
    expect(cache.size).toBe(1)
  })

  // ─── Typed keys and values ────────────────────────────────────────────────

  it('works with numeric keys', () => {
    const cache = new LRUCache<number, string>(3)
    cache.set(1, 'one')
    cache.set(2, 'two')
    expect(cache.get(1)).toBe('one')
    expect(cache.get(2)).toBe('two')
  })

  it('works with object values', () => {
    const cache = new LRUCache<string, { score: number }>(3)
    cache.set('beat-1', { score: 0.95 })
    expect(cache.get('beat-1')).toEqual({ score: 0.95 })
  })
})
