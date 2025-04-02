<template>
  <view class="container">
    <view class="header">
      <view class="header-row">
        <text class="title">收藏</text>
        <text class="subtitle">共{{favorites.length}}题</text>
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
            @click="navigateToQuestion(item)">
        <view class="question-info">
          <text class="question-title">{{item.title}}</text>
          <view class="meta-row">
            <text class="question-category">{{item.category_name}}</text>
            <text class="study-time" v-if="item.learn_time">上次学习: {{formatDateTime(item.learn_time)}}</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-if="favorites.length === 0">
        <text class="empty-text">暂无收藏题目</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/common/database'
import { formatDateTime } from '@/utils/dateUtil'

const favorites = ref([])
const isLoading = ref(false)
const isRefreshing = ref(false)

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

onMounted(() => {
  loadFavorites()
})
</script>

<style>
.container {
  padding: 20rpx;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
  color: #333;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
}

.favorite-list {
  flex: 1;
  margin-top: 20rpx;
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

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-category {
  font-size: 24rpx;
  color: #666;
}

.study-time {
  font-size: 24rpx;
  color: #999;
  border-left: 2rpx solid #eee;
  padding-left: 20rpx;
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