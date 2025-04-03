<template>
  <view class="container" :style="themeStyle">
    <view class="header">
      <view class="header-row">
        <text class="title" :style="{ color: theme.textColor }">收藏</text>
        <text class="subtitle" :style="{ color: theme.secondaryTextColor }">共{{favorites.length}}题</text>
      </view>
    </view>
    <scroll-view 
      scroll-y 
      class="favorite-list"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-for="(item, index) in favorites" :key="index" 
            class="favorite-item" 
            :style="cardStyle"
            @click="navigateToQuestion(item)">
        <view class="question-info">
          <text class="question-title" :style="{ color: theme.textColor }">{{item.title}}</text>
          <view class="meta-row">
            <text class="question-category" :style="{ color: theme.secondaryTextColor }">{{item.category_name}}</text>
            <text class="study-time" v-if="item.learn_time" :style="{ color: theme.secondaryTextColor }">上次学习: {{formatDateTime(item.learn_time)}}</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-if="favorites.length === 0">
        <text class="empty-text" :style="{ color: theme.secondaryTextColor }">暂无收藏题目</text>
      </view>
    </scroll-view>
    <view class="card" :style="cardStyle">
      <!-- 卡片内容 -->
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import db from '@/common/database'
import { formatDateTime } from '@/utils/dateUtil'
import useTheme from '@/mixins/themeMixin'

const favorites = ref([])
const isLoading = ref(false)
const isRefreshing = ref(false)

const { theme, themeStyle, cardStyle } = useTheme()

// 加载收藏列表
const loadFavorites = async () => {
  try {
    isLoading.value = true
    
    // 检查数据库是否打开
    let isOpen = false
    try {
      isOpen = db.isOpen()
      console.log('数据库是否打开:', isOpen)
    } catch (error) {
      console.error('检查数据库状态失败:', error)
    }
    
    if (!isOpen) {
      console.log('数据库未打开，尝试打开数据库...')
      try {
        await db.open()
        console.log('数据库打开成功')
      } catch (error) {
        console.error('打开数据库失败:', error)
        setTimeout(async () => {
          await loadFavorites()
        }, 100)
        return
      }
    }
    
    // 查询收藏列表
    const sql = `
      SELECT 
        q.id,
        q.title,
        q.learn_time,
        q.category_id,
        c.name as category_name
      FROM question_map q
      LEFT JOIN category c ON q.category_id = c.id
      WHERE q.is_favorite = 1
      ORDER BY q.favorite_time DESC
    `
    
    const result = await db.selectTableDataBySql(sql)
    favorites.value = result
    console.log('收藏列表:', favorites.value)
  } catch (error) {
    console.error('加载收藏失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 下拉刷新处理
const onRefresh = async () => {
  isRefreshing.value = true
  await loadFavorites()
}

// 跳转到题目详情
const navigateToQuestion = (question) => {
  const url = `/pages/study/question?id=${question.id}&categoryId=${question.category_id}&categoryName=${encodeURIComponent(question.category_name)}&from=favorite`
  uni.navigateTo({
    url,
    fail: (err) => {
      console.error('页面跳转失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

// 监听题目状态变化事件
const handleQuestionStatusChanged = () => {
  loadFavorites()
}

onMounted(() => {
  loadFavorites()
  // 添加事件监听
  uni.$on('questionStatusChanged', handleQuestionStatusChanged)
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('questionStatusChanged', handleQuestionStatusChanged)
})

// 定义页面生命周期函数
defineExpose({
  onShow() {
    loadFavorites()
  }
})
</script>

<style>
.container {
  padding: 20rpx;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

.header {
  padding: 40rpx 0 20rpx;
  text-align: center;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.title {
  font-size: 28rpx;
  font-weight: bold;
  transition: color 0.3s ease;
}

.subtitle {
  font-size: 24rpx;
  transition: color 0.3s ease;
}

.favorite-list {
  flex: 1;
  margin-top: 20rpx;
}

.favorite-item {
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.question-info {
  margin-bottom: 15rpx;
}

.question-title {
  font-size: 32rpx;
  font-weight: 500;
  transition: color 0.3s ease;
  margin-bottom: 8rpx;
  display: block;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-category {
  font-size: 24rpx;
  transition: color 0.3s ease;
}

.study-time {
  font-size: 24rpx;
  border-left: 2rpx solid;
  padding-left: 20rpx;
  transition: all 0.3s ease;
}

.empty-state {
  padding: 100rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  transition: color 0.3s ease;
}

.card {
  transition: all 0.3s ease;
}
</style> 