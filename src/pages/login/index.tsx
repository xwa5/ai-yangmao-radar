import {useState} from 'react'
import Taro, {getEnv} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {STORAGE_KEY_REDIRECT_PATH} from '@/components/RouteGuard'

export default function Login() {
  const {signInWithUsername, signUpWithUsername, signInWithWechat} = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleUsernameChange = (e: any) => {
    const ev = e as any
    setUsername(ev.detail?.value ?? ev.target?.value ?? '')
  }

  const handlePasswordChange = (e: any) => {
    const ev = e as any
    setPassword(ev.detail?.value ?? ev.target?.value ?? '')
  }

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Taro.showToast({title: '请输入用户名和密码', icon: 'none'})
      return
    }

    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    // 验证用户名格式
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      Taro.showToast({title: '用户名只能包含字母、数字和下划线', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const {error} = isLogin
        ? await signInWithUsername(username, password)
        : await signUpWithUsername(username, password)

      if (error) {
        Taro.showToast({
          title: error.message || (isLogin ? '登录失败' : '注册失败'),
          icon: 'none'
        })
      } else {
        Taro.showToast({
          title: isLogin ? '登录成功' : '注册成功',
          icon: 'success'
        })
        setTimeout(() => {
          handleRedirect()
        }, 1500)
      }
    } catch (error) {
      console.error('登录/注册失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const {error} = await signInWithWechat()
      if (error) {
        Taro.showToast({title: error.message || '微信登录失败', icon: 'none'})
      } else {
        Taro.showToast({title: '登录成功', icon: 'success'})
        setTimeout(() => {
          handleRedirect()
        }, 1500)
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      Taro.showToast({title: '微信登录失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  const handleRedirect = () => {
    const redirectPath = Taro.getStorageSync(STORAGE_KEY_REDIRECT_PATH)
    Taro.removeStorageSync(STORAGE_KEY_REDIRECT_PATH)

    if (redirectPath) {
      // 检查是否是tabBar页面
      const tabBarPages = ['/pages/home/index', '/pages/agent/index', '/pages/profile/index']
      const isTabBar = tabBarPages.some((path) => redirectPath.includes(path))

      if (isTabBar) {
        Taro.switchTab({url: redirectPath})
      } else {
        Taro.navigateTo({url: redirectPath})
      }
    } else {
      Taro.switchTab({url: '/pages/home/index'})
    }
  }

  const isWeApp = getEnv() === 'WEAPP'

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-elegant">
          <div className="flex flex-col gap-6">
            {/* Logo和标题 */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-elegant">
                <div className="i-mdi-radar text-6xl text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">AI 羊毛雷达</h1>
              <p className="text-lg text-muted-foreground text-center">
                {isLogin ? '欢迎回来' : '创建新账号'}
              </p>
            </div>

            {/* 表单 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold text-foreground">用户名</span>
                <div className="border-2 border-input rounded-lg px-4 py-3 bg-background overflow-hidden">
                  <input
                    className="w-full text-xl text-foreground bg-transparent outline-none"
                    placeholder="请输入用户名"
                    value={username}
                    onInput={handleUsernameChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-lg font-semibold text-foreground">密码</span>
                <div className="border-2 border-input rounded-lg px-4 py-3 bg-background overflow-hidden">
                  <input
                    type="password"
                    className="w-full text-xl text-foreground bg-transparent outline-none"
                    placeholder="请输入密码"
                    value={password}
                    onInput={handlePasswordChange}
                  />
                </div>
              </div>

              {/* 用户协议 */}
              <div className="flex items-center gap-2" onClick={() => setAgreed(!agreed)}>
                <div
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center ${agreed ? 'bg-primary border-primary' : 'border-input'}`}>
                  {agreed && <div className="i-mdi-check text-xl text-primary-foreground" />}
                </div>
                <span className="text-base text-muted-foreground">
                  我已阅读并同意《用户协议》和《隐私政策》
                </span>
              </div>

              {/* 登录/注册按钮 */}
              <button
                type="button"
                className={`px-6 py-4 rounded-xl text-2xl font-bold flex items-center justify-center gap-2 leading-none ${
                  loading
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-gradient-primary text-primary-foreground shadow-elegant'
                }`}
                onClick={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <>
                    <div className="i-mdi-loading text-3xl animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <span>{isLogin ? '登录' : '注册'}</span>
                )}
              </button>

              {/* 微信登录按钮 */}
              {isWeApp && (
                <button
                  type="button"
                  className="px-6 py-4 rounded-xl text-2xl font-bold bg-card border-2 border-primary text-primary flex items-center justify-center gap-2 leading-none"
                  onClick={handleWechatLogin}
                  disabled={loading}>
                  <div className="i-mdi-wechat text-3xl" />
                  <span>微信登录</span>
                </button>
              )}

              {/* 切换登录/注册 */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-lg text-primary"
                  onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
