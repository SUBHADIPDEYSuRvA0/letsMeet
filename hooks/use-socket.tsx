"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useMediaDevices } from "./use-media-devices"

interface PeerConnection {
  connection: RTCPeerConnection
  stream: MediaStream | null
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const peerConnectionsRef = useRef<Record<string, PeerConnection>>({})
  const screenShareStreamRef = useRef<MediaStream | null>(null)

  const {
    stream: localStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    rotateCamera,
    mediaError: deviceMediaError,
  } = useMediaDevices()

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      path: "/api/socket",
      transports: ["websocket"],
    })

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id)
    })

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    newSocket.on("error", (error) => {
      console.error("Socket error:", error)
      setMediaError("Connection error. Please try refreshing the page.")
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Set up WebRTC event listeners
  useEffect(() => {
    if (!socket) return

    // Handle when a new user joins the room
    socket.on("user-joined", async ({ userId, username }) => {
      console.log(`User joined: ${userId} (${username})`)
      if (localStream) {
        await createPeerConnection(userId, true)
      }
    })

    // Handle when a user leaves the room
    socket.on("user-left", ({ userId }) => {
      console.log(`User left: ${userId}`)
      closePeerConnection(userId)
    })

    // Handle incoming WebRTC signaling
    socket.on("webrtc-signal", async ({ from, signal }) => {
      try {
        if (signal.type === "offer") {
          const peerConnection = await createPeerConnection(from, false)
          await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(signal))
          const answer = await peerConnection.connection.createAnswer()
          await peerConnection.connection.setLocalDescription(answer)

          socket.emit("webrtc-signal", {
            to: from,
            signal: peerConnection.connection.localDescription,
          })
        } else if (signal.type === "answer") {
          const peerConnection = peerConnectionsRef.current[from]
          if (peerConnection) {
            await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(signal))
          }
        } else if (signal.candidate) {
          const peerConnection = peerConnectionsRef.current[from]
          if (peerConnection) {
            await peerConnection.connection.addIceCandidate(new RTCIceCandidate(signal))
          }
        }
      } catch (error) {
        console.error("Error handling WebRTC signal:", error)
      }
    })

    return () => {
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("webrtc-signal")
    }
  }, [socket, localStream])

  // Update media error from device hook
  useEffect(() => {
    if (deviceMediaError) {
      setMediaError(deviceMediaError)
    }
  }, [deviceMediaError])

  // Create a peer connection for a specific user
  const createPeerConnection = async (userId: string, isInitiator: boolean) => {
    try {
      if (!localStream) {
        throw new Error("Local stream not available")
      }

      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Add local tracks to the connection
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-signal", {
            to: userId,
            signal: event.candidate,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state for ${userId}:`, peerConnection.connectionState)
      }

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log(`Received track from ${userId}:`, event.track.kind)

        // Create a new MediaStream for this peer if it doesn't exist
        if (!remoteStreams[userId]) {
          const newStream = new MediaStream()
          setRemoteStreams((prev) => ({
            ...prev,
            [userId]: newStream,
          }))

          peerConnectionsRef.current[userId] = {
            ...peerConnectionsRef.current[userId],
            stream: newStream,
          }
        }

        // Add the track to the peer's MediaStream
        const stream = remoteStreams[userId] || new MediaStream()
        stream.addTrack(event.track)

        setRemoteStreams((prev) => ({
          ...prev,
          [userId]: stream,
        }))
      }

      // Store the peer connection
      peerConnectionsRef.current[userId] = {
        connection: peerConnection,
        stream: null,
      }

      // If we're the initiator, create and send an offer
      if (isInitiator && socket) {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        socket.emit("webrtc-signal", {
          to: userId,
          signal: peerConnection.localDescription,
        })
      }

      return peerConnectionsRef.current[userId]
    } catch (error) {
      console.error(`Error creating peer connection for ${userId}:`, error)
      setMediaError("Failed to establish connection with a participant. Please refresh the page.")
      throw error
    }
  }

  // Close a peer connection
  const closePeerConnection = (userId: string) => {
    const peerConnection = peerConnectionsRef.current[userId]
    if (peerConnection) {
      peerConnection.connection.close()
      delete peerConnectionsRef.current[userId]

      setRemoteStreams((prev) => {
        const newStreams = { ...prev }
        delete newStreams[userId]
        return newStreams
      })
    }
  }

  // Join a room
  const joinRoom = useCallback(
    (roomId: string) => {
      if (socket && localStream) {
        socket.emit("join-room", {
          roomId,
          username: "User " + socket.id.substring(0, 5),
        })
      }
    },
    [socket, localStream],
  )

  // Leave a room
  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit("leave-room")

      // Close all peer connections
      Object.keys(peerConnectionsRef.current).forEach((userId) => {
        closePeerConnection(userId)
      })

      // Reset state
      setRemoteStreams({})
    }
  }, [socket])

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach((track) => track.stop())
          screenShareStreamRef.current = null
        }

        // Restore video tracks if they were replaced
        if (localStream) {
          // Notify peers about the track change
          Object.values(peerConnectionsRef.current).forEach((peer) => {
            const senders = peer.connection.getSenders()
            const videoSender = senders.find((sender) => sender.track?.kind === "video")

            if (videoSender && localStream) {
              const videoTracks = localStream.getVideoTracks()
              if (videoTracks.length > 0) {
                videoSender.replaceTrack(videoTracks[0])
              }
            }
          })
        }

        setIsScreenSharing(false)
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        screenShareStreamRef.current = screenStream

        // Replace video tracks in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0]

        Object.values(peerConnectionsRef.current).forEach((peer) => {
          const senders = peer.connection.getSenders()
          const videoSender = senders.find((sender) => sender.track?.kind === "video")

          if (videoSender) {
            videoSender.replaceTrack(videoTrack)
          }
        })

        setIsScreenSharing(true)

        // Handle the case when user stops sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare()
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      setMediaError("Failed to share screen. Please check your permissions and try again.")
    }
  }

  // Send a chat message
  const sendMessage = (message: { roomId: string; content: string }) => {
    if (socket) {
      socket.emit("chat-message", message)
    }
  }

  return {
    socket,
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    rotateCamera,
    mediaError,
    joinRoom,
    leaveRoom,
    sendMessage,
  }
}
