<template>
  <view class="container" :style="themeStyle">
    <view class="header" :style="headerStyle">
      <view class="avatar-section">
        <image class="avatar" src="/static/images/avatar.png" mode="aspectFill"></image>
        <text class="nickname" :style="{ color: theme.textColor }">iKun</text>
      </view>
      <view class="stats-section" :style="{ borderColor: theme.borderColor }">
        <view class="stat-item">
          <text class="stat-value" :style="{ color: theme.primaryColor }">{{ stats.total }}</text>
          <text class="stat-label" :style="{ color: theme.secondaryTextColor }">总题目</text>
        </view>
        <view class="stat-item">
          <text class="stat-value" :style="{ color: theme.primaryColor }">{{ stats.completed }}</text>
          <text class="stat-label" :style="{ color: theme.secondaryTextColor }">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value" :style="{ color: theme.primaryColor }">{{ stats.favorites }}</text>
          <text class="stat-label" :style="{ color: theme.secondaryTextColor }">收藏</text>
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-group" :style="menuGroupStyle">
        <view class="menu-item" :style="{ borderColor: theme.borderColor }">
          <text class="menu-icon">🌙</text>
          <text class="menu-text" :style="{ color: theme.textColor }">深色模式</text>
          <switch :checked="isDarkMode" @change="toggleDarkMode" color="#007AFF" />
        </view>
        <view class="menu-item" :style="{ borderColor: theme.borderColor }" @click="clearCache">
          <text class="menu-icon">🗑️</text>
          <text class="menu-text" :style="{ color: theme.textColor }">清除缓存</text>
          <text class="menu-arrow" :style="{ color: theme.secondaryTextColor }">></text>
        </view>
      </view>

      <view class="menu-group" :style="menuGroupStyle">
        <view class="menu-item" :style="{ borderColor: theme.borderColor }" @click="resetData">
          <text class="menu-icon">🔄</text>
          <text class="menu-text" :style="{ color: theme.textColor }">重置数据</text>
          <text class="menu-arrow" :style="{ color: theme.secondaryTextColor }">></text>
        </view>
        <view class="menu-item" :style="{ borderColor: theme.borderColor }" @click="importQuestions">
          <text class="menu-icon">📥</text>
          <text class="menu-text" :style="{ color: theme.textColor }">导入题库</text>
          <text class="menu-arrow" :style="{ color: theme.secondaryTextColor }">></text>
        </view>
      </view>

      <view class="menu-group" :style="menuGroupStyle">
        <view class="menu-item" :style="{ borderColor: theme.borderColor }" @click="navigateToAbout">
          <text class="menu-icon">👤</text>
          <text class="menu-text" :style="{ color: theme.textColor }">关于我</text>
          <text class="menu-arrow" :style="{ color: theme.secondaryTextColor }">></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import db from '@/common/database'
import { getUserStats } from '@/api/api.js'
import { getTheme, setTheme, getThemeVariables } from '@/utils/theme'
import useTheme from '@/mixins/themeMixin'

const userInfo = ref({
  username: '',
  avatar: '/static/images/default-avatar.png',
  total: 0,
  completed: 0,
  favorites: 0
})

const stats = ref({
  total: 0,
  completed: 0,
  favorites: 0
})

const isLoading = ref(false)
const { isDarkMode, theme, themeStyle, cardStyle } = useTheme()

// 计算主题样式
const headerStyle = computed(() => cardStyle.value)
const menuGroupStyle = computed(() => cardStyle.value)

// 加载用户信息
async function loadUserInfo() {
  try {
    isLoading.value = true
    const result = await getUserStats()
    stats.value = result
    userInfo.value = {
      ...userInfo.value,
      total: result.total,
      completed: result.completed,
      favorites: result.favorites
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    uni.showToast({
      title: '加载用户信息失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

// 切换深色模式
const toggleDarkMode = async (e) => {
  const newTheme = e.detail.value ? 'dark' : 'light'
  await setTheme(newTheme)
}

// 清除缓存
const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        // TODO: 实现清除缓存逻辑
        uni.showToast({
          title: '清除成功',
          icon: 'success'
        })
      }
    }
  })
}

// 重置数据
const resetData = () => {
  uni.showModal({
    title: '警告',
    content: '确定要重置所有数据吗？此操作不可恢复！',
    success: (res) => {
      if (res.confirm) {
        // TODO: 实现重置数据逻辑
        uni.showToast({
          title: '重置成功',
          icon: 'success'
        })
      }
    }
  })
}

// 导入题库
const importQuestions = () => {
  uni.showModal({
    title: '提示',
    content: '确定要导入题库吗？这将覆盖现有数据。',
    success: (res) => {
      if (res.confirm) {
        // TODO: 实现导入题库逻辑
        uni.showToast({
          title: '导入成功',
          icon: 'success'
        })
      }
    }
  })
}

// 页面导航
const navigateToAbout = () => {
  uni.navigateTo({
    url: '/pages/profile/about'
  })
}

onMounted(() => {
  loadUserInfo()
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('themeChanged', handleThemeChange)
})
</script>

<style>
.container {
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

.header {
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.nickname {
  font-size: 44rpx;
  font-weight: bold;
  transition: color 0.3s ease;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  border-top: 1rpx solid;
  padding-top: 30rpx;
  transition: border-color 0.3s ease;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  transition: color 0.3s ease;
}

.stat-label {
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
  transition: color 0.3s ease;
}

.menu-list {
  padding: 0 20rpx;
}

.menu-group {
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  transition: all 0.3s ease;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid;
  transition: all 0.3s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 32rpx;
  transition: color 0.3s ease;
}

.menu-arrow {
  font-size: 32rpx;
  transition: color 0.3s ease;
}
</style> 