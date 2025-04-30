import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Handle API routes that need to be rewritten for Socket.io
  if (request.nextUrl.pathname.startsWith("/api/socket")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}
