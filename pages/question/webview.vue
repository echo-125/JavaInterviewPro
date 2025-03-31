<template>
  <view class="container">
    <web-view :src="url" @message="handleMessage"></web-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const url = ref('')

// 处理webview消息
const handleMessage = (event) => {
  console.log('收到webview消息:', event.detail)
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const uri = currentPage.options.uri

  if (uri) {
    url.value = decodeURIComponent(uri)
  } else {
    uni.showToast({
      title: '无效的解析链接',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

const viewDetail = () => {
  uni.navigateTo({
    url: '/pages/question/webview?uri=' + encodeURIComponent(currentQuestion.value.uri)
  })
}
</script>

<style>
.container {
  width: 100%;
  height: 100vh;
}
</style> 