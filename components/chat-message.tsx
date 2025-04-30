import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    id: number
    sender: string
    content: string
    timestamp: Date
    isMe: boolean
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(message.timestamp))

  return (
    <div className={cn("flex items-start gap-2", message.isMe && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={message.isMe ? "bg-emerald-100 text-emerald-600" : ""}>
          {message.sender.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2",
          message.isMe ? "bg-emerald-100 text-emerald-900" : "bg-gray-100 text-gray-900",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{message.sender}</span>
          <span className="text-xs text-gray-500">{formattedTime}</span>
        </div>
        <p className="mt-1 text-sm">{message.content}</p>
      </div>
    </div>
  )
}
