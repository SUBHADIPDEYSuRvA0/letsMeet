"use client"

import { useState, useEffect, useRef } from "react"
import { useMediaDevices } from "./use-media-devices"

interface Participant {
  id: string
  name: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

export function usePeerConnection(roomId: string) {
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const screenShareStreamRef = useRef<MediaStream | null>(null)

  const {
    stream: localStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    rotateCamera,
    mediaError,
  } = useMediaDevices()

  // In a real implementation, this would connect to a signaling server
  // and establish WebRTC connections with other peers
  useEffect(() => {
    if (!roomId) return

    console.log(`Joining room: ${roomId}`)

    // Simulate connecting to a room and getting participants
    const timer = setTimeout(() => {
      // Simulate other participants joining
      setParticipants([
        {
          id: "user1",
          name: "John Doe",
          isAudioEnabled: true,
          isVideoEnabled: true,
        },
        {
          id: "user2",
          name: "Jane Smith",
          isAudioEnabled: false,
          isVideoEnabled: true,
        },
      ])
    }, 2000)

    return () => {
      clearTimeout(timer)
      console.log(`Leaving room: ${roomId}`)
    }
  }, [roomId])

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach((track) => track.stop())
          screenShareStreamRef.current = null
        }
        setIsScreenSharing(false)
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        screenShareStreamRef.current = screenStream
        setIsScreenSharing(true)

        // In a real implementation, you would replace the video track
        // in the peer connections with the screen sharing track

        // Handle the case when user stops sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          screenShareStreamRef.current = null
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
    }
  }

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    rotateCamera,
    participants,
    mediaError,
  }
}
