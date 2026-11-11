export class MemoryCache {
  constructor(defaultTtlMs = 1000 * 60 * 5) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  set(key, value, ttlMs) {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    this.cleanup();
    return this.cache.size;
  }
}

export const aiCache = new MemoryCache(1000 * 60 * 5); // 5-minute TTL

export default aiCache;
