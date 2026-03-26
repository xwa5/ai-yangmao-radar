import {useState, useEffect, useCallback, useMemo} from 'react'
import Taro, {useDidShow, getCurrentInstance, useShareAppMessage, useShareTimeline} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {getActivityById, checkIsFavorited, addFavorite, removeFavorite} from '@/db/api'
import type {Activity} from '@/db/types'
import {ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS} from '@/db/types'

export default function ActivityDetail() {
  const {user} = useAuth()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const activityId = useMemo(() => {
    const instance = getCurrentInstance()
    return decodeURIComponent(instance.router?.params?.id || '')
  }, [])

  const loadActivity = useCallback(async () => {
    if (!activityId) return

    setLoading(true)
    const {data} = await getActivityById(activityId)
    setActivity(data)
    setLoading(false)

    // 检查收藏状态
    if (user && data) {
      const {isFavorited: favorited} = await checkIsFavorited(user.id, data.id)
      setIsFavorited(favorited)
    }
  }, [activityId, user])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  useDidShow(() => {
    loadActivity()
  })

  // 配置分享到聊天
  useShareAppMessage(() => {
    return {
      title: activity?.title || 'AI羊毛雷达'
    }
  })

  // 配置分享到朋友圈
  useShareTimeline(() => {
    return {
      title: activity?.title || 'AI羊毛雷达'
    }
  })

  const handleFavoriteToggle = async () => {
    if (!user) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        Taro.navigateTo({url: '/pages/login/index'})
      }, 2000)
      return
    }

    if (!activity) return

    setFavoriteLoading(true)
    try {
      if (isFavorited) {
        const {error} = await removeFavorite(user.id, activity.id)
        if (!error) {
          setIsFavorited(false)
          Taro.showToast({title: '已取消收藏', icon: 'success'})
        }
      } else {
        const {error} = await addFavorite(user.id, activity.id)
        if (!error) {
          setIsFavorited(true)
          Taro.showToast({title: '收藏成功', icon: 'success'})
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleOpenLink = () => {
    if (!activity?.original_link) {
      Taro.showToast({
        title: '暂无原始链接',
        icon: 'none'
      })
      return
    }

    Taro.showModal({
      title: '提示',
      content: '即将跳转到外部链接，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 复制链接到剪贴板
          Taro.setClipboardData({
            data: activity.original_link || '',
            success: () => {
              Taro.showToast({
                title: '链接已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="i-mdi-loading text-5xl text-primary animate-spin" />
          <span className="text-xl text-muted-foreground">加载中...</span>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="i-mdi-alert-circle text-6xl text-destructive" />
          <span className="text-xl text-muted-foreground">活动不存在</span>
        </div>
      </div>
    )
  }

  const isExpired = activity.end_time && new Date(activity.end_time) < new Date()

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* 头部卡片 */}
        <div className="bg-gradient-card rounded-2xl p-6 shadow-elegant">
          <div className="flex flex-col gap-4">
            {/* 平台信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="i-mdi-rocket-launch text-4xl text-primary" />
                <span className="text-2xl font-bold text-foreground">{activity.platform_name}</span>
              </div>
              <button
                type="button"
                className="flex items-center justify-center p-2"
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}>
                <div
                  className={`text-4xl ${isFavorited ? 'i-mdi-heart text-destructive' : 'i-mdi-heart-outline text-muted-foreground'}`}
                />
              </button>
            </div>

            {/* 活动标题 */}
            <h1 className="text-3xl font-bold text-foreground">{activity.title}</h1>

            {/* 标签 */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-4 py-2 rounded-full text-lg font-medium ${ACTIVITY_TYPE_COLORS[activity.activity_type]}`}>
                {ACTIVITY_TYPE_LABELS[activity.activity_type]}
              </span>
              <span className="px-4 py-2 rounded-full text-lg font-medium bg-muted text-muted-foreground">
                {activity.target_audience}
              </span>
              {isExpired && (
                <span className="px-4 py-2 rounded-full text-lg font-medium bg-destructive/10 text-destructive">
                  已结束
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 活动详情 */}
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <div className="flex flex-col gap-6">
            {/* 活动描述 */}
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="i-mdi-information text-3xl text-primary" />
                <span>活动详情</span>
              </h2>
              <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                {activity.detailed_description?.replace(/\\n/g, '\n')}
              </p>
            </div>

            {/* 参与方式 */}
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="i-mdi-clipboard-list text-3xl text-primary" />
                <span>参与方式</span>
              </h2>
              <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                {activity.participation_steps?.replace(/\\n/g, '\n')}
              </p>
            </div>

            {/* 有效期 */}
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="i-mdi-clock-outline text-3xl text-primary" />
                <span>有效期</span>
              </h2>
              <p className="text-lg text-foreground">
                {activity.end_time
                  ? `截止时间：${new Date(activity.end_time).toLocaleString('zh-CN')}`
                  : '长期有效'}
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          {activity.original_link && (
            <button
              type="button"
              className="bg-gradient-primary text-primary-foreground px-6 py-5 rounded-xl text-2xl font-bold shadow-elegant flex items-center justify-center gap-2 leading-none"
              onClick={handleOpenLink}>
              <div className="i-mdi-link-variant text-3xl" />
              <span>复制活动链接</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
