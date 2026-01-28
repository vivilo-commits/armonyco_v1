/**
 * Simple in-memory cache with TTL for API responses
 * Reduces database load by caching frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class ApiCache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL = 5000; // 5 seconds default

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        if (age > entry.ttl) {
            // Cache expired, remove it
            this.cache.delete(key);
            return null;
        }

        console.log(`[Cache] HIT: ${key} (age: ${age}ms)`);
        return entry.data;
    }

    /**
     * Set data in cache with optional TTL
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        });
        console.log(`[Cache] SET: ${key} (ttl: ${ttl || this.defaultTTL}ms)`);
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
        console.log(`[Cache] INVALIDATE: ${key}`);
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        let count = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }

        console.log(`[Cache] INVALIDATE_PATTERN: ${pattern} (${count} entries)`);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[Cache] CLEAR: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Cleanup expired entries (should be called periodically)
     */
    cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[Cache] CLEANUP: ${removed} expired entries removed`);
        }
    }
}

// Singleton instance
export const apiCache = new ApiCache();

// Cleanup expired entries every 30 seconds
if (typeof window !== 'undefined') {
    setInterval(() => {
        apiCache.cleanup();
    }, 30000);
}

/**
 * Cache key generator helpers
 */
export const cacheKeys = {
    dashboard: (orgId: string, startDate?: string, endDate?: string) =>
        `dashboard:${orgId}:${startDate || 'all'}:${endDate || 'all'}`,

    growth: (orgId: string, startDate?: string, endDate?: string) =>
        `growth:${orgId}:${startDate || 'all'}:${endDate || 'all'}`,

    escalations: (orgId: string, status?: string, startDate?: string, endDate?: string) =>
        `escalations:${orgId}:${status || 'all'}:${startDate || 'all'}:${endDate || 'all'}`,

    settings: (orgId: string) =>
        `settings:${orgId}`,

    teamMembers: (orgId: string) =>
        `team:${orgId}`,
};
