<template>
  <view class="container">
    <view class="header">
      <text class="title">我的收藏</text>
      <text class="subtitle">共{{favorites.length}}题</text>
    </view>
    
    <view class="favorite-list">
      <view v-for="(item, index) in favorites" :key="index" 
            class="favorite-item" 
            @click="navigateToQuestion(item)">
        <view class="question-info">
          <text class="question-title">{{item.title}}</text>
          <text class="question-category">{{item.category_name}}</text>
        </view>
        <view class="question-meta">
          <text class="study-time">上次学习: {{formatDate(item.last_study_time)}}</text>
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-if="favorites.length === 0">
      <text class="empty-text">暂无收藏题目</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/common/database'

const favorites = ref([])
const isLoading = ref(false)

// 加载收藏列表
const loadFavorites = async () => {
  try {
    isLoading.value = true
    
    // 检查数据库是否打开
    let isOpen = false
    try {
      isOpen = await db.isOpen()
      console.log('数据库是否打开:', isOpen)
    } catch (error) {
      console.error('检查数据库状态失败:', error)
    }
    
    if (!isOpen) {
      console.log('数据库未打开，尝试打开数据库...')
      try {
        await db.openDatabase()
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
      SELECT q.*, c.name as category_name
      FROM question_map q
      LEFT JOIN category c ON q.category_id = c.id
      INNER JOIN favorites f ON q.id = f.question_id
      ORDER BY f.create_time DESC
    `
    
    const result = await db.selectTableDataBySql(sql)
    favorites.value = result
    console.log('收藏列表:', favorites.value)
  } catch (error) {
    console.error('加载收藏失败:', error)
    // 发生错误时，等待100ms后重试
    setTimeout(async () => {
      await loadFavorites()
    }, 100)
  } finally {
    isLoading.value = false
  }
}

// 跳转到题目详情
const navigateToQuestion = (question) => {
  uni.navigateTo({
    url: '/pages/question/detail?id=' + question.id
  })
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

onMounted(() => {
  loadFavorites()
})
</script>

<style>
.container {
  padding: 20rpx;
}

.header {
  padding: 30rpx 0;
  text-align: center;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}

.favorite-list {
  margin-top: 30rpx;
}

.favorite-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.question-info {
  margin-bottom: 15rpx;
}

.question-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.question-category {
  font-size: 24rpx;
  color: #666;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.study-time {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  padding: 100rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style> 