import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()

    // Generate a random room code
    const roomCode = randomBytes(4).toString("hex")

    // Create a new meeting in the database
    const meeting = {
      roomCode,
      createdAt: new Date(),
      participants: [],
      active: true,
    }

    await db.collection("meetings").insertOne(meeting)

    return NextResponse.json({ roomCode, success: true })
  } catch (error) {
    console.error("Error creating meeting:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}
