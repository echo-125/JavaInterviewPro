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
          <text class="completed-count">已学习: {{ category.completedCount }}</text>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { checkAndInitDB, initTables, importCategoryData, importQuestionMapData } from '@/common/dbInit'
import { getCategories } from '@/api/api'

// 页面配置
defineOptions({
  navigationStyle: 'custom'
})

const categories = ref([])
const searchText = ref('')
const isLoading = ref(false)
const isRefreshing = ref(false)
const scrollTop = ref(0)

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
    
    // 获取所有分类
    let result = []
    try {
      result = await getCategories()
      
      // 检查是否有数据
      if (result.length === 0) {
        await checkAndInitDB()
        // 重新查询数据
        result = await getCategories()
      }
    } catch (error) {
      console.error('查询分类数据失败:', error)
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
    
  } catch (error) {
    console.error('加载分类失败:', error)
    uni.showToast({
      title: '加载分类失败',
      icon: 'none'
    })
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
  const url = `/pages/study/questions?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`
  
  uni.navigateTo({
    url: url,
    fail: (err) => {
      console.error('页面跳转失败:', err)
    }
  })
}

// 下拉刷新处理
const onRefresh = async () => {
  isRefreshing.value = true
  await loadCategories()
}

// 监听页面滚动
const onPageScroll = (e) => {
  scrollTop.value = e.scrollTop
}

// 页面隐藏时保存滚动位置
const onHide = () => {
  const route = '/pages/study/index'
  uni.$store = uni.$store || {}
  uni.$store.scrollPositions = uni.$store.scrollPositions || {}
  uni.$store.scrollPositions[route] = scrollTop.value
}

// 页面显示时恢复滚动位置
const onShow = () => {
  const route = '/pages/study/index'
  const saved = uni.$store?.scrollPositions?.[route]
  if (saved !== undefined) {
    // 使用nextTick确保DOM更新后再设置滚动位置
    uni.$nextTick(() => {
      const query = uni.createSelectorQuery()
      query.select('.category-list').boundingClientRect()
      query.exec((res) => {
        if (res[0]) {
          res[0].node.scrollTop = saved
        }
      })
    })
  }
}

onMounted(async () => {
  try {
    // 显示加载状态
    isLoading.value = true
    
    // 加载分类列表
    await loadCategories()
    
    // 监听分类进度变更事件
    uni.$on('categoryProgressChanged', handleCategoryProgressChanged)
  } catch (error) {
    console.error('页面加载失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
})

// 移除事件监听
onUnmounted(() => {
  uni.$off('categoryProgressChanged', handleCategoryProgressChanged)
})

// 处理分类进度变更
const handleCategoryProgressChanged = async (data) => {
  try {
    // 刷新分类列表
    await loadCategories()
  } catch (error) {
    console.error('刷新分类进度失败:', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none'
    })
  }
}

// 暴露页面生命周期函数
defineExpose({
  onHide,
  onShow,
  onPageScroll
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