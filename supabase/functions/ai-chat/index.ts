import { createClient } from 'jsr:@supabase/supabase-js'
import Anthropic from 'npm:@anthropic-ai/sdk'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const STOP_WORDS = new Set(['的', '了', '有', '什么', '哪些', '怎么', '如何', '是', '吗', '呢', '啊', '吧', '在', '和', '与', '或', '我', '你', '他', '她', '它', '我们', '你们', '他们'])

function extractKeywords(text: string): string[] {
  return text
    .split(/[\s，。？！、；：""''（）【】\.,?!;:()\[\]]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
    .map(w => w.replace(/%/g, '\\%').replace(/_/g, '\\_'))
    .slice(0, 5)
}

async function searchActivities(keyword: string) {
  const keywords = extractKeywords(keyword)
  if (keywords.length === 0) return []

  const orConditions = keywords
    .map(kw => `title.ilike.%${kw}%,platform_name.ilike.%${kw}%,short_description.ilike.%${kw}%`)
    .join(',')

  const { data, error } = await supabase
    .from('activities')
    .select('title, platform_name, short_description, end_time, activity_type')
    .or(orConditions)
    .eq('is_active', true)
    .limit(5)

  if (error) {
    console.error('searchActivities error:', error)
    return []
  }

  const seen = new Set<string>()
  return (data || []).filter(a => {
    if (seen.has(a.title)) return false
    seen.add(a.title)
    return true
  })
}

function validateHistory(history: unknown[]): Anthropic.MessageParam[] {
  if (!Array.isArray(history)) return []

  const valid: Anthropic.MessageParam[] = []
  for (const item of history) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !['user', 'assistant'].includes((item as any).role) ||
      typeof (item as any).content !== 'string'
    ) continue

    const content = String((item as any).content).slice(0, 2000)
    valid.push({ role: (item as any).role, content })
  }

  return valid.slice(-20)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { message, history = [] } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return jsonResponse({ error: '消息不能为空', code: 'INVALID_REQUEST' }, 400)
    }

    const trimmedMessage = message.slice(0, 2000)
    const validHistory = validateHistory(history)

    const activities = await searchActivities(trimmedMessage)

    const activitiesText = activities.length > 0
      ? `\n\n当前数据库中与用户问题相关的AI优惠活动：\n${JSON.stringify(activities, null, 2)}`
      : '\n\n当前数据库中未找到与用户问题直接相关的活动，请根据你的知识回答，并建议用户换个关键词搜索。'

    const systemPrompt = `你是"AI羊毛雷达"智能助手，专注于帮用户找到各大AI平台（如OpenAI、Claude、文心一言、讯飞星火等）的优惠活动、免费额度、试用资格等羊毛信息。

回答要求：
- 简洁清晰，重点突出
- 如有活动数据，优先基于数据回答
- 如需补充，可结合你的训练知识
- 使用中文回答${activitiesText}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...validHistory,
        { role: 'user', content: trimmedMessage },
      ],
    })

    const reply = response.content.find(b => b.type === 'text')?.text ?? '抱歉，我无法生成回答，请稍后重试。'

    return jsonResponse({ reply })
  } catch (error) {
    console.error('ai-chat error:', error)
    return jsonResponse({ error: '调用失败，请稍后重试', code: 'CLAUDE_ERROR' }, 500)
  }
})
