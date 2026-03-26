import Taro from '@tarojs/taro'
import type {Activity} from '@/db/types'
import {ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS} from '@/db/types'

interface ActivityCardProps {
  activity: Activity
  showFavoriteButton?: boolean
  isFavorited?: boolean
  onFavoriteToggle?: () => void
}

export default function ActivityCard({
  activity,
  showFavoriteButton = false,
  isFavorited = false,
  onFavoriteToggle
}: ActivityCardProps) {
  const handleCardClick = () => {
    Taro.navigateTo({
      url: `/pages/activity-detail/index?id=${activity.id}`
    })
  }

  const handleFavoriteClick = (e: any) => {
    e.stopPropagation()
    onFavoriteToggle?.()
  }

  // 检查活动是否已结束
  const isExpired = activity.end_time && new Date(activity.end_time) < new Date()

  return (
    <div
      className="bg-card rounded-xl p-5 shadow-md transition-all duration-300 hover:shadow-elegant"
      onClick={handleCardClick}>
      <div className="flex flex-col gap-3">
        {/* 头部：平台名称和收藏按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="i-mdi-rocket-launch text-3xl text-primary" />
            <span className="text-xl font-semibold text-foreground">{activity.platform_name}</span>
          </div>
          {showFavoriteButton && (
            <button
              type="button"
              className="flex items-center justify-center p-2"
              onClick={handleFavoriteClick}>
              <div
                className={`text-3xl ${isFavorited ? 'i-mdi-heart text-destructive' : 'i-mdi-heart-outline text-muted-foreground'}`}
              />
            </button>
          )}
        </div>

        {/* 活动标题 */}
        <h3 className="text-2xl font-bold text-foreground line-clamp-2">{activity.title}</h3>

        {/* 标签行 */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-base font-medium ${ACTIVITY_TYPE_COLORS[activity.activity_type]}`}>
            {ACTIVITY_TYPE_LABELS[activity.activity_type]}
          </span>
          <span className="px-3 py-1 rounded-full text-base font-medium bg-muted text-muted-foreground">
            {activity.target_audience}
          </span>
          {isExpired && (
            <span className="px-3 py-1 rounded-full text-base font-medium bg-destructive/10 text-destructive">
              已结束
            </span>
          )}
        </div>

        {/* 简短描述 */}
        <p className="text-lg text-muted-foreground line-clamp-2">{activity.short_description}</p>

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {activity.end_time ? (
            <div className="flex items-center gap-1">
              <div className="i-mdi-clock-outline text-xl text-muted-foreground" />
              <span className="text-base text-muted-foreground">
                截止：{new Date(activity.end_time).toLocaleDateString('zh-CN')}
              </span>
            </div>
          ) : (
            <span className="text-base text-muted-foreground">长期有效</span>
          )}
          <div className="flex items-center gap-1 text-primary">
            <span className="text-base font-medium">查看详情</span>
            <div className="i-mdi-chevron-right text-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
