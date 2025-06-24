import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, selectedCar, startDate, endDate, message } = body

    if (!resend) {
      console.error('Resend API key not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      )
    }

    // Send email to admin
    const { data, error } = await resend.emails.send({
      from: 'DT Exotics <noreply@dtexoticslv.com>',
      to: 'contact@dtexoticslv.com',
      subject: `New Rental Inquiry - ${name}`,
      html: `
        <h2>New Rental Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Selected Car:</strong> ${selectedCar}</p>
        <p><strong>Rental Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
        <p><strong>Message:</strong> ${message || 'No message provided'}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send confirmation email to customer
    await resend.emails.send({
      from: 'DT Exotics <noreply@dtexoticslv.com>',
      to: email,
      subject: 'Your DT Exotics Rental Inquiry',
      html: `
        <h2>Thank you for your inquiry!</h2>
        <p>Hi ${name},</p>
        <p>We've received your rental inquiry and will contact you within 24 hours.</p>
        <p><strong>Rental Details:</strong></p>
        <ul>
          <li>Selected Car: ${selectedCar}</li>
          <li>Rental Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
        <p>If you have any immediate questions, please call us at (702) 720-8948.</p>
        <p>Best regards,<br>DT Exotics Las Vegas</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}