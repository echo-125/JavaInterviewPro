// 主题管理工具
const THEME_KEY = 'theme_mode'

// 获取当前主题
export function getTheme() {
  return uni.getStorageSync(THEME_KEY) || 'light'
}

// 设置主题
export function setTheme(theme) {
  uni.setStorageSync(THEME_KEY, theme)
  // 设置导航栏样式
  uni.setNavigationBarColor({
    frontColor: theme === 'dark' ? '#ffffff' : '#000000',
    backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff'
  })
  
  // 设置 tabBar 样式
  uni.setTabBarStyle({
    color: theme === 'dark' ? '#999999' : '#7A7E83',
    selectedColor: theme === 'dark' ? '#ffffff' : '#007AFF',
    backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
    borderStyle: theme === 'dark' ? 'black' : 'white'
  })
  
  // 触发全局主题变更事件
  uni.$emit('themeChanged', theme)
}

// 获取主题变量
export function getThemeVariables(theme) {
  return {
    backgroundColor: theme === 'dark' ? '#000000' : '#f5f5f5',
    cardBackgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
    textColor: theme === 'dark' ? '#ffffff' : '#333333',
    secondaryTextColor: theme === 'dark' ? '#999999' : '#666666',
    borderColor: theme === 'dark' ? '#2c2c2e' : '#e5e5e5',
    shadowColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
    primaryColor: '#007AFF',
    statValueColor: theme === 'dark' ? '#ffffff' : '#333333'
  }
} 