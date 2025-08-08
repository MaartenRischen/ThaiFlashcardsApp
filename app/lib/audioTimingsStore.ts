import type { AudioTiming } from '@/app/lib/video-lesson-generator';

// In-memory store for short-lived timings. Suitable for single-node deployments (Railway).
// Keys auto-expire after TTL.

type Stored = { timings: AudioTiming[]; expiresAt: number };

const store = new Map<string, Stored>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function putTimings(id: string, timings: AudioTiming[], ttlMs: number = DEFAULT_TTL_MS): void {
  const expiresAt = Date.now() + ttlMs;
  store.set(id, { timings, expiresAt });
}

export function getTimings(id: string): AudioTiming[] | null {
  const item = store.get(id);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    store.delete(id);
    return null;
  }
  return item.timings;
}

export function deleteTimings(id: string): void {
  store.delete(id);
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.expiresAt) store.delete(key);
  }
}, 60 * 1000).unref?.();


