import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Video } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Video className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-semibold text-emerald-600">MeetClone</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto grid items-center gap-6 px-4 py-12 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">Video meetings for everyone</h1>
            <p className="text-lg text-gray-600">
              Secure, reliable, and high-quality video conferencing with all the features you need.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <Link href="/new-meeting">
                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto">
                  New Meeting
                </Button>
              </Link>
              <JoinMeetingForm />
            </div>
          </div>
          <div className="hidden md:block">
            <img
              src="/placeholder.svg?height=400&width=500"
              alt="Video conference illustration"
              className="rounded-lg shadow-lg"
              width={500}
              height={400}
            />
          </div>
        </section>

        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Everything you need for seamless meetings
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-3 text-emerald-600">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} MeetClone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function JoinMeetingForm() {
  return (
    <form action="/api/join-meeting" method="POST" className="flex w-full items-center gap-2 sm:w-auto">
      <Input
        type="text"
        name="roomCode"
        placeholder="Enter meeting code"
        className="h-10 border-gray-300 focus-visible:ring-emerald-600"
        required
      />
      <Button type="submit" size="icon" variant="outline" className="h-10 w-10 shrink-0">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  )
}

const features = [
  {
    icon: <Video className="h-6 w-6" />,
    title: "HD Video Conferencing",
    description: "Crystal clear video and audio for all your meetings.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "In-meeting Chat",
    description: "Send messages to everyone or privately during calls.",
  },
  {
    icon: <MonitorShare className="h-6 w-6" />,
    title: "Screen Sharing",
    description: "Share your screen with participants with one click.",
  },
  {
    icon: <VideoRecorder className="h-6 w-6" />,
    title: "Recording",
    description: "Record your meetings for later reference.",
  },
  {
    icon: <RotateCw className="h-6 w-6" />,
    title: "Camera Controls",
    description: "Rotate camera, apply filters, and more.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Meetings",
    description: "End-to-end encryption for all your conversations.",
  },
]

function MessageSquare(props) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MonitorShare(props) {
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
      <path d="M9 12h6" />
      <path d="M12 9v6" />
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  )
}

function RotateCw(props) {
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
      <path d="M21 2v6h-6" />
      <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
    </svg>
  )
}

function Shield(props) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}

function VideoRecorder(props) {
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}
