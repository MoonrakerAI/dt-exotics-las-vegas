import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { kv } from '@vercel/kv';
import { Invoice, UpdateInvoiceRequest } from '@/app/types/invoice';

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

// Calculate invoice totals
function calculateInvoiceTotals(lineItems: any[], taxRate: number, discountAmount: number = 0) {
  const subtotal = lineItems.reduce((sum, item) => {
    const amount = item.quantity * item.unitPrice;
    return sum + amount;
  }, 0);

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const totalAmount = discountedSubtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    totalAmount: Math.max(0, totalAmount)
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const invoice = await kv.get(`invoice:${params.id}`);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const existingInvoice = await kv.get(`invoice:${params.id}`) as Invoice;
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice can be modified
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot modify paid invoices' },
        { status: 400 }
      );
    }

    const body: UpdateInvoiceRequest = await request.json();

    // Update invoice fields
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      updatedAt: new Date().toISOString()
    };

    // Update basic fields
    if (body.customer) updatedInvoice.customer = { ...existingInvoice.customer, ...body.customer };
    if (body.title) updatedInvoice.title = body.title;
    if (body.description !== undefined) updatedInvoice.description = body.description;
    if (body.serviceType) updatedInvoice.serviceType = body.serviceType;
    if (body.notes !== undefined) updatedInvoice.notes = body.notes;
    if (body.terms !== undefined) updatedInvoice.terms = body.terms;
    if (body.dueDate) updatedInvoice.dueDate = body.dueDate;
    if (body.status) updatedInvoice.status = body.status;

    // Update deposit settings
    if (body.depositRequired !== undefined) {
      updatedInvoice.depositRequired = body.depositRequired;
      if (body.depositAmount !== undefined) {
        updatedInvoice.depositAmount = body.depositAmount;
      }
    }

    // Update line items and recalculate if provided
    if (body.lineItems) {
      const processedLineItems = body.lineItems.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice
      }));

      updatedInvoice.lineItems = processedLineItems;

      // Recalculate totals
      const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(
        processedLineItems,
        body.taxRate !== undefined ? body.taxRate : updatedInvoice.taxRate,
        body.discountAmount !== undefined ? body.discountAmount : updatedInvoice.discountAmount
      );

      updatedInvoice.subtotal = subtotal;
      updatedInvoice.taxAmount = taxAmount;
      updatedInvoice.totalAmount = totalAmount;

      if (body.taxRate !== undefined) updatedInvoice.taxRate = body.taxRate;
      if (body.discountAmount !== undefined) updatedInvoice.discountAmount = body.discountAmount;
    }

    // Update status-specific fields
    if (body.status === 'paid' && !updatedInvoice.paidDate) {
      updatedInvoice.paidDate = new Date().toISOString();
    }

    // Store updated invoice
    await kv.set(`invoice:${params.id}`, updatedInvoice);

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Invoice update error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const existingInvoice = await kv.get(`invoice:${params.id}`) as Invoice;
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice can be deleted
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoices' },
        { status: 400 }
      );
    }

    // Remove invoice
    await kv.del(`invoice:${params.id}`);
    await kv.srem('invoices:all', params.id);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Invoice deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}