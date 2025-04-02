<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <text class="title">详情页面</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- WebView 内容 -->
    <web-view v-if="url" :src="url" @message="handleMessage"></web-view>

    <!-- 错误提示 -->
    <view v-if="error" class="error">
      <text>{{ error }}</text>
      <button class="retry-btn" @click="retryLoad">重试</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const url = ref('')
const isLoading = ref(true)
const error = ref('')

// 处理 webview 消息
const handleMessage = (event) => {
  console.log('收到 webview 消息:', event)
}

// 重试加载
const retryLoad = () => {
  error.value = ''
  isLoading.value = true
  loadUrl()
}

// 加载 URL
const loadUrl = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const { url: urlParam } = currentPage.$page.options
  
  if (urlParam) {
    // 添加缓存控制参数
    const decodedUrl = decodeURIComponent(urlParam)
    const separator = decodedUrl.includes('?') ? '&' : '?'
    url.value = `${decodedUrl}${separator}_t=${Date.now()}`
    
    // 设置超时
    setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false
        error.value = '加载超时，请重试'
      }
    }, 10000)
  } else {
    error.value = '无效的链接'
    isLoading.value = false
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

onMounted(() => {
  loadUrl()
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f5f6fa;
  position: relative;
}

.nav-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #eee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  height: 88rpx;
  padding-top: calc(20rpx + var(--status-bar-height));
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

web-view {
  position: fixed;
  top: calc(var(--status-bar-height) + 88rpx);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  z-index: 1000;
}

.error {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff4d4f;
  font-size: 28rpx;
  z-index: 1000;
}

.retry-btn {
  margin-top: 20rpx;
  background-color: #007AFF;
  color: #fff;
  border: none;
  padding: 10rpx 30rpx;
  border-radius: 4rpx;
  font-size: 28rpx;
}
</style> 