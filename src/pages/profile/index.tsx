import {useState, useEffect, useCallback} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {getUserFavorites, getUserChatHistory, removeFavorite, deleteChatHistory} from '@/db/api'
import type {FavoriteWithActivity, ChatHistory} from '@/db/types'
import ActivityCard from '@/components/ActivityCard'

function Profile() {
  const {user, profile, signOut} = useAuth()
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites')
  const [favorites, setFavorites] = useState<FavoriteWithActivity[]>([])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [loading, setLoading] = useState(false)

  const loadFavorites = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const {data} = await getUserFavorites(user.id, 1, 50)
    setFavorites(data as FavoriteWithActivity[])
    setLoading(false)
  }, [user])

  const loadChatHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const {data} = await getUserChatHistory(user.id, 1, 50)
    setChatHistory(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavorites()
    } else {
      loadChatHistory()
    }
  }, [activeTab, loadFavorites, loadChatHistory])

  useDidShow(() => {
    if (activeTab === 'favorites') {
      loadFavorites()
    } else {
      loadChatHistory()
    }
  })

  const handleRemoveFavorite = async (activityId: string) => {
    if (!user) return
    const {error} = await removeFavorite(user.id, activityId)
    if (!error) {
      Taro.showToast({title: '已取消收藏', icon: 'success'})
      loadFavorites()
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条对话记录吗？',
      success: async (res) => {
        if (res.confirm) {
          const {error} = await deleteChatHistory(user.id, chatId)
          if (!error) {
            Taro.showToast({title: '删除成功', icon: 'success'})
            loadChatHistory()
          }
        }
      }
    })
  }

  const handleSignOut = async () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          await signOut()
          Taro.showToast({title: '已退出登录', icon: 'success'})
          setTimeout(() => {
            Taro.reLaunch({url: '/pages/home/index'})
          }, 1500)
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* 用户信息卡片 */}
        <div className="bg-gradient-primary rounded-2xl p-6 shadow-elegant">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={String(profile.avatar_url)} alt="头像" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="i-mdi-account text-5xl text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-primary-foreground">
                {String(profile?.nickname || profile?.username || '用户')}
              </h2>
              <span className="text-lg text-primary-foreground/80">
                {profile?.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="bg-card rounded-xl p-2 shadow-md flex gap-2">
          <button
            type="button"
            className={`flex-1 px-6 py-3 rounded-lg text-xl font-semibold transition-all duration-200 flex items-center justify-center leading-none ${
              activeTab === 'favorites'
                ? 'bg-gradient-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('favorites')}>
            我的收藏
          </button>
          <button
            type="button"
            className={`flex-1 px-6 py-3 rounded-lg text-xl font-semibold transition-all duration-200 flex items-center justify-center leading-none ${
              activeTab === 'history'
                ? 'bg-gradient-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('history')}>
            对话历史
          </button>
        </div>

        {/* 内容区域 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="i-mdi-loading text-5xl text-primary animate-spin" />
              <span className="text-xl text-muted-foreground">加载中...</span>
            </div>
          </div>
        ) : activeTab === 'favorites' ? (
          <div className="flex flex-col gap-4">
            {favorites.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="i-mdi-heart-outline text-6xl text-muted-foreground" />
                  <span className="text-xl text-muted-foreground">暂无收藏</span>
                </div>
              </div>
            ) : (
              favorites.map((fav) => (
                <ActivityCard
                  key={fav.id}
                  activity={fav.activity}
                  showFavoriteButton={true}
                  isFavorited={true}
                  onFavoriteToggle={() => handleRemoveFavorite(fav.activity_id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="i-mdi-message-outline text-6xl text-muted-foreground" />
                  <span className="text-xl text-muted-foreground">暂无对话历史</span>
                </div>
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div key={chat.id} className="bg-card rounded-xl p-5 shadow-md">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="i-mdi-account text-2xl text-primary" />
                          <span className="text-lg font-semibold text-foreground">我：</span>
                        </div>
                        <p className="text-lg text-foreground">{chat.user_message}</p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center p-2"
                        onClick={() => handleDeleteChat(chat.id)}>
                        <div className="i-mdi-delete text-2xl text-destructive" />
                      </button>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="i-mdi-robot text-2xl text-secondary" />
                        <span className="text-lg font-semibold text-foreground">AI助手：</span>
                      </div>
                      <p className="text-lg text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {chat.agent_response}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      {new Date(chat.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 退出登录按钮 */}
        <button
          type="button"
          className="bg-card text-destructive px-6 py-4 rounded-xl text-xl font-semibold shadow-md border-2 border-destructive/20 flex items-center justify-center gap-2 leading-none"
          onClick={handleSignOut}>
          <div className="i-mdi-logout text-2xl" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}

export default withRouteGuard(Profile)
