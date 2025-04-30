const express = require("express")
const router = express.Router()
const crypto = require("crypto")
const { ensureAuthenticated } = require("../middleware/auth")
const Meeting = require("../models/Meeting")
const Message = require("../models/Message")

// Create new meeting
router.get("/new", ensureAuthenticated, (req, res) => {
  // Generate a random room code
  const roomCode = crypto.randomBytes(4).toString("hex")

  res.render("meetings/new", {
    title: "New Meeting",
    roomCode,
  })
})

// Create meeting in database and redirect to room
router.post("/create", ensureAuthenticated, async (req, res) => {
  const { roomCode, title } = req.body

  try {
    // Create new meeting
    const newMeeting = new Meeting({
      roomCode,
      host: req.user.id,
      title: title || "Untitled Meeting",
      startTime: new Date(),
      isActive: true,
    })

    await newMeeting.save()

    res.redirect(`/meetings/join/${roomCode}`)
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error creating meeting")
    res.redirect("/")
  }
})

// Join meeting page
router.get("/join", ensureAuthenticated, (req, res) => {
  res.render("meetings/join", {
    title: "Join Meeting",
  })
})

// Join meeting by code
router.post("/join", ensureAuthenticated, async (req, res) => {
  const { roomCode } = req.body

  try {
    // Check if meeting exists
    const meeting = await Meeting.findOne({ roomCode })

    if (!meeting) {
      req.flash("error_msg", "Invalid meeting code")
      return res.redirect("/meetings/join")
    }

    res.redirect(`/meetings/join/${roomCode}`)
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error joining meeting")
    res.redirect("/meetings/join")
  }
})

// Meeting room
router.get("/join/:roomCode", ensureAuthenticated, async (req, res) => {
  const { roomCode } = req.params

  try {
    // Check if meeting exists
    const meeting = await Meeting.findOne({ roomCode })

    if (!meeting) {
      req.flash("error_msg", "Invalid meeting code")
      return res.redirect("/meetings/join")
    }

    // Get previous messages
    const messages = await Message.find({
      meetingId: roomCode,
      isPrivate: false,
    }).sort({ timestamp: 1 })

    res.render("meetings/room", {
      title: meeting.title,
      roomCode,
      user: req.user,
      meeting,
      messages,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error joining meeting")
    res.redirect("/meetings/join")
  }
})

// Get user's meetings
router.get("/my-meetings", ensureAuthenticated, async (req, res) => {
  try {
    // Get meetings hosted by user
    const hostedMeetings = await Meeting.find({ host: req.user.id }).sort({ startTime: -1 })

    // Get meetings attended by user
    const attendedMeetings = await Meeting.find({
      "participants.userId": req.user.id.toString(),
      host: { $ne: req.user.id },
    }).sort({ startTime: -1 })

    res.render("meetings/my-meetings", {
      title: "My Meetings",
      hostedMeetings,
      attendedMeetings,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching meetings")
    res.redirect("/")
  }
})

// Meeting details
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("host")

    if (!meeting) {
      req.flash("error_msg", "Meeting not found")
      return res.redirect("/meetings/my-meetings")
    }

    // Check if user is host or participant
    const isHost = meeting.host._id.toString() === req.user.id.toString()
    const isParticipant = meeting.participants.some((p) => p.userId === req.user.id.toString())

    if (!isHost && !isParticipant) {
      req.flash("error_msg", "You do not have permission to view this meeting")
      return res.redirect("/meetings/my-meetings")
    }

    // Get messages
    const messages = await Message.find({
      meetingId: meeting.roomCode,
      isPrivate: false,
    }).sort({ timestamp: 1 })

    res.render("meetings/details", {
      title: meeting.title,
      meeting,
      messages,
      isHost,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching meeting details")
    res.redirect("/meetings/my-meetings")
  }
})

// Save recording
router.post("/:roomCode/recordings", ensureAuthenticated, async (req, res) => {
  const { roomCode } = req.params
  const { recordingUrl, startTime, endTime, size } = req.body

  try {
    const meeting = await Meeting.findOne({ roomCode })

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" })
    }

    meeting.recordings.push({
      url: recordingUrl,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      size,
    })

    await meeting.save()

    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
