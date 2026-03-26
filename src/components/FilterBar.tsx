import {useState} from 'react'
import type {ActivityType} from '@/db/types'
import {ACTIVITY_TYPE_LABELS} from '@/db/types'

interface FilterBarProps {
  selectedType: ActivityType | 'all'
  selectedPlatform: string
  platforms: string[]
  onTypeChange: (type: ActivityType | 'all') => void
  onPlatformChange: (platform: string) => void
}

export default function FilterBar({
  selectedType,
  selectedPlatform,
  platforms,
  onTypeChange,
  onPlatformChange
}: FilterBarProps) {
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)

  const activityTypes: Array<{value: ActivityType | 'all'; label: string}> = [
    {value: 'all', label: '全部'},
    {value: 'free_quota', label: ACTIVITY_TYPE_LABELS.free_quota},
    {value: 'trial', label: ACTIVITY_TYPE_LABELS.trial},
    {value: 'points_reward', label: ACTIVITY_TYPE_LABELS.points_reward},
    {value: 'api_gift', label: ACTIVITY_TYPE_LABELS.api_gift},
    {value: 'discount', label: ACTIVITY_TYPE_LABELS.discount},
    {value: 'limited_time', label: ACTIVITY_TYPE_LABELS.limited_time}
  ]

  const handlePlatformSelect = (platform: string) => {
    onPlatformChange(platform)
    setShowPlatformPicker(false)
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-md">
      <div className="flex flex-col gap-4">
        {/* 活动类型筛选 */}
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-foreground">活动类型</span>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center leading-none ${
                  selectedType === type.value
                    ? 'bg-gradient-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => onTypeChange(type.value)}>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 平台筛选 */}
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-foreground">平台</span>
          <div className="relative">
            <button
              type="button"
              className="w-full px-4 py-3 rounded-lg bg-muted text-foreground text-lg flex items-center justify-between"
              onClick={() => setShowPlatformPicker(!showPlatformPicker)}>
              <span>{selectedPlatform || '全部平台'}</span>
              <div
                className={`i-mdi-chevron-down text-2xl transition-transform duration-200 ${showPlatformPicker ? 'rotate-180' : ''}`}
              />
            </button>

            {showPlatformPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-elegant max-h-64 overflow-y-auto z-10">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-lg text-left hover:bg-muted transition-colors"
                  onClick={() => handlePlatformSelect('')}>
                  全部平台
                </button>
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className="w-full px-4 py-3 text-lg text-left hover:bg-muted transition-colors"
                    onClick={() => handlePlatformSelect(platform)}>
                    {platform}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
