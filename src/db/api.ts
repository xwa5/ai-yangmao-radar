import {supabase} from '@/client/supabase'
import type {ActivityType} from './types'

// ==================== 活动相关API ====================

/**
 * 获取活动列表
 * @param filters 筛选条件
 * @param page 页码（从1开始）
 * @param pageSize 每页数量
 */
export async function getActivities(
  filters?: {
    activityType?: ActivityType
    platformName?: string
    isActive?: boolean
  },
  page = 1,
  pageSize = 20
) {
  let query = supabase
    .from('activities')
    .select('*', {count: 'exact'})
    .order('created_at', {ascending: false})

  if (filters?.activityType) {
    query = query.eq('activity_type', filters.activityType)
  }

  if (filters?.platformName) {
    query = query.eq('platform_name', filters.platformName)
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const {data, error, count} = await query

  if (error) {
    console.error('获取活动列表失败:', error)
    return {data: [], count: 0, error}
  }

  return {data: Array.isArray(data) ? data : [], count: count || 0, error: null}
}

/**
 * 获取活动详情
 */
export async function getActivityById(id: string) {
  const {data, error} = await supabase.from('activities').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取活动详情失败:', error)
    return {data: null, error}
  }

  return {data, error: null}
}

/**
 * 获取所有平台名称（用于筛选）
 */
export async function getPlatformNames() {
  const {data, error} = await supabase
    .from('activities')
    .select('platform_name')
    .order('platform_name', {ascending: true})

  if (error) {
    console.error('获取平台列表失败:', error)
    return {data: [], error}
  }

  // 去重
  const uniquePlatforms = Array.from(new Set((data || []).map((item) => item.platform_name)))
  return {data: uniquePlatforms, error: null}
}

/**
 * 搜索活动（用于Agent）
 */
export async function searchActivities(keyword: string) {
  const {data, error} = await supabase
    .from('activities')
    .select('*')
    .or(
      `title.ilike.%${keyword}%,platform_name.ilike.%${keyword}%,short_description.ilike.%${keyword}%,detailed_description.ilike.%${keyword}%`
    )
    .eq('is_active', true)
    .order('created_at', {ascending: false})
    .limit(10)

  if (error) {
    console.error('搜索活动失败:', error)
    return {data: [], error}
  }

  return {data: Array.isArray(data) ? data : [], error: null}
}

// ==================== 收藏相关API ====================

/**
 * 检查是否已收藏
 */
export async function checkIsFavorited(userId: string, activityId: string) {
  const {data, error} = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('activity_id', activityId)
    .maybeSingle()

  if (error) {
    console.error('检查收藏状态失败:', error)
    return {isFavorited: false, error}
  }

  return {isFavorited: !!data, error: null}
}

/**
 * 添加收藏
 */
export async function addFavorite(userId: string, activityId: string) {
  const {error} = await supabase.from('favorites').insert({
    user_id: userId,
    activity_id: activityId
  })

  if (error) {
    console.error('添加收藏失败:', error)
    return {error}
  }

  return {error: null}
}

/**
 * 取消收藏
 */
export async function removeFavorite(userId: string, activityId: string) {
  const {error} = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('activity_id', activityId)

  if (error) {
    console.error('取消收藏失败:', error)
    return {error}
  }

  return {error: null}
}

/**
 * 获取用户收藏列表
 */
export async function getUserFavorites(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const {data, error, count} = await supabase
    .from('favorites')
    .select('*, activity:activities(*)', {count: 'exact'})
    .eq('user_id', userId)
    .order('created_at', {ascending: false})
    .range(from, to)

  if (error) {
    console.error('获取收藏列表失败:', error)
    return {data: [], count: 0, error}
  }

  return {data: Array.isArray(data) ? data : [], count: count || 0, error: null}
}

// ==================== 对话历史相关API ====================

/**
 * 保存对话历史
 */
export async function saveChatHistory(userId: string, userMessage: string, agentResponse: string) {
  const {error} = await supabase.from('chat_history').insert({
    user_id: userId,
    user_message: userMessage,
    agent_response: agentResponse
  })

  if (error) {
    console.error('保存对话历史失败:', error)
    return {error}
  }

  return {error: null}
}

/**
 * 获取用户对话历史
 */
export async function getUserChatHistory(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const {data, error, count} = await supabase
    .from('chat_history')
    .select('*', {count: 'exact'})
    .eq('user_id', userId)
    .order('created_at', {ascending: false})
    .range(from, to)

  if (error) {
    console.error('获取对话历史失败:', error)
    return {data: [], count: 0, error}
  }

  return {data: Array.isArray(data) ? data : [], count: count || 0, error: null}
}

/**
 * 删除对话历史
 */
export async function deleteChatHistory(userId: string, chatId: string) {
  const {error} = await supabase.from('chat_history').delete().eq('id', chatId).eq('user_id', userId)

  if (error) {
    console.error('删除对话历史失败:', error)
    return {error}
  }

  return {error: null}
}
