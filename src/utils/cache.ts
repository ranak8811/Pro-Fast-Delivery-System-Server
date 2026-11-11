import type { CacheEntry } from "../types/cache.js";

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Set a key with a time-to-live (TTL) in milliseconds. Default: 5 minutes (300,000ms)
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      expires_at: Date.now() + ttlMs,
    });
  }

  /**
   * Retrieve a value from cache if it exists and has not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires_at) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Delete a key explicitly (e.g. on status update).
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all expired entries to prevent memory leaks.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires_at) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get total number of active entries
   */
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

export const aiCache = new MemoryCache();
