import type { Server as NetServer } from "http"
import type { NextApiRequest } from "next"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiResponseServerIO } from "@/types/socket"

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...")

    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    // Store the Socket.io server instance
    res.socket.server.io = io

    // Room management
    const rooms = new Map()
    const userRooms = new Map()

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      // Join a room
      socket.on("join-room", ({ roomId, username }) => {
        console.log(`${socket.id} (${username}) joining room: ${roomId}`)

        // Leave previous room if any
        const previousRoom = userRooms.get(socket.id)
        if (previousRoom) {
          socket.leave(previousRoom)

          // Remove user from the room's participants
          const roomParticipants = rooms.get(previousRoom) || new Map()
          roomParticipants.delete(socket.id)

          if (roomParticipants.size === 0) {
            rooms.delete(previousRoom)
          } else {
            rooms.set(previousRoom, roomParticipants)
          }

          // Notify others in the previous room
          socket.to(previousRoom).emit("user-left", {
            userId: socket.id,
          })
        }

        // Join new room
        socket.join(roomId)
        userRooms.set(socket.id, roomId)

        // Add user to room participants
        const roomParticipants = rooms.get(roomId) || new Map()
        roomParticipants.set(socket.id, {
          id: socket.id,
          name: username,
          isAudioEnabled: true,
          isVideoEnabled: true,
        })
        rooms.set(roomId, roomParticipants)

        // Notify others in the room
        socket.to(roomId).emit("user-joined", {
          userId: socket.id,
          username,
        })

        // Send current participants to the new user
        const participants = Array.from(roomParticipants.values())
        io.to(socket.id).emit("participants", participants)

        // Broadcast updated participants list to all in the room
        io.to(roomId).emit("participants", participants)
      })

      // Leave a room
      socket.on("leave-room", () => {
        const roomId = userRooms.get(socket.id)
        if (roomId) {
          socket.leave(roomId)
          userRooms.delete(socket.id)

          // Remove user from the room's participants
          const roomParticipants = rooms.get(roomId) || new Map()
          roomParticipants.delete(socket.id)

          if (roomParticipants.size === 0) {
            rooms.delete(roomId)
          } else {
            rooms.set(roomId, roomParticipants)

            // Notify others in the room
            socket.to(roomId).emit("user-left", {
              userId: socket.id,
            })

            // Broadcast updated participants list
            const participants = Array.from(roomParticipants.values())
            io.to(roomId).emit("participants", participants)
          }
        }
      })

      // WebRTC signaling
      socket.on("webrtc-signal", ({ to, signal }) => {
        io.to(to).emit("webrtc-signal", {
          from: socket.id,
          signal,
        })
      })

      // Chat messages
      socket.on("chat-message", ({ roomId, content }) => {
        const room = userRooms.get(socket.id)
        if (room === roomId) {
          const roomParticipants = rooms.get(roomId)
          const user = roomParticipants?.get(socket.id)

          socket.to(roomId).emit("chat-message", {
            sender: user?.name || "Unknown",
            content,
            timestamp: new Date(),
          })
        }
      })

      // Media state changes
      socket.on("media-state-change", ({ audio, video }) => {
        const roomId = userRooms.get(socket.id)
        if (roomId) {
          const roomParticipants = rooms.get(roomId)
          if (roomParticipants && roomParticipants.has(socket.id)) {
            const user = roomParticipants.get(socket.id)
            user.isAudioEnabled = audio
            user.isVideoEnabled = video
            roomParticipants.set(socket.id, user)

            // Broadcast updated participants list
            const participants = Array.from(roomParticipants.values())
            io.to(roomId).emit("participants", participants)
          }
        }
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`)

        const roomId = userRooms.get(socket.id)
        if (roomId) {
          // Remove user from the room's participants
          const roomParticipants = rooms.get(roomId) || new Map()
          roomParticipants.delete(socket.id)

          if (roomParticipants.size === 0) {
            rooms.delete(roomId)
          } else {
            rooms.set(roomId, roomParticipants)

            // Notify others in the room
            socket.to(roomId).emit("user-left", {
              userId: socket.id,
            })

            // Broadcast updated participants list
            const participants = Array.from(roomParticipants.values())
            io.to(roomId).emit("participants", participants)
          }
        }

        userRooms.delete(socket.id)
      })
    })
  }

  res.end()
}

export default SocketHandler
