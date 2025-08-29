import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get all car IDs from the set
    const carIds = await kv.smembers('cars:all');
    
    // Get all car data
  const cars = (
    await Promise.all(
      carIds.map(async (id: string) => {
        const car = await kv.get<Record<string, any>>(`car:${id}`);
        return car ? { id, ...car } : null;
      })
    )
  ).filter(
    (c): c is { id: string } & Record<string, any> => c !== null
  );

    // Get all keys matching car:* pattern
    const allCarKeys = await kv.keys('car:*');
    const allCarData = await Promise.all(
      allCarKeys
        .filter((key: string) => !key.includes('availability'))
        .map(async (key: string) => {
          const data = await kv.get(key);
          return { key, data };
        })
    );

    return NextResponse.json({
      success: true,
      carIds,
      cars,
      allCarKeys,
      allCarData: allCarData.filter(item => item.data) // Filter out null/undefined
    });
  } catch (error) {
    console.error('Debug cars error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch car data'
      },
      { status: 500 }
    );
  }
}
