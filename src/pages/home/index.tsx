import {useState, useEffect, useCallback} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {getActivities, getPlatformNames} from '@/db/api'
import type {Activity, ActivityType} from '@/db/types'
import ActivityCard from '@/components/ActivityCard'
import FilterBar from '@/components/FilterBar'

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all')
  const [selectedPlatform, setSelectedPlatform] = useState('')

  const loadPlatforms = useCallback(async () => {
    const {data} = await getPlatformNames()
    setPlatforms(data)
  }, [])

  const loadActivities = useCallback(async () => {
    setLoading(true)
    const filters: any = {isActive: true}
    if (selectedType !== 'all') {
      filters.activityType = selectedType
    }
    if (selectedPlatform) {
      filters.platformName = selectedPlatform
    }

    const {data} = await getActivities(filters, 1, 50)
    setActivities(data)
    setLoading(false)
  }, [selectedType, selectedPlatform])

  useEffect(() => {
    loadPlatforms()
  }, [loadPlatforms])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  useDidShow(() => {
    loadActivities()
  })

  const handleGoToAgent = () => {
    Taro.switchTab({url: '/pages/agent/index'})
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* Hero区域 */}
        <div className="bg-gradient-primary rounded-2xl p-6 shadow-elegant">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="i-mdi-radar text-5xl text-primary-foreground" />
              <h1 className="text-3xl font-bold text-primary-foreground">AI 羊毛雷达</h1>
            </div>
            <p className="text-xl text-primary-foreground/90">
              聚合各大AI平台最新优惠活动，帮你高效获取AI资源福利
            </p>
            <button
              type="button"
              className="bg-card text-primary px-6 py-4 rounded-xl text-xl font-semibold shadow-md flex items-center justify-center gap-2 leading-none"
              onClick={handleGoToAgent}>
              <div className="i-mdi-robot text-2xl" />
              <span>与AI助手对话</span>
            </button>
          </div>
        </div>

        {/* 筛选器 */}
        <FilterBar
          selectedType={selectedType}
          selectedPlatform={selectedPlatform}
          platforms={platforms}
          onTypeChange={setSelectedType}
          onPlatformChange={setSelectedPlatform}
        />

        {/* 活动列表 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">最新活动</h2>
            <span className="text-lg text-muted-foreground">共 {activities.length} 个</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="i-mdi-loading text-5xl text-primary animate-spin" />
                <span className="text-xl text-muted-foreground">加载中...</span>
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="i-mdi-inbox text-6xl text-muted-foreground" />
                <span className="text-xl text-muted-foreground">暂无活动</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
