const pages = [
  'pages/home/index',
  'pages/agent/index',
  'pages/profile/index',
  'pages/login/index',
  'pages/activity-detail/index'
]

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    color: '#8B92A8',
    selectedColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/icons/home_unselected.png',
        selectedIconPath: './assets/icons/home_selected.png'
      },
      {
        pagePath: 'pages/agent/index',
        text: 'AI助手',
        iconPath: './assets/icons/agent_unselected.png',
        selectedIconPath: './assets/icons/agent_selected.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/icons/profile_unselected.png',
        selectedIconPath: './assets/icons/profile_selected.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AI 羊毛雷达',
    navigationBarTextStyle: 'black'
  }
})
