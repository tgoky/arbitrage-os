// lib/ratelimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

export async function rateLimit(userId: string, limit = 10, window = 3600) {
  const key = `rate_limit:${userId}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    return {
      success: current <= limit,
      count: current,
      limit,
      reset: Date.now() + (window * 1000)
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { success: true, count: 0, limit, reset: Date.now() };
  }
}