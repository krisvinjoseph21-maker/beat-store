interface BeatForEmbedding {
  title: string
  genre: string | null
  subgenre: string | null
  bpm: number
  key: string | null
  tags: string[] | null
}

/** Shared text template — must stay in sync with scripts/embed-beats.js. */
export function buildBeatEmbeddingText(beat: BeatForEmbedding): string {
  const parts = [
    beat.title,
    [beat.genre, beat.subgenre].filter(Boolean).join(' '),
    `${beat.bpm} BPM`,
    beat.key ? `key of ${beat.key}` : null,
    beat.tags?.length ? `Tags: ${beat.tags.join(', ')}` : null,
  ].filter(Boolean)
  return parts.join(' — ')
}
