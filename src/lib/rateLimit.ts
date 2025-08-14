// lib/rateLimit.ts (note the camelCase to match imports)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export async function rateLimit(
  identifier: string, 
  limit: number = 10, 
  windowSeconds: number = 3600
): Promise<{
  success: boolean;
  count: number;
  limit: number;
  reset: number;
  remaining: number;
}> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds;
  const windowKey = `${key}:${windowStart}`;

  try {
    // Use sliding window approach with Redis
    const pipe = redis.pipeline();
    
    // Increment the counter for current window
    pipe.incr(windowKey);
    
    // Set expiration to window + buffer to ensure cleanup
    pipe.expire(windowKey, windowSeconds + 60);
    
    // Execute pipeline
    const results = await pipe.exec();
    
    if (!results || !Array.isArray(results)) {
      console.error('Unexpected Redis pipeline results:', results);
      return {
        success: true, // Fail open on Redis errors
        count: 0,
        limit,
        reset: now + (windowSeconds * 1000),
        remaining: limit
      };
    }

    const count = results[0] as number;
    const success = count <= limit;
    const remaining = Math.max(0, limit - count);
    const reset = (windowStart + windowSeconds) * 1000; // Next window start

    return {
      success,
      count,
      limit,
      reset,
      remaining
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    
    // Fail open - allow request if Redis is down
    return {
      success: true,
      count: 0,
      limit,
      reset: now + (windowSeconds * 1000),
      remaining: limit
    };
  }
}

// Enhanced rate limiting with different strategies
export async function rateLimitWithBurst(
  identifier: string,
  burstLimit: number = 5,
  sustainedLimit: number = 10,
  burstWindow: number = 60,
  sustainedWindow: number = 3600
) {
  const [burstResult, sustainedResult] = await Promise.all([
    rateLimit(`burst:${identifier}`, burstLimit, burstWindow),
    rateLimit(`sustained:${identifier}`, sustainedLimit, sustainedWindow)
  ]);

  return {
    success: burstResult.success && sustainedResult.success,
    burst: burstResult,
    sustained: sustainedResult,
    limitedBy: !burstResult.success ? 'burst' : !sustainedResult.success ? 'sustained' : null
  };
}

// Rate limiting for specific features
export const RateLimiters = {
  // Sales call analysis - 10 per hour
  salesCallAnalysis: (userId: string) => 
    rateLimit(`sales_call:${userId}`, 10, 3600),
  
  // Bulk import - 1 per hour  
  bulkImport: (userId: string) => 
    rateLimit(`bulk_import:${userId}`, 1, 3600),
  
  // General API calls - 100 per hour
  api: (userId: string) => 
    rateLimit(`api:${userId}`, 100, 3600),
  
  // Export operations - 20 per hour
  export: (userId: string) => 
    rateLimit(`export:${userId}`, 20, 3600)
};

// Utility to check rate limit without incrementing
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 3600
): Promise<{
  success: boolean;
  count: number;
  remaining: number;
  reset: number;
}> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds;
  const windowKey = `${key}:${windowStart}`;

  try {
    const count = await redis.get(windowKey) || 0;
    const currentCount = typeof count === 'number' ? count : parseInt(count as string) || 0;
    
    return {
      success: currentCount < limit, // Don't increment, just check
      count: currentCount,
      remaining: Math.max(0, limit - currentCount),
      reset: (windowStart + windowSeconds) * 1000
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      success: true,
      count: 0,
      remaining: limit,
      reset: now + (windowSeconds * 1000)
    };
  }
}