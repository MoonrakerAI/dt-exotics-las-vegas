import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get all invoice IDs
    const invoiceIds = await kv.smembers('invoices:all');
    
    // Get all invoice data
    const invoices = await Promise.all(
      invoiceIds.map(async (id: string) => {
        const invoice = await kv.get(`invoice:${id}`);
        return { id, ...invoice };
      })
    );

    // Get all invoice-related keys
    const invoiceKeys = await kv.keys('invoice:*');
    const invoicesAllKeys = await kv.keys('invoices:*');
    const allKeys = [...new Set([...invoiceKeys, ...invoicesAllKeys])];

    return NextResponse.json({
      success: true,
      invoiceIds,
      invoices: invoices.filter(invoice => invoice.id), // Filter out null/undefined
      allKeys,
      counts: {
        invoices: invoices.length,
        invoiceKeys: invoiceKeys.length,
        allKeys: allKeys.length
      }
    });
  } catch (error) {
    console.error('Debug invoices error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch invoice data'
      },
      { status: 500 }
    );
  }
}
