// 数据库类型定义

export type UserRole = 'user' | 'admin'

export type ActivityType = 'free_quota' | 'trial' | 'points_reward' | 'api_gift' | 'discount' | 'limited_time'

export interface Profile {
  id: string
  username: string | null
  openid: string | null
  role: UserRole
  avatar_url: string | null
  nickname: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  platform_name: string
  platform_logo: string | null
  title: string
  activity_type: ActivityType
  target_audience: string
  end_time: string | null
  short_description: string
  detailed_description: string
  participation_steps: string
  original_link: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatHistory {
  id: string
  user_id: string
  user_message: string
  agent_response: string
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  activity_id: string
  created_at: string
}

// 带活动信息的收藏
export interface FavoriteWithActivity extends Favorite {
  activity: Activity
}

// 活动类型标签映射
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  free_quota: '免费额度',
  trial: '试用资格',
  points_reward: '积分奖励',
  api_gift: 'API赠送',
  discount: '红包折扣',
  limited_time: '限时福利'
}

// 活动类型颜色映射
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  free_quota: 'bg-primary/10 text-primary',
  trial: 'bg-secondary/10 text-secondary',
  points_reward: 'bg-accent/10 text-accent',
  api_gift: 'bg-chart-4/10 text-chart-4',
  discount: 'bg-destructive/10 text-destructive',
  limited_time: 'bg-chart-5/10 text-chart-5'
}
