import 'server-only'
import os from 'os'
import path from 'path'
export { buildBeatEmbeddingText } from '@/lib/embed-text'

// Local, offline embedding model — no OpenAI/Anthropic usage, no per-call cost.
// Supabase/gte-small (384 dims) is the model Supabase's own docs pair with
// Transformers.js for pgvector search. Runs on CPU via ONNX (WASM or the
// native onnxruntime-node binding if available).
const MODEL_ID = 'Supabase/gte-small'
export const EMBEDDING_DIMENSIONS = 384

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: 'mean'; normalize: true }
) => Promise<{ data: Float32Array | number[] }>

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null

// Module-scope singleton: cached only for the lifetime of a warm serverless
// instance (same tradeoff already accepted by lib/rate-limit.ts's in-memory
// store) — a cold start pays a one-time model download+load cost, warm
// invocations reuse this promise for free.
function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      // Vercel's deployment filesystem is read-only outside /tmp.
      env.cacheDir = path.join(os.tmpdir(), 'transformers-cache')
      return pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' }) as unknown as Promise<FeatureExtractionPipeline>
    })()
  }
  return extractorPromise
}

/** Embeds free-text into a normalized 384-dim vector for pgvector cosine search. */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}
