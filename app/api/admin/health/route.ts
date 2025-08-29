import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { kv } from '@vercel/kv';

function isKvConfigured() {
  const env = process.env as Record<string, string | undefined>;
  const hasRest =
    (env.VERCEL_KV_REST_API_URL || env.KV_REST_API_URL) &&
    (env.VERCEL_KV_REST_API_TOKEN || env.KV_REST_API_TOKEN || env.VERCEL_KV_REST_API_READ_ONLY_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN);
  const hasUrl = env.KV_URL || env.REDIS_URL;
  return Boolean(hasRest || hasUrl);
}

export async function GET(request: NextRequest) {
  const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[Admin Health][${reqId}] start`);

  try {
    // Auth (JWT)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Admin Health][${reqId}] missing/invalid auth header`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      console.warn(`[Admin Health][${reqId}] JWT verification failed`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log(`[Admin Health][${reqId}] auth ok`, { userId: (user as any).userId || (user as any).id });

    const kvConfigured = isKvConfigured();
    if (!kvConfigured) {
      console.error(`[Admin Health][${reqId}] KV not configured`);
    }

    // Probe KV (read-only)
    let carsAllCount: number | null = null;
    let blogPostsAllCount: number | null = null;
    let blogCategoriesAllCount: number | null = null;
    let blogTagsAllCount: number | null = null;

    if (kvConfigured) {
      try {
        const [carsAll, postsAll, catsAll, tagsAll] = await Promise.all([
          kv.smembers('cars:all'),
          kv.smembers('blog:posts:all'),
          kv.smembers('blog:categories:all'),
          kv.smembers('blog:tags:all'),
        ]);
        carsAllCount = carsAll?.length ?? 0;
        blogPostsAllCount = postsAll?.length ?? 0;
        blogCategoriesAllCount = catsAll?.length ?? 0;
        blogTagsAllCount = tagsAll?.length ?? 0;
      } catch (e) {
        console.error(`[Admin Health][${reqId}] KV read error`, e);
      }
    }

    const result = {
      ok: true,
      kvConfigured,
      probes: {
        carsAllCount,
        blogPostsAllCount,
        blogCategoriesAllCount,
        blogTagsAllCount,
      },
      time: new Date().toISOString(),
    };

    console.log(`[Admin Health][${reqId}] result`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Health] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
