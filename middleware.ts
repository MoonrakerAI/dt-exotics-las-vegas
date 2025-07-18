// SIMPLIFIED MIDDLEWARE - NO AUTH LOGIC
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  // Just let everything through - components will handle auth
  return NextResponse.next()
}

export const config = {
  matcher: []
}