import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const roomCode = formData.get("roomCode") as string

    if (!roomCode) {
      return NextResponse.json({ error: "Room code is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the meeting exists
    const meeting = await db.collection("meetings").findOne({ roomCode })

    if (!meeting) {
      return NextResponse.json({ error: "Invalid meeting code" }, { status: 404 })
    }

    // Redirect to the meeting room
    return NextResponse.redirect(new URL(`/meeting/${roomCode}`, request.url))
  } catch (error) {
    console.error("Error joining meeting:", error)
    return NextResponse.json({ error: "Failed to join meeting" }, { status: 500 })
  }
}
