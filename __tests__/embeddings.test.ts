import { describe, it, expect } from 'vitest'
import { buildBeatEmbeddingText } from '../lib/embed-text'

describe('buildBeatEmbeddingText', () => {
  it('combines title, genre/subgenre, bpm, key, and tags', () => {
    const text = buildBeatEmbeddingText({
      title: 'Dark Intentions',
      genre: 'Trap',
      subgenre: 'Memphis',
      bpm: 140,
      key: 'Am',
      tags: ['dark', 'moody'],
    })
    expect(text).toBe('Dark Intentions — Trap Memphis — 140 BPM — key of Am — Tags: dark, moody')
  })

  it('omits missing genre/subgenre/key/tags without leaving empty segments', () => {
    const text = buildBeatEmbeddingText({
      title: 'Untitled',
      genre: null,
      subgenre: null,
      bpm: 128,
      key: null,
      tags: null,
    })
    expect(text).toBe('Untitled — 128 BPM')
  })

  it('joins genre and subgenre without a stray separator when subgenre is empty', () => {
    const text = buildBeatEmbeddingText({
      title: 'Slide Season',
      genre: 'Drill',
      subgenre: '',
      bpm: 145,
      key: 'Fm',
      tags: [],
    })
    expect(text).toBe('Slide Season — Drill — 145 BPM — key of Fm')
  })
})
