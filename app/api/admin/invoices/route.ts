import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { kv } from '@vercel/kv';
import { Invoice, CreateInvoiceRequest, InvoiceFilters } from '@/app/types/invoice';

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

// Generate invoice number
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const counter = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
  return `INV-${year}-${counter}`;
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

export async function GET(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as Invoice['status'] | null;
    const serviceType = searchParams.get('serviceType') as Invoice['serviceType'] | null;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all invoice IDs
    const invoiceIds = await kv.smembers('invoices:all') || [];
    
    // Fetch all invoices
    const invoices: Invoice[] = [];
    for (const id of invoiceIds) {
      const invoice = await kv.get(`invoice:${id}`);
      if (invoice) {
        invoices.push(invoice as Invoice);
      }
    }

    // Apply filters
    let filteredInvoices = invoices;

    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }

    if (serviceType) {
      filteredInvoices = filteredInvoices.filter(inv => inv.serviceType === serviceType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.customer.name.toLowerCase().includes(searchLower) ||
        inv.customer.email.toLowerCase().includes(searchLower) ||
        inv.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);
    const total = filteredInvoices.length;

    return NextResponse.json({
      success: true,
      invoices: paginatedInvoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { user } = authResult;
    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    if (!body.customer?.name || !body.customer?.email) {
      return NextResponse.json(
        { error: 'Customer name and email are required' },
        { status: 400 }
      );
    }

    if (!body.title || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Invoice title and at least one line item are required' },
        { status: 400 }
      );
    }

    // Process line items and calculate amounts
    const processedLineItems = body.lineItems.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice
    }));

    // Calculate totals
    const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(
      processedLineItems, 
      body.taxRate || 0, 
      body.discountAmount || 0
    );

    // Validate deposit amount
    if (body.depositRequired && body.depositAmount) {
      if (body.depositAmount > totalAmount) {
        return NextResponse.json(
          { error: 'Deposit amount cannot exceed total amount' },
          { status: 400 }
        );
      }
    }

    // Create invoice
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      status: 'ready',
      customer: body.customer,
      title: body.title,
      description: body.description,
      serviceType: body.serviceType,
      lineItems: processedLineItems,
      subtotal,
      taxRate: body.taxRate || 0,
      taxAmount,
      discountAmount: body.discountAmount || 0,
      totalAmount,
      depositRequired: body.depositRequired,
      depositAmount: body.depositAmount,
      issueDate: new Date().toISOString(),
      dueDate: body.dueDate,
      notes: body.notes,
      terms: body.terms || 'Payment is due within 30 days of invoice date.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    };

    // Store invoice
    await kv.set(`invoice:${invoice.id}`, invoice);
    await kv.sadd('invoices:all', invoice.id);

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    }, { status: 201 });

  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}