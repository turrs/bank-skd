import { Skeleton } from "@/components/ui/skeleton"

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      {/* Avatar */}
      <Skeleton className="h-8 w-8 rounded-full" />
      
      {/* Message Content */}
      <div className="flex-1 space-y-2">
        {/* Username */}
        <Skeleton className="h-4 w-24" />
        
        {/* Message Text */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Timestamp */}
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function ChatSkeleton({ messageCount = 5 }: { messageCount?: number }) {
  return (
    <div className="space-y-4">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      {/* Messages */}
      <div className="space-y-4">
        {Array.from({ length: messageCount }).map((_, i) => (
          <ChatMessageSkeleton key={i} />
        ))}
      </div>
      
      {/* Input Area */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
