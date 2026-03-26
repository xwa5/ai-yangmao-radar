interface ChatBubbleProps {
  message: string
  isUser: boolean
  timestamp?: string
}

export default function ChatBubble({message, isUser, timestamp}: ChatBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser ? 'bg-gradient-primary' : 'bg-gradient-secondary'
          }`}>
          <div className={`text-2xl ${isUser ? 'i-mdi-account' : 'i-mdi-robot'} text-white`} />
        </div>

        {/* 消息内容 */}
        <div className="flex flex-col gap-1">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-gradient-primary text-primary-foreground rounded-tr-none'
                : 'bg-card text-foreground rounded-tl-none shadow-md'
            }`}>
            <p className="text-lg whitespace-pre-wrap break-words">{message}</p>
          </div>
          {timestamp && (
            <span className={`text-sm text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>
              {new Date(timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
