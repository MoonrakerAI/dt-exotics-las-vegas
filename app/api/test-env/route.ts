import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    admin_email_3: process.env.ADMIN_EMAIL_3 || 'NOT SET',
    admin_password_hash_3_set: !!process.env.ADMIN_PASSWORD_HASH_3,
    admin_password_hash_3_length: process.env.ADMIN_PASSWORD_HASH_3?.length || 0,
    timestamp: new Date().toISOString()
  })
}
