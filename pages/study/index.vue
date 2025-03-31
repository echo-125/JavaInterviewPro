<template>
  <view class="container">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <input 
        type="text" 
        v-model="searchText" 
        placeholder="搜索题目" 
        @input="handleSearch"
      />
    </view>

    <!-- 分类列表 -->
    <scroll-view 
      scroll-y 
      class="category-list"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view 
        v-for="category in filteredCategories" 
        :key="category.id" 
        class="category-item"
        @click="navigateToQuestions(category)"
      >
        <view class="category-info">
          <text class="category-name">{{ category.name }}</text>
          <text class="category-count">{{ category.questionCount }}题</text>
        </view>
        <view class="progress-bar">
          <view 
            class="progress-inner" 
            :style="{ width: category.progress + '%' }"
          ></view>
        </view>
        <view class="category-stats">
          <text class="completed-count">已完成 {{ category.completedCount }}</text>
          <text class="progress-text">{{ category.progress }}%</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!isLoading && categories.length === 0" class="empty">
        <text>暂无分类数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import db from '@/common/database'
import { checkAndInitDB } from '@/utils/dbInit'

const categories = ref([])
const searchText = ref('')
const isLoading = ref(false)
const isRefreshing = ref(false)

// 过滤后的分类列表
const filteredCategories = computed(() => {
  if (!searchText.value) return categories.value
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 加载分类列表
const loadCategories = async () => {
  try {
    isLoading.value = true
    console.log('开始加载分类列表...')
    
    // 确保数据库已初始化
    await checkAndInitDB()
    
    // 获取所有分类
    console.log('查询分类数据...')
    let result = []
    try {
      result = await db.selectTableDataBySql(`
        SELECT c.*, 
          COUNT(q.id) as questionCount,
          COUNT(CASE WHEN up.last_visit_time IS NOT NULL THEN 1 END) as completedCount
        FROM category c
        LEFT JOIN question_map q ON c.id = q.category_id
        LEFT JOIN user_progress up ON q.id = up.question_id
        GROUP BY c.id
        ORDER BY c.create_time ASC
      `)
      //console.log('原始查询结果:', JSON.stringify(result))
    } catch (error) {
      console.error('查询分类数据失败:', JSON.stringify(error))
      return
    }
    
    // 处理数据
    categories.value = result.map(item => ({
      id: item.id,
      name: item.name,
      questionCount: item.questionCount || 0,
      completedCount: item.completedCount || 0,
      progress: item.questionCount ? Math.round((item.completedCount / item.questionCount) * 100) : 0
    }))
    
    //console.log('处理后的分类列表:', JSON.stringify(categories.value))
  } catch (error) {
    console.error('加载分类失败:', error)
    uni.showToast({
      title: '加载分类失败',
      icon: 'none'
    })
	await loadCategories();
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 实时过滤，不需要额外处理
}

// 跳转到题目列表
const navigateToQuestions = (category) => {
  console.log('准备跳转到题目页面:', category)
  const url = `/pages/study/questions?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`
  console.log('跳转URL:', url)
  
  uni.redirectTo({
    url: url,
    success: () => {
      console.log('页面跳转成功')
    },
    fail: (err) => {
      console.error('页面跳转失败:', err)
      // 如果redirectTo失败，尝试使用navigateTo
      uni.navigateTo({
        url: url,
        success: () => {
          console.log('使用navigateTo跳转成功')
        },
        fail: (err) => {
          console.error('使用navigateTo跳转也失败:', err)
        }
      })
    }
  })
}

// 下拉刷新处理
const onRefresh = async () => {
  console.log('触发下拉刷新')
  isRefreshing.value = true
  await loadCategories()
}

onMounted(async () => {
  console.log('页面加载完成，开始加载数据...')
  await loadCategories()
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.search-bar {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.search-bar input {
  background-color: #f5f5f5;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.category-list {
  height: calc(100vh - 180rpx);
}

.category-item {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.category-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.category-count {
  font-size: 24rpx;
  color: #666;
}

.progress-bar {
  height: 8rpx;
  background-color: #f5f5f5;
  border-radius: 4rpx;
  margin-bottom: 10rpx;
}

.progress-inner {
  height: 100%;
  background-color: #007AFF;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completed-count {
  font-size: 24rpx;
  color: #666;
}

.progress-text {
  font-size: 24rpx;
  color: #007AFF;
  font-weight: bold;
}

.loading, .empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}
</style> 