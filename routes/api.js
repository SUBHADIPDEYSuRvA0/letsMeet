const express = require("express")
const router = express.Router()
const crypto = require("crypto")
const { validateApiKey } = require("../middleware/auth")
const User = require("../models/User")
const Meeting = require("../models/Meeting")
const ApiUsage = require("../models/ApiUsage")

// Log API usage
const logApiUsage = async (req, res, next) => {
  const startTime = Date.now()

  // Store original end function
  const originalEnd = res.end

  // Override end function
  res.end = function (chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime

    // Determine if request was successful
    const success = res.statusCode >= 200 && res.statusCode < 400

    // Log usage
    if (req.apiUser) {
      const apiUsage = new ApiUsage({
        userId: req.apiUser._id,
        apiKey: req.headers["x-api-key"],
        endpoint: req.originalUrl,
        responseTime,
        success,
      })

      apiUsage.save().catch((err) => console.error("Error logging API usage:", err))
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Apply middleware to all API routes
router.use(logApiUsage)

// API documentation
router.get("/", (req, res) => {
  res.render("api/documentation", {
    title: "API Documentation",
  })
})

// Create meeting
router.post("/meetings", validateApiKey, async (req, res) => {
  try {
    const { title } = req.body

    // Generate room code
    const roomCode = crypto.randomBytes(4).toString("hex")

    // Create meeting
    const meeting = new Meeting({
      roomCode,
      host: req.apiUser._id,
      title: title || "API Created Meeting",
      startTime: new Date(),
      isActive: true,
    })

    await meeting.save()

    res.status(201).json({
      success: true,
      meeting: {
        id: meeting._id,
        roomCode: meeting.roomCode,
        title: meeting.title,
        startTime: meeting.startTime,
        joinUrl: `${req.protocol}://${req.get("host")}/meetings/join/${roomCode}`,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// Get meetings
router.get("/meetings", validateApiKey, async (req, res) => {
  try {
    const meetings = await Meeting.find({ host: req.apiUser._id })
      .sort({ startTime: -1 })
      .select("roomCode title startTime endTime isActive participants")

    res.json({
      success: true,
      meetings: meetings.map((m) => ({
        id: m._id,
        roomCode: m.roomCode,
        title: m.title,
        startTime: m.startTime,
        endTime: m.endTime,
        isActive: m.isActive,
        participantCount: m.participants.length,
        joinUrl: `${req.protocol}://${req.get("host")}/meetings/join/${m.roomCode}`,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// Get meeting details
router.get("/meetings/:roomCode", validateApiKey, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      roomCode: req.params.roomCode,
      host: req.apiUser._id,
    })

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomCode: meeting.roomCode,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        isActive: meeting.isActive,
        participants: meeting.participants,
        recordings: meeting.recordings,
        joinUrl: `${req.protocol}://${req.get("host")}/meetings/join/${meeting.roomCode}`,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// End meeting
router.post("/meetings/:roomCode/end", validateApiKey, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      roomCode: req.params.roomCode,
      host: req.apiUser._id,
    })

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    meeting.isActive = false
    meeting.endTime = new Date()

    await meeting.save()

    res.json({
      success: true,
      message: "Meeting ended successfully",
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
