import type { AudioTiming } from '@/app/lib/video-lesson-generator';

// In-memory store for short-lived timings. Suitable for single-node deployments (Railway).
// Keys auto-expire after TTL.

export type AudioLessonMeta = { timings: AudioTiming[]; order?: number[] };
type Stored = { meta: AudioLessonMeta; expiresAt: number };

const store = new Map<string, Stored>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function putTimings(id: string, meta: AudioLessonMeta, ttlMs: number = DEFAULT_TTL_MS): void {
  const expiresAt = Date.now() + ttlMs;
  store.set(id, { meta, expiresAt });
}

export function getTimings(id: string): AudioLessonMeta | null {
  const item = store.get(id);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    store.delete(id);
    return null;
  }
  return item.meta;
}

export function deleteTimings(id: string): void {
  store.delete(id);
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  store.forEach((value, key) => {
    if (now > value.expiresAt) store.delete(key);
  });
}, 60 * 1000).unref?.();


