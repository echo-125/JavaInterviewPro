import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTheme, getThemeVariables } from '@/utils/theme'

export default function useTheme() {
  const currentTheme = ref(getTheme())
  const isDarkMode = computed(() => currentTheme.value === 'dark')
  const theme = computed(() => getThemeVariables(currentTheme.value))

  // 计算主题样式
  const themeStyle = computed(() => ({
    backgroundColor: theme.value.backgroundColor
  }))

  const cardStyle = computed(() => ({
    backgroundColor: theme.value.cardBackgroundColor,
    boxShadow: `0 2rpx 10rpx ${theme.value.shadowColor}`
  }))

  // 处理主题变更
  const handleThemeChange = (newTheme) => {
    currentTheme.value = newTheme
  }

  onMounted(() => {
    // 监听全局主题变更事件
    uni.$on('themeChanged', handleThemeChange)
  })

  onUnmounted(() => {
    // 移除事件监听
    uni.$off('themeChanged', handleThemeChange)
  })

  return {
    currentTheme,
    isDarkMode,
    theme,
    themeStyle,
    cardStyle
  }
} 