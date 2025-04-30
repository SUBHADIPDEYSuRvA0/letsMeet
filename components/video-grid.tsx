"use client"

import { useEffect, useRef, useState } from "react"
import { MicOff, VideoOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStreams: MediaStream[]
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

export default function VideoGrid({ localStream, remoteStreams, isAudioEnabled, isVideoEnabled }: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [gridLayout, setGridLayout] = useState("grid-cols-1")

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    // Determine grid layout based on number of participants
    const totalParticipants = remoteStreams.length + 1 // +1 for local stream

    if (totalParticipants === 1) {
      setGridLayout("grid-cols-1")
    } else if (totalParticipants === 2) {
      setGridLayout("grid-cols-2")
    } else if (totalParticipants <= 4) {
      setGridLayout("grid-cols-2")
    } else if (totalParticipants <= 9) {
      setGridLayout("grid-cols-3")
    } else {
      setGridLayout("grid-cols-4")
    }
  }, [remoteStreams.length])

  return (
    <div className={cn("grid h-full w-full gap-1 p-1", gridLayout)}>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
        {localStream ? (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn("h-full w-full object-cover", !isVideoEnabled && "hidden")}
            />

            {!isVideoEnabled && (
              <div className="flex h-full w-full items-center justify-center bg-gray-800">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-2xl font-semibold text-white">
                  You
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-2xl font-semibold text-white">
              You
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded bg-black/70 p-2 text-sm text-white">Camera not available</div>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
          <span>You</span>
          {!isAudioEnabled && <MicOff className="h-3 w-3" />}
          {!localStream || (!isVideoEnabled && <VideoOff className="h-3 w-3" />)}
        </div>
      </div>

      {remoteStreams.map((stream, index) => (
        <RemoteVideo key={index} stream={stream} participantName={`User ${index + 1}`} />
      ))}

      {/* Add placeholder videos if needed when no remote streams */}
      {remoteStreams.length === 0 && (
        <div className="col-span-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="mb-2 text-lg">Waiting for others to join</p>
            <p className="text-sm">Share the meeting link to invite others</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface RemoteVideoProps {
  stream: MediaStream
  participantName: string
}

function RemoteVideo({ stream, participantName }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoActive, setIsVideoActive] = useState(true)
  const [isAudioActive, setIsAudioActive] = useState(true)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream

      // Check if video tracks are enabled
      const videoTracks = stream.getVideoTracks()
      setIsVideoActive(videoTracks.length > 0 && videoTracks[0].enabled)

      // Check if audio tracks are enabled
      const audioTracks = stream.getAudioTracks()
      setIsAudioActive(audioTracks.length > 0 && audioTracks[0].enabled)

      // Listen for track mute/unmute events
      const handleTrackMuteChange = () => {
        setIsVideoActive(videoTracks.length > 0 && videoTracks[0].enabled)
        setIsAudioActive(audioTracks.length > 0 && audioTracks[0].enabled)
      }

      stream.addEventListener("mute", handleTrackMuteChange)
      stream.addEventListener("unmute", handleTrackMuteChange)

      return () => {
        stream.removeEventListener("mute", handleTrackMuteChange)
        stream.removeEventListener("unmute", handleTrackMuteChange)
      }
    }
  }, [stream])

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={cn("h-full w-full object-cover", !isVideoActive && "hidden")}
      />

      {!isVideoActive && (
        <div className="flex h-full w-full items-center justify-center bg-gray-800">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-2xl font-semibold text-white">
            {participantName.charAt(0)}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
        <span>{participantName}</span>
        {!isAudioActive && <MicOff className="h-3 w-3" />}
      </div>
    </div>
  )
}
