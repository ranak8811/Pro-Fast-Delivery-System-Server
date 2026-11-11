export interface CacheEntry<T> {
  data: T;
  expires_at: number; // Unix timestamp in ms
}
