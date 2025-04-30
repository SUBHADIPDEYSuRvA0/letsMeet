import { type NextRequest, NextResponse } from "next/server"

// This is a workaround for Socket.io in Next.js App Router
// In a real production app, you would use a dedicated Socket.io server
export async function GET(req: NextRequest) {
  // This is just a placeholder to make the route work
  // The actual Socket.io server is initialized in the socket/index.ts file
  return new NextResponse("Socket.io server is running")
}
