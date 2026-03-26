-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 创建活动类型枚举
CREATE TYPE activity_type AS ENUM ('free_quota', 'trial', 'points_reward', 'api_gift', 'discount', 'limited_time');

-- 创建用户资料表
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  openid text,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  avatar_url text,
  nickname text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建活动表
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL,
  platform_logo text,
  title text NOT NULL,
  activity_type activity_type NOT NULL,
  target_audience text NOT NULL,
  end_time timestamptz,
  short_description text NOT NULL,
  detailed_description text NOT NULL,
  participation_steps text NOT NULL,
  original_link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建对话历史表
CREATE TABLE chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  agent_response text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 创建收藏表
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- 创建索引
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_platform ON activities(platform_name);
CREATE INDEX idx_activities_active ON activities(is_active);
CREATE INDEX idx_chat_history_user ON chat_history(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_activity ON favorites(activity_id);

-- 创建辅助函数检查是否为管理员
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 创建用户同步触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 从email提取用户名（用户名密码登录）或使用openid（微信登录）
  IF NEW.email LIKE '%@miaoda.com' THEN
    extracted_username := SPLIT_PART(NEW.email, '@', 1);
  ELSE
    extracted_username := NULL;
  END IF;
  
  -- 插入用户资料
  INSERT INTO public.profiles (id, username, openid, role, nickname, avatar_url)
  VALUES (
    NEW.id,
    extracted_username,
    COALESCE((NEW.raw_user_meta_data->>'openid')::text, NULL),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END,
    COALESCE((NEW.raw_user_meta_data->>'nickname')::text, extracted_username),
    COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, NULL)
  );
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- RLS策略 - profiles表
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以查看所有用户资料" ON profiles
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的资料" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- RLS策略 - activities表
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可以查看活动" ON activities
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理活动" ON activities
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - chat_history表
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的对话历史" ON chat_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建对话历史" ON chat_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "管理员可以查看所有对话历史" ON chat_history
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- RLS策略 - favorites表
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的收藏" ON favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加收藏" ON favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏" ON favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 插入示例活动数据
INSERT INTO activities (platform_name, platform_logo, title, activity_type, target_audience, end_time, short_description, detailed_description, participation_steps, original_link) VALUES
('OpenAI', 'openai-logo.png', 'GPT-4 新用户免费试用', 'trial', '新用户', '2026-06-30 23:59:59+08', '新注册用户可免费试用GPT-4模型，体验最先进的AI对话能力', 'OpenAI为新用户提供GPT-4模型的免费试用机会，包含100次对话额度，有效期30天。体验最先进的自然语言处理能力，适合开发者和AI爱好者。', '1. 访问OpenAI官网注册账号\n2. 完成邮箱验证\n3. 进入控制台即可获得试用额度\n4. 开始使用GPT-4进行对话', 'https://platform.openai.com'),

('Claude', 'claude-logo.png', 'Claude Pro 首月5折优惠', 'discount', '所有用户', '2026-04-30 23:59:59+08', 'Claude Pro订阅首月享受5折优惠，体验更强大的AI助手', 'Anthropic推出Claude Pro订阅优惠活动，首月仅需10美元（原价20美元）。享受更长的对话上下文、优先访问权限和更快的响应速度。', '1. 访问Claude官网\n2. 点击升级到Pro版本\n3. 使用优惠码FIRST50\n4. 完成支付即可享受优惠', 'https://claude.ai'),

('Google Gemini', 'gemini-logo.png', 'Gemini API 免费额度赠送', 'api_gift', '开发者', NULL, '开发者可获得Gemini API免费调用额度，每月100万tokens', 'Google为开发者提供Gemini API的免费使用额度，每月可免费调用100万tokens。支持文本生成、图像理解等多种功能，适合构建AI应用。', '1. 访问Google AI Studio\n2. 使用Google账号登录\n3. 创建API密钥\n4. 查看免费额度并开始使用', 'https://ai.google.dev'),

('Midjourney', 'midjourney-logo.png', 'Midjourney 新用户25次免费生成', 'free_quota', '新用户', '2026-05-31 23:59:59+08', '新用户注册即可获得25次免费图像生成机会', 'Midjourney为新用户提供25次免费的AI图像生成机会，体验世界领先的AI绘画能力。无需信用卡，注册即可使用。', '1. 加入Midjourney Discord服务器\n2. 完成账号注册\n3. 在newbies频道使用/imagine命令\n4. 开始创作AI艺术作品', 'https://midjourney.com'),

('Coze', 'coze-logo.png', 'Coze平台积分奖励活动', 'points_reward', '所有用户', '2026-04-15 23:59:59+08', '完成任务可获得平台积分，兑换API调用额度', '字节跳动Coze平台推出积分奖励活动，用户完成每日签到、创建Bot、分享作品等任务可获得积分，积分可兑换API调用额度或其他权益。', '1. 登录Coze平台\n2. 进入积分中心\n3. 完成每日任务\n4. 积分自动到账，可在商城兑换', 'https://coze.com'),

('DeepSeek', 'deepseek-logo.png', 'DeepSeek API 限时免费', 'limited_time', '开发者', '2026-03-31 23:59:59+08', 'DeepSeek API限时免费开放，支持代码生成和对话功能', 'DeepSeek推出限时免费活动，开发者可免费使用DeepSeek-Coder和DeepSeek-Chat模型，每日10万tokens额度，活动期间不限使用天数。', '1. 访问DeepSeek开放平台\n2. 注册并完成实名认证\n3. 创建API密钥\n4. 查看文档开始集成', 'https://platform.deepseek.com'),

('Kimi', 'kimi-logo.png', 'Kimi会员限时优惠', 'discount', '所有用户', '2026-04-10 23:59:59+08', 'Kimi会员年费8折优惠，享受无限对话和文件解析', '月之暗面推出Kimi会员优惠活动，年费会员享受8折优惠，仅需192元/年。会员可享受无限对话次数、200页文件解析、优先响应等特权。', '1. 打开Kimi应用或网页版\n2. 点击会员中心\n3. 选择年费会员\n4. 使用优惠码KIMI2026完成支付', 'https://kimi.moonshot.cn'),

('文心一言', 'wenxin-logo.png', '文心一言企业版免费试用', 'trial', '企业用户', '2026-05-15 23:59:59+08', '企业用户可申请文心一言企业版免费试用30天', '百度文心一言为企业用户提供30天免费试用，包含API调用、知识库构建、私有化部署等企业级功能。适合希望将AI能力集成到业务系统的企业。', '1. 访问文心一言企业版官网\n2. 填写企业信息申请试用\n3. 等待审核通过（1-3个工作日）\n4. 获得试用账号和API密钥', 'https://yiyan.baidu.com'),

('通义千问', 'tongyi-logo.png', '通义千问API积分赠送', 'points_reward', '开发者', NULL, '新注册开发者赠送100万tokens积分', '阿里云通义千问为新注册的开发者账号赠送100万tokens的API调用积分，可用于通义千问、通义万相等多个模型，永久有效。', '1. 注册阿里云账号\n2. 开通通义千问服务\n3. 完成实名认证\n4. 积分自动发放到账户', 'https://tongyi.aliyun.com'),

('Stable Diffusion', 'sd-logo.png', 'Stability AI 会员红包', 'discount', '新用户', '2026-04-20 23:59:59+08', '新用户注册送20美元红包，可用于订阅会员', 'Stability AI为新用户提供20美元注册红包，可直接用于订阅DreamStudio会员或购买API积分，体验Stable Diffusion 3.0等最新模型。', '1. 访问Stability AI官网\n2. 注册新账号\n3. 完成邮箱验证\n4. 红包自动到账，进入账户查看', 'https://stability.ai');