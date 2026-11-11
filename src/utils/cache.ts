export interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private cache: Map<string, CacheItem<T>>;
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 1000 * 60 * 5) {
    this.cache = new Map<string, CacheItem<T>>();
    this.defaultTtlMs = defaultTtlMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

export const aiCache = new MemoryCache(1000 * 60 * 5); // 5-minute TTL

export default aiCache;
