// Rate limiting utility using Vercel KV

import { kv } from '@vercel/kv';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Prefix for KV keys
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Get current requests in the window using zrange with scores
      const requests = await kv.zrange(key, 0, -1, { withScores: true }) as Array<[string, number]>;
      
      // Filter requests within the window
      const validRequests = requests.filter(([_, score]) => score >= windowStart);
      
      if (validRequests.length >= this.config.maxRequests) {
        // Rate limit exceeded
        const oldestRequest = validRequests[0];
        const resetTime = oldestRequest ? oldestRequest[1] + this.config.windowMs : now + this.config.windowMs;
        
        return {
          success: false,
          remaining: 0,
          resetTime,
          error: 'Rate limit exceeded'
        };
      }

      // Add current request
      await kv.zadd(key, { score: now, member: now.toString() });
      
      // Set expiration on the key (clean up after window)
      await kv.expire(key, Math.ceil(this.config.windowMs / 1000));

      return {
        success: true,
        remaining: this.config.maxRequests - validRequests.length - 1,
        resetTime: now + this.config.windowMs
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request but log the issue
      return {
        success: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs
      };
    }
  }

  async getRemaining(identifier: string): Promise<number> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      const requests = await kv.zrange(key, 0, -1, { withScores: true }) as Array<[string, number]>;
      const validRequests = requests.filter(([_, score]) => score >= windowStart);
      return Math.max(0, this.config.maxRequests - validRequests.length);
    } catch (error) {
      console.error('Error getting remaining requests:', error);
      return this.config.maxRequests;
    }
  }
}

// Pre-configured rate limiters
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyPrefix: 'rate_limit:login'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  keyPrefix: 'rate_limit:api'
});

export const contactFormRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 submissions per hour
  keyPrefix: 'rate_limit:contact'
});

export const rentalCreationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 rental creations per hour
  keyPrefix: 'rate_limit:rental'
});

export const adminApiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // 200 requests per minute for admin API
  keyPrefix: 'rate_limit:admin_api'
});

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // For additional security, you could also include user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

// Middleware function for rate limiting
export async function withRateLimit(
  request: Request,
  rateLimiter: RateLimiter,
  identifier?: string
): Promise<{ success: boolean; error?: string; remaining?: number; resetTime?: number }> {
  const clientId = identifier || getClientIdentifier(request);
  const result = await rateLimiter.checkLimit(clientId);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      remaining: result.remaining,
      resetTime: result.resetTime
    };
  }
  
  return {
    success: true,
    remaining: result.remaining,
    resetTime: result.resetTime
  };
} 