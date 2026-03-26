# 开发会话总结 2026-03-26

## 项目信息

- **项目**：AI 羊毛雷达微信小程序
- **技术栈**：Taro + React + TypeScript + Supabase
- **GitHub**：https://github.com/xwa5/ai-yangmao-radar

---

## 本次完成内容

### 1. 项目启动

- 安装依赖 `pnpm install`，修复脚本权限
- 运行 `pnpm lint` 确认代码质量（无 error，3 个非阻塞 warning）

### 2. 微信开发者工具问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `proxyCache.getProxyCachePath is not a function` | 代理初始化 bug | 关闭 VPN / 开发者工具内重置代理 |
| `dist/app.json not found` 模拟器启动失败 | `dist/` 目录未生成 | 先执行编译 |
| `dev:weapp` 脚本被禁用 | package.json 脚本被替换为 echo | 改用 `pnpm exec taro build --type weapp --watch` |
| `request:fail url not in domain list` | 域名未加白名单 | 开发者工具「本地设置」勾选「不校验合法域名」 |

### 3. Bug 修复：详情页 `\n` 显示问题

- **文件**：`src/pages/activity-detail/index.tsx`
- **原因**：数据库存储的是字面量 `\n` 字符串，`whitespace-pre-wrap` 无法解析
- **修复**：渲染前执行 `.replace(/\\n/g, '\n')` 转换为真实换行符

### 4. GitHub 初始化

- 配置远程仓库：`https://github.com/xwa5/ai-yangmao-radar.git`
- 推送全部代码到 `main` 分支

### 5. AI 助手接入 Claude（核心功能）

**原状**：纯关键词搜索 + 字符串拼接，无真实 AI

**新架构**：

```
小程序 → Supabase Edge Function (ai-chat) → 搜索 DB + 调用 Claude → 返回自然语言回答
```

**实现内容**：

| 文件 | 变更 |
|------|------|
| `supabase/functions/ai-chat/index.ts` | 新建：关键词提取、DB 搜索、Claude 调用、history 校验 |
| `src/db/api.ts` | 新增 `ChatMessage` 类型和 `callAiChat()` 函数 |
| `src/pages/agent/index.tsx` | 替换：接入 `callAiChat`，`useRef` 维护多轮 history |

**关键设计**：
- 关键词分词 + 停用词过滤，提升中文搜索命中率
- `%` / `_` 特殊字符转义，防止 ilike 注入
- history 只在 AI 成功响应时更新，避免错误信息污染上下文
- 登录用户静默保存 chat_history，出错不影响主流程
- 模型：`claude-sonnet-4-6`，`max_tokens: 1024`

### 6. Supabase 项目初始化

- 修复 `config.toml` 中不支持的 `auth.phone` 配置
- 新建个人账号下的 Supabase 项目（ID：`xunxkjmrupltudzmjnru`）
- 执行 `supabase db push` 初始化数据库表结构

---

## Git 提交记录

```
4981cc2 feat: 改用 ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL 配置，默认模型改为 claude-sonnet-4-6
a391a6f fix: 移除 config.toml 中不支持的 auth.phone 配置
dc9d475 fix: 仅在 AI 成功响应时更新对话历史，避免错误信息污染上下文
e3e9090 feat: Agent 页接入真实 Claude AI，支持多轮对话
221e720 feat: 新增 callAiChat API 函数
7e05a45 fix: 转义 ilike 关键词特殊字符，处理数据库查询错误
5359ed4 feat: 新增 ai-chat Edge Function，接入 Claude claude-sonnet-4-6
30b2d44 docs: 添加 AI 对话接入实现计划
1aaf697 docs: 添加 AI 对话接入设计文档
5f9a6de fix: 修复详情页 \n 字符未正确渲染为换行的问题
```

---

## TODO

### 🔴 阻塞项（必须解决才能运行 AI 功能）

- [ ] **解决 Claude API 访问问题**
  - 当前问题：`ANTHROPIC_BASE_URL` 设置为百度内网地址 `oneapi-comate.baidu-int.com`，Supabase Edge Function 运行在 AWS 公网，无法访问内网
  - 方案 A：使用官方 Anthropic API Key，删除 `ANTHROPIC_BASE_URL` 配置
  - 方案 B：将 AI 调用移到小程序端直接请求（需小程序能访问该内网地址）

### 🟡 待完成（功能上线前）

- [ ] **配置 Supabase Secrets**（`ANTHROPIC_AUTH_TOKEN` + 可选 `ANTHROPIC_BASE_URL`）
- [ ] **部署 Edge Function**：`supabase functions deploy ai-chat`
- [ ] **配置微信域名白名单**：在微信公众平台添加 `https://xunxkjmrupltudzmjnru.supabase.co` 为合法域名
- [ ] **配置 Supabase 项目 URL**：更新 `.env` 文件
  ```
  TARO_APP_SUPABASE_URL=https://xunxkjmrupltudzmjnru.supabase.co
  TARO_APP_SUPABASE_ANON_KEY=（从 Supabase 控制台 Project Settings → API 获取）
  ```
- [ ] **填充活动数据**：数据库已有表结构，需录入真实的 AI 平台优惠活动数据

