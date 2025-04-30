const express = require("express")
const router = express.Router()
const { ensureAdmin } = require("../middleware/auth")
const User = require("../models/User")
const Meeting = require("../models/Meeting")
const Message = require("../models/Message")
const ApiUsage = require("../models/ApiUsage")

// Admin dashboard
router.get("/", ensureAdmin, async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments()
    const meetingCount = await Meeting.countDocuments()
    const activeCount = await Meeting.countDocuments({ isActive: true })
    const messageCount = await Message.countDocuments()

    // Get recent meetings
    const recentMeetings = await Meeting.find().sort({ startTime: -1 }).limit(5).populate("host", "name email")

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      userCount,
      meetingCount,
      activeCount,
      messageCount,
      recentMeetings,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error loading dashboard")
    res.redirect("/")
  }
})

// User management
router.get("/users", ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })

    res.render("admin/users", {
      title: "User Management",
      users,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching users")
    res.redirect("/admin")
  }
})

// User details
router.get("/users/:id", ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      req.flash("error_msg", "User not found")
      return res.redirect("/admin/users")
    }

    // Get user's meetings
    const meetings = await Meeting.find({ host: user._id }).sort({ startTime: -1 })

    // Get API usage
    const apiUsage = await ApiUsage.find({ userId: user._id }).sort({ timestamp: -1 }).limit(100)

    res.render("admin/user-details", {
      title: `User: ${user.name}`,
      user,
      meetings,
      apiUsage,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching user details")
    res.redirect("/admin/users")
  }
})

// Update user
router.post("/users/:id", ensureAdmin, async (req, res) => {
  const { name, email, role, isPremium } = req.body

  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      req.flash("error_msg", "User not found")
      return res.redirect("/admin/users")
    }

    user.name = name
    user.email = email
    user.role = role
    user.isPremium = isPremium === "on"

    await user.save()

    req.flash("success_msg", "User updated successfully")
    res.redirect(`/admin/users/${user._id}`)
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error updating user")
    res.redirect(`/admin/users/${req.params.id}`)
  }
})

// Meeting management
router.get("/meetings", ensureAdmin, async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ startTime: -1 }).populate("host", "name email")

    res.render("admin/meetings", {
      title: "Meeting Management",
      meetings,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching meetings")
    res.redirect("/admin")
  }
})

// Meeting details
router.get("/meetings/:id", ensureAdmin, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("host", "name email")

    if (!meeting) {
      req.flash("error_msg", "Meeting not found")
      return res.redirect("/admin/meetings")
    }

    // Get messages
    const messages = await Message.find({ meetingId: meeting.roomCode }).sort({ timestamp: 1 })

    res.render("admin/meeting-details", {
      title: `Meeting: ${meeting.title}`,
      meeting,
      messages,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching meeting details")
    res.redirect("/admin/meetings")
  }
})

// API usage stats
router.get("/api-usage", ensureAdmin, async (req, res) => {
  try {
    // Get API usage stats
    const totalRequests = await ApiUsage.countDocuments()
    const successfulRequests = await ApiUsage.countDocuments({ success: true })
    const failedRequests = await ApiUsage.countDocuments({ success: false })

    // Get top users
    const topUsers = await ApiUsage.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    // Populate user details
    for (let i = 0; i < topUsers.length; i++) {
      topUsers[i].user = await User.findById(topUsers[i]._id, "name email")
    }

    // Get recent API calls
    const recentCalls = await ApiUsage.find().sort({ timestamp: -1 }).limit(100).populate("userId", "name email")

    res.render("admin/api-usage", {
      title: "API Usage Statistics",
      totalRequests,
      successfulRequests,
      failedRequests,
      topUsers,
      recentCalls,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching API usage statistics")
    res.redirect("/admin")
  }
})

module.exports = router
