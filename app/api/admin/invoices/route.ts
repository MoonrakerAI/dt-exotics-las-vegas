import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { kv } from '@vercel/kv'
import { CustomInvoice, InvoiceLineItem } from '@/app/types/rental'

const INVOICE_PREFIX = 'invoice:'
const INVOICE_LIST_KEY = 'invoices:all'
const INVOICE_NUMBER_KEY = 'invoice_counter'

async function getNextInvoiceNumber(): Promise<string> {
  const counter = await kv.incr(INVOICE_NUMBER_KEY)
  const year = new Date().getFullYear()
  return `INV-${year}-${counter.toString().padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get all invoice IDs
    const invoiceIds = await kv.smembers(INVOICE_LIST_KEY) as string[]
    
    // Get all invoices
    const invoices: CustomInvoice[] = []
    for (const id of invoiceIds) {
      const invoice = await kv.get<CustomInvoice>(`${INVOICE_PREFIX}${id}`)
      if (invoice) {
        invoices.push(invoice)
      }
    }

    // Filter by status if provided
    let filteredInvoices = invoices
    if (status && status !== 'all') {
      filteredInvoices = invoices.filter(invoice => invoice.status === status)
    }

    // Check for overdue invoices and update status
    const now = new Date()
    for (const invoice of filteredInvoices) {
      if (invoice.status === 'sent' && new Date(invoice.dueDate) < now) {
        invoice.status = 'overdue'
        await kv.set(`${INVOICE_PREFIX}${invoice.id}`, invoice)
      }
    }

    // Sort by creation date (newest first)
    filteredInvoices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      invoices: filteredInvoices
    })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      customerDetails, 
      lineItems, 
      notes, 
      dueDate, 
      taxRate = 8.25,
      status = 'draft'
    } = body

    // Validate required fields
    if (!customerDetails?.name || !customerDetails?.email) {
      return NextResponse.json(
        { error: 'Customer name and email are required' },
        { status: 400 }
      )
    }

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, item: InvoiceLineItem) => 
      sum + (item.quantity * item.unitPrice), 0
    )
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    // Create invoice
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const invoiceNumber = await getNextInvoiceNumber()

    const invoice: CustomInvoice = {
      id: invoiceId,
      invoiceNumber,
      customerDetails,
      lineItems: lineItems.map((item: any) => ({
        ...item,
        total: item.quantity * item.unitPrice
      })),
      subtotal,
      tax,
      taxRate,
      total,
      dueDate,
      status,
      notes,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to database
    await kv.set(`${INVOICE_PREFIX}${invoiceId}`, invoice)
    await kv.sadd(INVOICE_LIST_KEY, invoiceId)

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}