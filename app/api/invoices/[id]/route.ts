import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Invoice } from '@/app/types/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await kv.get(`invoice:${params.id}`) as Invoice;
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Only show invoices that are sent, paid, or overdue (not drafts)
    if (invoice.status === 'draft') {
      return NextResponse.json(
        { error: 'Invoice not available' },
        { status: 404 }
      );
    }

    // Return public-safe invoice data (without sensitive admin fields)
    const publicInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email
        // Exclude phone and address for privacy
      },
      title: invoice.title,
      description: invoice.description,
      serviceType: invoice.serviceType,
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      depositRequired: invoice.depositRequired,
      depositAmount: invoice.depositAmount,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      notes: invoice.notes,
      terms: invoice.terms
    };

    return NextResponse.json({
      success: true,
      invoice: publicInvoice
    });

  } catch (error) {
    console.error('Public invoice fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}