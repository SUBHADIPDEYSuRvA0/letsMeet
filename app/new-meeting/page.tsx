"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, CheckCircle, Share2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

export default function NewMeeting() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(true)
  const [meetingId, setMeetingId] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const createMeeting = async () => {
      try {
        const response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to create meeting")
        }

        const data = await response.json()
        setMeetingId(data.roomCode)
        setIsCreating(false)
        setShowDialog(true)
      } catch (error) {
        console.error("Error creating meeting:", error)
        toast({
          title: "Error",
          description: "Failed to create meeting. Please try again.",
          variant: "destructive",
        })
        router.push("/")
      }
    }

    createMeeting()
  }, [router])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        toast({
          title: "Link copied",
          description: "Meeting link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const joinMeeting = () => {
    router.push(`/meeting/${meetingId}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {isCreating ? (
            <>
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-emerald-600" />
              <h1 className="text-xl font-semibold">Creating your meeting...</h1>
              <p className="mt-2 text-sm text-gray-500">This will only take a moment.</p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-emerald-100 p-3 text-emerald-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-semibold">Your meeting is ready!</h1>
              <p className="mt-2 text-sm text-gray-500">Share this link with others to invite them to your meeting.</p>
              <div className="mt-4 w-full">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={`${window.location.origin}/meeting/${meetingId}`}
                    readOnly
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={shareMeeting}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={joinMeeting}>
                  Join Now
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Created</DialogTitle>
            <DialogDescription>
              Your meeting has been created successfully. Share this code with others to invite them.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-500">Meeting Code:</p>
              <p className="mt-1 text-2xl font-bold tracking-wider">{meetingId}</p>
            </div>
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
                {copied ? "Copied!" : "Copy Code"}
              </Button>
              <Button className="flex-1" onClick={() => setShowDialog(false)}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
