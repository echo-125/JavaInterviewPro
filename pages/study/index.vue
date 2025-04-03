<template>
  <view class="container" :style="themeStyle">
    <!-- 顶部搜索栏 -->
    <view class="search-bar" :style="cardStyle">
      <view class="search-input-wrap">
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="搜索题目" 
          :style="{ color: theme.textColor, backgroundColor: theme.backgroundColor }"
          @input="handleSearch"
        />
        <view v-if="searchText" class="clear-icon" @click="clearSearch">
          <text class="icon" :style="{ color: theme.secondaryTextColor }">×</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果列表 -->
    <scroll-view 
      v-if="isSearching"
      scroll-y 
      class="search-list"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view 
        v-for="question in searchResults" 
        :key="question.id" 
        class="search-item"
        :style="cardStyle"
        @click="navigateToQuestion(question)"
      >
        <text class="question-title" :style="{ color: theme.textColor }">{{ question.title }}</text>
      </view>

      <!-- 搜索结果为空 -->
      <view v-if="!isLoading && searchResults.length === 0" class="empty">
        <text :style="{ color: theme.secondaryTextColor }">未找到相关题目</text>
      </view>
    </scroll-view>

    <!-- 分类列表 -->
    <scroll-view 
      v-else
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
        :style="cardStyle"
        @click="navigateToQuestions(category)"
      >
        <view class="category-info">
          <text class="category-name" :style="{ color: theme.textColor }">{{ category.name }}</text>
          <text class="category-count" :style="{ color: theme.secondaryTextColor }">{{ category.questionCount }}题</text>
        </view>
        <view class="progress-bar">
          <view 
            class="progress-inner" 
            :style="{ width: category.progress + '%' }"
          ></view>
        </view>
        <view class="category-stats">
          <text class="completed-count" :style="{ color: theme.secondaryTextColor }">已学习: {{ category.completedCount }}</text>
          <text class="progress-text" :style="{ color: theme.primaryColor }">{{ category.progress }}%</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading">
        <text :style="{ color: theme.secondaryTextColor }">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!isLoading && categories.length === 0" class="empty">
        <text :style="{ color: theme.secondaryTextColor }">暂无分类数据</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { checkAndInitDB, initTables, importCategoryData, importQuestionMapData } from '@/common/dbInit'
import { getCategories, searchQuestions } from '@/api/api'
import useTheme from '@/mixins/themeMixin'

// 页面配置
defineOptions({
  navigationStyle: 'custom'
})

const categories = ref([])
const searchText = ref('')
const isLoading = ref(false)
const isRefreshing = ref(false)
const scrollTop = ref(0)
const searchResults = ref([])
const isSearching = ref(false)

const { theme, themeStyle, cardStyle } = useTheme()

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
const handleSearch = async () => {
  if (!searchText.value.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  try {
    isSearching.value = true
    isLoading.value = true
    const results = await searchQuestions(searchText.value)
    searchResults.value = results
  } catch (error) {
    console.error('搜索题目失败:', error)
    uni.showToast({
      title: '搜索失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
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

// 跳转到题目详情
const navigateToQuestion = (question) => {
  const url = `/pages/study/question?id=${question.id}&categoryId=${question.category_id}&categoryName=${encodeURIComponent(question.category_name)}&from=search`
  uni.navigateTo({
    url: url,
    fail: (err) => {
      console.error('页面跳转失败:', err)
    }
  })
}

// 清除搜索
const clearSearch = () => {
  searchText.value = ''
  searchResults.value = []
  isSearching.value = false
  // 收起键盘
  uni.hideKeyboard()
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
    // 监听数据重置事件
    uni.$on('dataReset', async () => {
      await loadCategories()
    })
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
  uni.$off('dataReset')
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
  padding: 40rpx 0;
  transition: background-color 0.3s ease;
}

.search-bar {
  padding: 20rpx;
  border-radius: 12rpx;
  margin: 20rpx;
  transition: all 0.3s ease;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar input {
  flex: 1;
  padding: 20rpx;
  padding-right: 60rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.clear-icon {
  position: absolute;
  right: 20rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon .icon {
  font-size: 40rpx;
  transition: color 0.3s ease;
}

.search-list {
  height: calc(100vh - 180rpx);
  padding: 16rpx;
  box-sizing: border-box;
}

.search-item {
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
  transition: all 0.3s ease;
}

.search-item:active {
  transform: scale(0.98);
}

.question-title {
  font-size: 32rpx;
  transition: color 0.3s ease;
}

.category-list {
  height: calc(100vh - 200rpx);
  padding: 0 20rpx;
  box-sizing: border-box;
}

.category-item {
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
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
  transition: color 0.3s ease;
}

.category-count {
  font-size: 24rpx;
  transition: color 0.3s ease;
}

.progress-bar {
  height: 8rpx;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4rpx;
  margin-bottom: 10rpx;
  transition: background-color 0.3s ease;
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
  transition: color 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  font-weight: bold;
  transition: color 0.3s ease;
}

.loading, .empty {
  text-align: center;
  padding: 40rpx;
  font-size: 28rpx;
  transition: color 0.3s ease;
}

.card {
  transition: all 0.3s ease;
}
</style> 