"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Mic,
  MicOff,
  MonitorUp,
  MoreVertical,
  Phone,
  RotateCw,
  Send,
  Video,
  VideoOff,
  MessageSquare,
  VideoIcon as VideoRecorder,
  X,
  Copy,
  Share2,
  LinkIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSocket } from "@/hooks/use-socket"
import { useScreenRecording } from "@/hooks/use-screen-recording"
import VideoGrid from "@/components/video-grid"
import ChatMessage from "@/components/chat-message"

export default function MeetingRoom() {
  const params = useParams()
  const meetingId = params.id as string
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState<any>(null)
  const [isJoining, setIsJoining] = useState(true)

  const {
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
    sendMessage: sendSocketMessage,
  } = useSocket()

  const { isRecording, recordingError, startRecording, stopRecording } = useScreenRecording()

  // Fetch meeting info
  useEffect(() => {
    const fetchMeetingInfo = async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`)
        if (!response.ok) {
          throw new Error("Meeting not found")
        }
        const data = await response.json()
        setMeetingInfo(data)
      } catch (error) {
        console.error("Error fetching meeting:", error)
        toast({
          title: "Error",
          description: "Meeting not found or has expired",
          variant: "destructive",
        })
      }
    }

    fetchMeetingInfo()
  }, [meetingId])

  // Join the room when socket is ready
  useEffect(() => {
    if (socket && meetingId && localStream) {
      joinRoom(meetingId)
      setIsJoining(false)

      // Listen for participants
      socket.on("participants", (users) => {
        setParticipants(users.filter((user: any) => user.id !== socket.id))
      })

      // Listen for chat messages
      socket.on("chat-message", (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: msg.sender,
            content: msg.content,
            timestamp: new Date(),
            isMe: false,
          },
        ])
      })

      return () => {
        socket.off("participants")
        socket.off("chat-message")
        leaveRoom()
      }
    }
  }, [socket, meetingId, localStream, joinRoom, leaveRoom])

  const sendMessage = () => {
    if (message.trim() && socket) {
      const newMessage = {
        id: Date.now(),
        sender: "You",
        content: message,
        timestamp: new Date(),
        isMe: true,
      }

      setMessages([...messages, newMessage])

      // Send to other participants
      sendSocketMessage({
        roomId: meetingId,
        content: message,
      })

      setMessage("")
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Link copied",
      description: "Meeting link copied to clipboard",
    })
  }

  const shareMeeting = async () => {
    const shareData = {
      title: "Join my meeting",
      text: "Join my video meeting",
      url: `${window.location.origin}/meeting/${meetingId}`,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        copyToClipboard()
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  if (isJoining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Joining meeting...</h2>
            <p className="mt-2 text-gray-500">Setting up your audio and video</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1 overflow-hidden bg-black">
          <>
            {mediaError && (
              <div className="absolute left-0 right-0 top-0 z-10 p-4">
                <Alert variant="destructive" className="bg-red-500/80 text-white border-red-600">
                  <AlertDescription>{mediaError}</AlertDescription>
                </Alert>
              </div>
            )}

            {recordingError && (
              <div className="absolute left-0 right-0 top-12 z-10 p-4">
                <Alert variant="destructive" className="bg-red-500/80 text-white border-red-600">
                  <AlertDescription>{recordingError}</AlertDescription>
                </Alert>
              </div>
            )}

            <VideoGrid
              localStream={localStream}
              remoteStreams={Object.values(remoteStreams)}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
            />
          </>

          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/30 text-white border-gray-600 hover:bg-black/50"
              onClick={() => setShowShareDialog(true)}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
            <div className="flex items-center gap-2 rounded-full bg-gray-800/80 p-2 backdrop-blur-sm">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full text-white hover:bg-gray-700",
                        !isAudioEnabled && "bg-red-500 hover:bg-red-600",
                      )}
                      onClick={toggleAudio}
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isAudioEnabled ? "Mute microphone" : "Unmute microphone"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full text-white hover:bg-gray-700",
                        !isVideoEnabled && "bg-red-500 hover:bg-red-600",
                      )}
                      onClick={toggleVideo}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isVideoEnabled ? "Turn off camera" : "Turn on camera"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full text-white hover:bg-gray-700",
                        isScreenSharing && "bg-emerald-500 hover:bg-emerald-600",
                      )}
                      onClick={toggleScreenShare}
                    >
                      <MonitorUp className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full text-white hover:bg-gray-700",
                        isRecording && "bg-red-500 hover:bg-red-600",
                      )}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      <VideoRecorder className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isRecording ? "Stop recording" : "Start recording"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-white hover:bg-gray-700"
                      onClick={rotateCamera}
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rotate camera</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="mx-1 h-6 bg-gray-600" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-white hover:bg-gray-700"
                      onClick={() => setIsChatOpen(!isChatOpen)}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-gray-700">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="mx-1 h-6 bg-gray-600" />

              <Button
                variant="destructive"
                size="sm"
                className="rounded-full px-4"
                onClick={() => {
                  leaveRoom()
                  window.location.href = "/"
                }}
              >
                <Phone className="mr-2 h-4 w-4 rotate-135" />
                End
              </Button>
            </div>
          </div>
        </main>

        {isChatOpen && (
          <aside className="w-80 border-l bg-white">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="participants">Participants ({participants.length + 1})</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <TabsContent value="chat" className="flex h-[calc(100vh-3.5rem)] flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    sendMessage()
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="participants" className="h-[calc(100vh-3.5rem)]">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-sm text-gray-500">In this meeting ({participants.length + 1})</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">You</p>
                          <p className="text-xs text-gray-500">Host</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isAudioEnabled && <MicOff className="h-4 w-4 text-gray-400" />}
                        {!isVideoEnabled && <VideoOff className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>

                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{participant.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!participant.isAudioEnabled && <MicOff className="h-4 w-4 text-gray-400" />}
                          {!participant.isVideoEnabled && <VideoOff className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </aside>
        )}
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Meeting</DialogTitle>
            <DialogDescription>Share this meeting link or code with others to invite them.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 p-2">
            <div>
              <p className="mb-2 text-sm font-medium">Meeting Link</p>
              <div className="flex items-center gap-2">
                <Input value={`${window.location.origin}/meeting/${meetingId}`} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Meeting Code</p>
              <p className="rounded-md border bg-gray-50 p-2 text-center text-lg font-mono tracking-wider">
                {meetingId}
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" className="flex-1 mr-2" onClick={copyToClipboard}>
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button className="flex-1" onClick={shareMeeting}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Loader2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
