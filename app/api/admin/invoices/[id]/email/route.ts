import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { Resend } from 'resend'
import { kv } from '@vercel/kv'
import { Invoice } from '@/app/types/invoice'

// Initialize Resend only when API key is available
let resend: Resend | null = null
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY)
    console.log('Resend initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Resend:', error)
  }
} else {
  console.warn('RESEND_API_KEY not found in environment variables')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get invoice ID and request body
    const { id } = await params
    const body = await request.json()
    const { recipients, customMessage } = body

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 })
    }

    // Get invoice from database
    const invoice = await kv.get(`invoice:${id}`) as Invoice

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if Resend is properly initialized
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Email service not configured - missing API key' },
        { status: 500 }
      )
    }

    if (!resend) {
      console.error('Resend client failed to initialize')
      return NextResponse.json(
        { error: 'Email service initialization failed' },
        { status: 500 }
      )
    }

    // Generate invoice URL
    const invoiceUrl = `${process.env.NEXTAUTH_URL || 'https://dtexoticslv.com'}/invoice/${invoice.id}`

    // Create email content
    const emailHtml = generateInvoiceEmailTemplate(invoice, invoiceUrl, customMessage)
    const emailSubject = `Invoice ${invoice.invoiceNumber} from DT Exotics Las Vegas`

    // Send email via Resend to all recipients
    console.log('Attempting to send email to:', recipients)
    const emailResult = await resend.emails.send({
      from: 'DT Exotics Las Vegas <invoices@dtexoticslv.com>',
      to: recipients,
      subject: emailSubject,
      html: emailHtml,
      replyTo: 'billing@dtexoticslv.com'
    })

    console.log('Email result:', emailResult)
    
    if (emailResult.error) {
      console.error('Resend error:', emailResult.error)
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error.message || emailResult.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully',
      emailId: emailResult.data?.id
    })

  } catch (error) {
    console.error('Invoice email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceEmailTemplate(invoice: Invoice, invoiceUrl: string, customMessage?: string): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-container {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }
        .tagline {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 0;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #2c3e50;
        }
        .invoice-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
        }
        .detail-value {
          color: #212529;
        }
        .amount-highlight {
          font-size: 20px;
          font-weight: bold;
          color: #00d4ff;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0, 212, 255, 0.3);
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 212, 255, 0.4);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #dee2e6;
        }
        .footer-text {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 10px;
        }
        .contact-info {
          font-size: 12px;
          color: #868e96;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .content {
            padding: 20px;
          }
          .header {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">DT EXOTICS</div>
          <div class="tagline">Las Vegas Luxury Car Rentals</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${invoice.customer.name},
          </div>
          
          ${customMessage ? `<div style="background-color: #e3f2fd; border-left: 4px solid #00d4ff; padding: 15px; margin: 20px 0; border-radius: 4px;"><p style="margin: 0; font-style: italic; color: #1565c0;">${customMessage}</p></div>` : ''}
          
          <p>Thank you for choosing DT Exotics for your luxury car rental experience! Please find your invoice details below:</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${invoice.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${invoice.title}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Date:</span>
              <span class="detail-value">${formatDate(invoice.issueDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value">${formatDate(invoice.dueDate)}</span>
            </div>
            <div class="detail-row" style="border-top: 2px solid #dee2e6; padding-top: 12px; margin-top: 12px;">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value amount-highlight">${formatCurrency(invoice.totalAmount)}</span>
            </div>
            ${invoice.depositRequired && invoice.depositAmount ? `
            <div class="detail-row">
              <span class="detail-label">Deposit Required:</span>
              <span class="detail-value">${formatCurrency(invoice.depositAmount)}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="${invoiceUrl}" class="cta-button">
              View Invoice & Pay Online
            </a>
          </div>
          
          <p>You can view the complete invoice and make a secure payment by clicking the button above. If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          ${invoice.notes ? `
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <strong>Note:</strong> ${invoice.notes}
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div class="footer-text">
            Thank you for choosing DT Exotics Las Vegas!
          </div>
          <div class="contact-info">
            Questions? Contact us at <a href="mailto:billing@dtexoticslv.com">billing@dtexoticslv.com</a><br>
            Visit us at <a href="https://dtexoticslv.com">dtexoticslv.com</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
