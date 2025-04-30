require("dotenv").config()
const express = require("express")
const http = require("http")
const path = require("path")
const socketio = require("socket.io")
const { ExpressPeerServer } = require("peer")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const passport = require("passport")
const morgan = require("morgan")
const { v4: uuidv4 } = require("uuid")
const crypto = require("crypto")

// Import routes
const authRoutes = require("./routes/auth")
const meetingRoutes = require("./routes/meetings")
const adminRoutes = require("./routes/admin")
const apiRoutes = require("./routes/api")

// Import models
const Meeting = require("./models/Meeting")
const User = require("./models/User")
const Message = require("./models/Message")

// Import passport config
require("./config/passport")(passport)

// Create Express app
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set up PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: process.env.NODE_ENV === "development",
  path: "/peerjs",
})

app.use("/peerjs", peerServer)

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://survasurva246:ADdUGbd8vQeDqmIZ@cluster0.9yeywwz.mongodb.net/meetclone", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Set up EJS
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(morgan("dev"))

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:"mongodb+srv://survasurva246:ADdUGbd8vQeDqmIZ@cluster0.9yeywwz.mongodb.net/meetclone",
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null
  res.locals.error = req.flash ? req.flash("error") : null
  res.locals.success = req.flash ? req.flash("success") : null
  next()
})

// Routes
app.use("/auth", authRoutes)
app.use("/meetings", meetingRoutes)
app.use("/admin", adminRoutes)
app.use("/api", apiRoutes)

// Home route
app.get("/", (req, res) => {
  res.render("index", {
    title: "MeetClone - Video Meetings for Everyone",
    user: req.user,
  })
})

// Room management
const rooms = new Map()
const userRooms = new Map()

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Join meeting room
  socket.on("join-room", async ({ roomId, userId, userName, userEmail }) => {
    console.log(`${userName} (${userId}) joining room: ${roomId}`)

    socket.join(roomId)
    userRooms.set(socket.id, roomId)

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map())
    }

    // Add user to room
    const roomUsers = rooms.get(roomId)
    roomUsers.set(userId, {
      id: userId,
      socketId: socket.id,
      name: userName,
      email: userEmail,
      isAudioEnabled: true,
      isVideoEnabled: true,
    })

    // Notify others in the room
    socket.to(roomId).emit("user-connected", {
      userId,
      userName,
      userEmail,
    })

    // Send current participants to the new user
    const participants = Array.from(roomUsers.values())
    io.to(socket.id).emit("room-participants", participants)

    try {
      // Update meeting in database
      await Meeting.findOneAndUpdate(
        { roomCode: roomId },
        {
          $addToSet: {
            participants: {
              userId: userId,
              name: userName,
              email: userEmail,
              joinedAt: new Date(),
            },
          },
        },
        { new: true },
      )
    } catch (err) {
      console.error("Error updating meeting participants:", err)
    }

    // Handle chat messages
    socket.on("send-message", async ({ message, isPrivate, to }) => {
      const from = roomUsers.get(userId)
      const timestamp = new Date()

      const messageData = {
        roomId,
        from: {
          id: userId,
          name: userName,
          email: userEmail,
        },
        content: message,
        timestamp,
        isPrivate,
      }

      if (isPrivate && to) {
        // Private message
        const toUser = Array.from(roomUsers.values()).find((user) => user.id === to)
        if (toUser) {
          messageData.to = {
            id: to,
            name: toUser.name,
            email: toUser.email,
          }

          io.to(toUser.socketId).emit("receive-message", messageData)
          socket.emit("receive-message", messageData)
        }
      } else {
        // Group message
        socket.to(roomId).emit("receive-message", messageData)
      }

      try {
        // Save message to database
        const newMessage = new Message({
          meetingId: roomId,
          sender: userId,
          content: message,
          isPrivate,
          recipient: isPrivate ? to : null,
        })
        await newMessage.save()
      } catch (err) {
        console.error("Error saving message:", err)
      }
    })

    // Handle media state changes
    socket.on("media-state-change", ({ audio, video }) => {
      const user = roomUsers.get(userId)
      if (user) {
        user.isAudioEnabled = audio
        user.isVideoEnabled = video
        roomUsers.set(userId, user)

        // Broadcast updated state
        socket.to(roomId).emit("user-media-changed", {
          userId,
          isAudioEnabled: audio,
          isVideoEnabled: video,
        })
      }
    })

    // Handle screen sharing
    socket.on("screen-sharing-started", () => {
      socket.to(roomId).emit("user-screen-share", {
        userId,
        isSharing: true,
      })
    })

    socket.on("screen-sharing-stopped", () => {
      socket.to(roomId).emit("user-screen-share", {
        userId,
        isSharing: false,
      })
    })

    // Handle recording status
    socket.on("recording-started", () => {
      socket.to(roomId).emit("recording-status", {
        userId,
        isRecording: true,
      })
    })

    socket.on("recording-stopped", () => {
      socket.to(roomId).emit("recording-status", {
        userId,
        isRecording: false,
      })
    })

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log(`${userName} (${userId}) disconnected from room: ${roomId}`)

      if (roomUsers && roomUsers.has(userId)) {
        roomUsers.delete(userId)

        // Notify others
        socket.to(roomId).emit("user-disconnected", userId)

        // Update participants list
        const participants = Array.from(roomUsers.values())
        io.to(roomId).emit("room-participants", participants)

        // If room is empty, clean up
        if (roomUsers.size === 0) {
          rooms.delete(roomId)

          try {
            // Update meeting end time
            await Meeting.findOneAndUpdate({ roomCode: roomId }, { endTime: new Date() })
          } catch (err) {
            console.error("Error updating meeting end time:", err)
          }
        }
      }

      userRooms.delete(socket.id)
    })
  })

  // Handle user leaving room manually
  socket.on("leave-room", async ({ roomId, userId }) => {
    console.log(`${userId} manually left room: ${roomId}`)

    const roomUsers = rooms.get(roomId)
    if (roomUsers && roomUsers.has(userId)) {
      roomUsers.delete(userId)

      // Notify others
      socket.to(roomId).emit("user-disconnected", userId)

      // Update participants list
      const participants = Array.from(roomUsers.values())
      io.to(roomId).emit("room-participants", participants)

      // If room is empty, clean up
      if (roomUsers.size === 0) {
        rooms.delete(roomId)

        try {
          // Update meeting end time
          await Meeting.findOneAndUpdate({ roomCode: roomId }, { endTime: new Date() })
        } catch (err) {
          console.error("Error updating meeting end time:", err)
        }
      }
    }

    socket.leave(roomId)
  })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
