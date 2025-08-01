import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { kv } from '@vercel/kv';
import { Invoice } from '@/app/types/invoice';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<{user: any} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await verifyJWT(token);
    return user && user.role === 'admin' ? {user} : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const existingInvoice = await kv.get(`invoice:${id}`) as Invoice;
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['draft', 'sent', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: draft, sent, or paid' },
        { status: 400 }
      );
    }

    // Update invoice status
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      status: status as 'draft' | 'ready' | 'sent' | 'paid',
      updatedAt: new Date().toISOString()
    };

    // Set paid date if status is being changed to paid
    if (status === 'paid' && existingInvoice.status !== 'paid') {
      updatedInvoice.paidDate = new Date().toISOString();
    }

    // Store updated invoice
    await kv.set(`invoice:${id}`, updatedInvoice);

    return NextResponse.json({
      success: true,
      message: `Invoice status updated to ${status}`,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Invoice status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    );
  }
}
