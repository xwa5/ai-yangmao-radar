import {useState, useCallback} from 'react'
import {useAuth} from '@/contexts/AuthContext'
import {searchActivities, saveChatHistory} from '@/db/api'
import {ACTIVITY_TYPE_LABELS} from '@/db/types'
import type {ActivityType} from '@/db/types'
import ChatBubble from '@/components/ChatBubble'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: string
}

export default function Agent() {
  const {user} = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是AI羊毛雷达助手，可以帮你查询各大AI平台的优惠活动。\n\n你可以这样问我：\n• "查询GPT相关的优惠"\n• "有哪些免费额度活动"\n• "OpenAI有什么活动"\n• "查询试用资格"',
      isUser: false,
      timestamp: new Date().toISOString()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // 添加用户消息
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      // 搜索活动
      const {data: activities} = await searchActivities(userMessage)

      let agentResponse = ''
      if (activities.length === 0) {
        agentResponse = '暂未找到相关活动，可以尝试换个关键词哦～\n\n建议：\n• 尝试使用平台名称（如OpenAI、Claude）\n• 尝试使用活动类型（如免费、试用、折扣）\n• 简化搜索词'
      } else {
        agentResponse = `为你找到 ${activities.length} 个相关活动：\n\n`
        activities.forEach((activity, index) => {
          const typeLabel = ACTIVITY_TYPE_LABELS[activity.activity_type as ActivityType]
          agentResponse += `${index + 1}. ${activity.platform_name} - ${activity.title}\n`
          agentResponse += `   类型：${typeLabel} | 适用：${activity.target_audience}\n`
          agentResponse += `   ${activity.short_description}\n`
          if (activity.end_time) {
            const endDate = new Date(activity.end_time).toLocaleDateString('zh-CN')
            agentResponse += `   截止时间：${endDate}\n`
          }
          agentResponse += '\n'
        })
        agentResponse += '点击首页的活动卡片可查看详细参与方式～'
      }

      // 添加AI回复
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      }
      setMessages((prev) => [...prev, agentMsg])

      // 如果用户已登录，保存对话历史
      if (user) {
        await saveChatHistory(user.id, userMessage, agentResponse)
      }
    } catch (error) {
      console.error('搜索失败:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，搜索出现问题了，请稍后再试～',
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
      {/* 消息列表 */}
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

      {/* 输入框 */}
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
