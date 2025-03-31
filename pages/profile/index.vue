<template>
  <view class="container">
    <view class="header">
      <view class="avatar-section">
        <image class="avatar" src="/static/images/avatar.png" mode="aspectFill"></image>
        <text class="nickname">iKun</text>
      </view>
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-value">{{ stats.total }}</text>
          <text class="stat-label">总题目</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.completed }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ stats.favorites }}</text>
          <text class="stat-label">收藏</text>
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-group">
        <view class="menu-item" @click="navigateToHistory">
          <text class="menu-icon">📅</text>
          <text class="menu-text">学习历史</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateToWrongQuestions">
          <text class="menu-icon">❌</text>
          <text class="menu-text">错题本</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="toggleDarkMode">
          <text class="menu-icon">🌙</text>
          <text class="menu-text">深色模式</text>
          <switch :checked="isDarkMode" @change="toggleDarkMode" />
        </view>
        <view class="menu-item" @click="clearCache">
          <text class="menu-icon">🗑️</text>
          <text class="menu-text">清除缓存</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="navigateToAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navigateToFeedback">
          <text class="menu-icon">📝</text>
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/common/database'
import { getUserStats } from '@/api/api.js'

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

const isDarkMode = ref(false)
const isLoading = ref(false)

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

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未学习'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 切换深色模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  // TODO: 实现深色模式切换逻辑
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

// 页面导航
const navigateToHistory = () => {
  uni.navigateTo({
    url: '/pages/profile/history'
  })
}

const navigateToWrongQuestions = () => {
  uni.navigateTo({
    url: '/pages/profile/wrong-questions'
  })
}

const navigateToAbout = () => {
  uni.navigateTo({
    url: '/pages/profile/about'
  })
}

const navigateToFeedback = () => {
  uni.navigateTo({
    url: '/pages/profile/feedback'
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.header {
  background-color: #fff;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
}

.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 20rpx;
}

.nickname {
  font-size: 32rpx;
  font-weight: bold;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  border-top: 1rpx solid #eee;
  padding-top: 30rpx;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #007AFF;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}

.menu-list {
  padding: 0 20rpx;
}

.menu-group {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
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
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #999;
}
</style> 