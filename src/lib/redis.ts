// lib/redis.ts - Upstash Redis Setup
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache key generators
export const cacheKeys = {
  userWorkItems: (userId: string, workspaceId?: string) => 
    `work_items:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
  
  salesCalls: (userId: string, workspaceId?: string) =>
    `sales_calls:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
    
  growthPlans: (userId: string, workspaceId?: string) =>
    `growth_plans:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
    
  pricingCalcs: (userId: string, workspaceId?: string) =>
    `pricing_calcs:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
    
  nicheReports: (userId: string, workspaceId?: string) =>
    `niche_reports:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
    
  coldEmails: (userId: string, workspaceId?: string) =>
    `cold_emails:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
    
  offers: (userId: string, workspaceId?: string) =>
    `offers:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
};

// Cache TTL (Time To Live) in seconds
export const cacheTTL = {
  workItems: 300,     // 5 minutes for dashboard data
  individual: 1800,   // 30 minutes for individual items
  analytics: 600,     // 10 minutes for analytics
  short: 60,         // 1 minute for frequently changing data
};

// Cache utility functions
export const cacheUtils = {
  // Get from cache with fallback
  async getWithFallback<T>(
    key: string, 
    fallbackFn: () => Promise<T>, 
    ttl: number = cacheTTL.workItems
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await redis.get(key);
      
      if (cached) {
        console.log(` Cache HIT: ${key}`);
        return cached as T;
      }
      
      console.log(`💫 Cache MISS: ${key} - Fetching fresh data`);
      
      // Cache miss, get fresh data
      const freshData = await fallbackFn();
      
      // Store in cache for future requests
      await redis.setex(key, ttl, JSON.stringify(freshData));
      
      return freshData;
    } catch (error) {
      console.warn(`⚠️ Cache error for ${key}:`, error);
      // Fallback to direct fetch if Redis fails
      return await fallbackFn();
    }
  },

  // Invalidate specific cache keys
  async invalidate(keys: string | string[]): Promise<void> {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      await redis.del(...keysArray);
      console.log(`🗑️ Cache invalidated: ${keysArray.join(', ')}`);
    } catch (error) {
      console.warn('⚠️ Cache invalidation failed:', error);
    }
  },

  // Invalidate all user work items (when something changes)
  async invalidateUserWork(userId: string, workspaceId?: string): Promise<void> {
    const keys = [
      cacheKeys.userWorkItems(userId, workspaceId),
      cacheKeys.salesCalls(userId, workspaceId),
      cacheKeys.growthPlans(userId, workspaceId),
      cacheKeys.pricingCalcs(userId, workspaceId),
      cacheKeys.nicheReports(userId, workspaceId),
      cacheKeys.coldEmails(userId, workspaceId),
      cacheKeys.offers(userId, workspaceId),
    ];
    
    await this.invalidate(keys);
  },

  // Set cache manually
  async set<T>(key: string, data: T, ttl: number = cacheTTL.workItems): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.warn(`⚠️ Cache set error for ${key}:`, error);
    }
  },

  // Get cache stats
  async getStats(): Promise<any> {
    try {


    } catch (error) {
      console.warn('⚠️ Failed to get cache stats:', error);
      return null;
    }
  }
};

// Cached API route wrapper
export function withCache<T>(
  key: string,
  handler: () => Promise<T>,
  ttl: number = cacheTTL.workItems
) {
  return cacheUtils.getWithFallback(key, handler, ttl);
}
