# 任务：AI 羊毛雷达微信小程序

## Plan
- [x] 步骤1：初始化数据库和配置（已完成）
  - [x] 初始化Supabase
  - [x] 禁用邮箱验证
  - [x] 创建数据库表结构和RLS策略
  - [x] 插入示例活动数据
  - [x] 创建微信登录Edge Function
- [x] 步骤2：配置颜色系统和样式（已完成）
  - [x] 更新app.scss配置科技感蓝色主题
  - [x] 更新tailwind.config.js
- [x] 步骤3：创建数据库API层（已完成）
  - [x] 创建类型定义
  - [x] 创建活动查询API
  - [x] 创建收藏API
  - [x] 创建对话历史API
- [x] 步骤4：更新AuthContext和RouteGuard（已完成）
  - [x] 更新AuthContext添加profiles字段
  - [x] 更新RouteGuard配置公开页面路径
- [x] 步骤5：创建页面和组件（已完成）
  - [x] 创建首页（活动聚合）
  - [x] 创建Agent对话页
  - [x] 创建活动详情页
  - [x] 创建个人中心页
  - [x] 创建登录页
  - [x] 创建活动卡片组件
  - [x] 创建筛选器组件
  - [x] 创建对话气泡组件
- [x] 步骤6：配置路由和TabBar（已完成）
  - [x] 更新app.config.ts配置路由
  - [x] 配置TabBar图标
- [x] 步骤7：搜索和替换图片（已完成）
  - [x] 搜索真实图片URL
  - [x] 替换占位图片
- [x] 步骤8：更新app.tsx添加AuthProvider（已完成）
- [x] 步骤9：运行lint检查并修复（已完成）

## Notes
- 项目使用Taro + React + TypeScript + Supabase
- 需要支持微信登录和用户名密码登录
- 未登录用户可浏览和使用Agent，但不能收藏和保存历史
- 活动数据使用示例数据
- 所有功能已完成并通过lint检查
