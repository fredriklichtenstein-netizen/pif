
// Simple in-memory cache for database results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class DatabaseCache {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  
  static set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  static delete(key: string): void {
    this.cache.delete(key);
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Cleanup expired entries
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Auto cleanup every 10 minutes
setInterval(() => DatabaseCache.cleanup(), 10 * 60 * 1000);
