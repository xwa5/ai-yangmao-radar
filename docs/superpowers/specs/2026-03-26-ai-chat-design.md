# AI 对话接入设计文档

**日期：** 2026-03-26
**状态：** 已确认

---

## 目标

将 AI 羊毛雷达小程序的 Agent 对话页从"关键词搜索 + 字符串拼接"升级为真实 Claude AI 对话，支持多轮上下文记忆和自然语言问答。

---

## 方案

**Supabase Edge Function 代理**（方案 A）

小程序不直接调用 Claude API，通过已有的 Supabase Edge Function 基础设施作为安全代理。

---

## 架构

```
小程序 Agent 页
    │  { message, history[] }
    ▼
Supabase Edge Function: ai-chat
    │  1. 提取关键词 → ilike 搜索 activities 表（取前5条）
    │  2. 构建 system prompt（注入精简活动字段）
    │  3. 校验并拼装多轮 messages（最近20条）
    ▼
Claude API (claude-opus-4-6)
    ▼
Edge Function 返回 { reply: string }
    ▼
小程序展示 + 静默保存 chat_history（登录用户）
```

---

## 接口设计

### 请求（小程序 → Edge Function）

```
POST /functions/v1/ai-chat
Authorization: Bearer <supabase-anon-key>

{
  "message": "Claude有什么免费额度？",
  "history": [
    { "role": "user", "content": "有哪些AI平台活动？" },
    { "role": "assistant", "content": "为你找到以下活动..." }
  ]
}
```

### 响应

```json
{ "reply": "Claude目前提供..." }
```

### 错误响应

```json
{ "error": "调用失败，请稍后重试", "code": "CLAUDE_ERROR" }
```

错误码：`CLAUDE_ERROR` | `INVALID_REQUEST` | `RATE_LIMIT`

---

## Edge Function 逻辑

1. **输入校验**
   - `message` 长度限制 2000 字符
   - `history` 只允许 `role: "user"` 和 `role: "assistant"` 交替出现，过滤其他 role
   - 单条 history content 长度限制 2000 字符
   - 截取最近 20 条（10 个来回）：`history.slice(-20)`

2. **关键词搜索**
   - 按空格/标点分词，过滤停用词（的、有、什么、哪些等）
   - 对每个关键词分别做 `ilike` 搜索，合并去重，取前 5 条 `is_active=true` 的活动
   - 注入字段：`title`、`platform_name`、`short_description`、`end_time`（不含长文本字段）

3. **System Prompt**
   - 角色：AI 羊毛雷达助手，专注 AI 平台优惠活动
   - 注入搜索到的活动数据（精简 JSON）
   - 无相关活动时提示 Claude 引导用户换关键词

4. **Claude 调用**
   - 模型：`claude-opus-4-6`
   - `max_tokens: 1024`（不启用 thinking，普通对话无需）
   - `messages`：system prompt + history + 当前 message

5. **返回**：提取第一个 `type: "text"` 的 content block

---

## 访问控制

- **允许匿名调用**：活动信息本身公开，无需强制登录
- **防滥用**：依赖 Supabase 平台级限流（后续如有需要可加 Edge Function 内计数器）
- **API Key 安全**：`ANTHROPIC_API_KEY` 仅存于 Edge Function 环境变量，不暴露客户端

---

## 涉及文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `supabase/functions/ai-chat/index.ts` | 新建 | Edge Function 主逻辑 |
| `src/db/api.ts` | 新增函数 | `callAiChat(message, history)` |
| `src/pages/agent/index.tsx` | 修改 | 替换 `handleSend`，维护多轮 history |

---

## 环境变量

在 Supabase 控制台 → Edge Functions → Secrets 配置：

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| Claude API 报错 | 返回 `{ error, code: "CLAUDE_ERROR" }`，小程序显示"请稍后重试" |
| 请求格式非法 | 返回 400 + `{ error, code: "INVALID_REQUEST" }` |
| 搜索无结果 | system prompt 告知 Claude 无相关活动，由 Claude 引导用户 |
| chat_history 保存失败 | 静默忽略，不影响主流程，不提示用户 |
| 未登录用户 | 正常调用 AI，跳过 chat_history 保存 |

---

## 不在此次范围内

- 流式输出（streaming）
- 新建会话按钮
- 对话历史分 session 管理
- Edge Function 内自定义限流
