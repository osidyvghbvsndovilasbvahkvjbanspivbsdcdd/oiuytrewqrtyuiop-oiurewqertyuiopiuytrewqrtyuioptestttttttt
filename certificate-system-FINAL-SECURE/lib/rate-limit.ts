import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowInSeconds: number = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowInSeconds * 1000);

  try {
    await redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await redis.zcard(key);

    if (currentCount >= maxRequests) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetTime = oldest[0]?.score ? Math.ceil((oldest[0].score + windowInSeconds * 1000) / 1000) : now + windowInSeconds;

      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: resetTime,
      };
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, windowInSeconds);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - currentCount - 1,
      reset: Math.ceil((now + windowInSeconds * 1000) / 1000),
    };
  } catch (error) {
    // If Redis fails, allow the request
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: Math.ceil((now + windowInSeconds * 1000) / 1000),
    };
  }
}
