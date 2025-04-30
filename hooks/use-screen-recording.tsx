"use client"

import { useState, useRef } from "react"

export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      setRecordingError(null)

      // Try to get screen stream
      const screenStream = await navigator.mediaDevices
        .getDisplayMedia({
          video: { mediaSource: "screen" },
          audio: true,
        })
        .catch((error) => {
          console.error("Error getting screen:", error)
          setRecordingError("Unable to access your screen. Please check permissions.")
          throw error
        })

      // Try to get audio stream
      let audioStream
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
      } catch (audioError) {
        console.warn("Could not get microphone access, recording without audio:", audioError)
        // Continue without audio
      }

      // Combine the streams
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ])

      // Create media recorder with fallbacks for browser compatibility
      let mediaRecorder
      const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]

      // Find the first supported mime type
      const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ""

      try {
        mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: supportedType,
        })
      } catch (e) {
        // Fallback without specifying mime type
        console.warn("Failed to create MediaRecorder with specified mime type, using default:", e)
        mediaRecorder = new MediaRecorder(combinedStream)
      }

      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (recordedChunksRef.current.length === 0) {
          setRecordingError("No data was recorded. Please try again.")
          setIsRecording(false)
          return
        }

        try {
          const recordedBlob = new Blob(recordedChunksRef.current, {
            type: supportedType || "video/webm",
          })

          // Create download link
          const url = URL.createObjectURL(recordedBlob)
          const a = document.createElement("a")
          a.style.display = "none"
          a.href = url
          a.download = `recording-${new Date().toISOString()}.webm`
          document.body.appendChild(a)
          a.click()

          // Clean up
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        } catch (error) {
          console.error("Error creating recording blob:", error)
          setRecordingError("Failed to process recording. Please try again.")
        }

        // Stop all tracks
        combinedStream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
      }

      // Start recording
      mediaRecorder.start(1000) // Capture in 1-second chunks
      setIsRecording(true)

      // Handle the case when user stops sharing via the browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording()
      }
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsRecording(false)
      setRecordingError("Failed to start recording. Please check your permissions and try again.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (error) {
        console.error("Error stopping recording:", error)
        setIsRecording(false)
        setRecordingError("Error stopping recording.")
      }
    }
  }

  return {
    isRecording,
    recordingError,
    startRecording,
    stopRecording,
  }
}
