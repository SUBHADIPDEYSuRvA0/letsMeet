// This file contains utility functions for WebRTC connections

// Configuration for ICE servers (STUN/TURN)
export const rtcConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
}

// Create a new RTCPeerConnection with the specified configuration
export function createPeerConnection() {
  return new RTCPeerConnection(rtcConfig)
}

// Add local media tracks to a peer connection
export function addTracksToConnection(pc: RTCPeerConnection, stream: MediaStream) {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream)
  })
}

// Create an offer and set it as the local description
export async function createOffer(pc: RTCPeerConnection) {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  return offer
}

// Create an answer and set it as the local description
export async function createAnswer(pc: RTCPeerConnection) {
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  return answer
}

// Set the remote description on a peer connection
export async function setRemoteDescription(pc: RTCPeerConnection, description: RTCSessionDescriptionInit) {
  await pc.setRemoteDescription(new RTCSessionDescription(description))
}

// Add an ICE candidate to a peer connection
export async function addIceCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit) {
  await pc.addIceCandidate(new RTCIceCandidate(candidate))
}

// Helper function to send signaling messages to the server
export async function sendSignalingMessage(roomId: string, clientId: string, type: string, data: any) {
  try {
    const response = await fetch("/api/signaling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        clientId,
        type,
        data,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error("Error sending signaling message:", error)
    throw error
  }
}
