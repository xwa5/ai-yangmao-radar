import {useState, useCallback, useRef} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {callAiChat, saveChatHistory} from '@/db/api'
import type {ChatMessage} from '@/db/api'
import ChatBubble from '@/components/ChatBubble'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
}

const WELCOME_MESSAGE: Message = {
  id: '1',
  content: '你好！我是AI羊毛雷达助手，可以帮你查询各大AI平台的优惠活动。\n\n你可以这样问我：\n• "Claude 有什么免费额度？"\n• "有哪些免费试用活动？"\n• "OpenAI 最近有什么优惠？"',
  isUser: false,
  timestamp: new Date().toISOString()
}

export default function Agent() {
  const {user} = useAuth()
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const historyRef = useRef<ChatMessage[]>([])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const {reply, error} = await callAiChat(userMessage, historyRef.current)

      const agentResponse = error || !reply
        ? '抱歉，出现了一些问题，请稍后再试～'
        : reply

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, agentMsg])

      if (reply) {
        historyRef.current = [
          ...historyRef.current,
          {role: 'user' as const, content: userMessage},
          {role: 'assistant' as const, content: reply}
        ].slice(-20)
      }

      if (user) {
        saveChatHistory(user.id, userMessage, agentResponse).catch(() => {})
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，出现了一些问题，请稍后再试～',
        isUser: false,
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [inputValue, loading, user])

  const handleInputChange = (e: any) => {
    const ev = e as any
    setInputValue(ev.detail?.value ?? ev.target?.value ?? '')
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <div className="flex-1 px-6 py-6 pb-32">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg.content} isUser={msg.isUser} timestamp={msg.timestamp} />
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-secondary">
                <div className="i-mdi-robot text-2xl text-white" />
              </div>
              <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-none shadow-md">
                <div className="flex items-center gap-2">
                  <div className="i-mdi-loading text-2xl text-primary animate-spin" />
                  <span className="text-lg text-muted-foreground">思考中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-2 border-input rounded-xl px-4 py-3 bg-background overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              placeholder="输入你想查询的内容..."
              value={inputValue}
              onInput={handleInputChange}
            />
          </div>
          <button
            type="button"
            className={`px-6 py-4 rounded-xl text-xl font-semibold flex items-center justify-center leading-none ${
              inputValue.trim() && !loading
                ? 'bg-gradient-primary text-primary-foreground shadow-elegant'
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}>
            <div className="i-mdi-send text-2xl" />
          </button>
        </div>
      </div>
    </div>
  )
}
