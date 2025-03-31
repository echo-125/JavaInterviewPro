<template>
  <view class="container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="navigateBack">
        <text class="nav-icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title">{{ categoryName }}</text>
        <text class="subtitle">{{ currentIndex + 1 }}/{{ totalQuestions }}</text>
      </view>
      <view class="nav-right">
        <text class="nav-icon" @click="toggleFavorite">{{ isFavorite ? '★' : '☆' }}</text>
      </view>
    </view>

    <!-- 题目内容 -->
    <scroll-view scroll-y class="content">
      <view class="question-content">
        <text class="question-title">{{ currentQuestion.title }}</text>
        <view class="question-meta">
          <view class="study-badge" :class="{ studied: currentQuestion.last_study_time }">
            <text class="study-status">{{ currentQuestion.last_study_time ? '已学习' : '未学习' }}</text>
            <text v-if="currentQuestion.last_study_time" class="study-time">{{ formatDateTime(currentQuestion.last_study_time) }}</text>
          </view>
        </view>
      </view>

      <!-- 答案部分 -->
      <view class="answer-section">
        <view class="answer-header">
          <text class="answer-title">答案解析</text>
        </view>
        <view class="answer-content">
          <rich-text class="answer-text" :nodes="currentQuestion.answer || '暂无答案'"></rich-text>
        </view>
      </view>

      <!-- 操作按钮区域 -->
      <view class="action-section">
        <button class="action-btn study-btn" 
                :class="{ 'study-btn-active': isMarking }"
                @click="toggleStudyStatus">
          <text class="btn-text">{{ isMarking ? '我忘记了' : '我记住了' }}</text>
        </button>
        <button v-if="currentQuestion.uri" class="action-btn view-detail" @click="openDetail">
          查看详情
        </button>
      </view>
    </scroll-view>

    <!-- 底部导航栏 -->
    <view class="bottom-bar">
      <view class="nav-btn prev" @click="prevQuestion" :class="{ disabled: currentIndex === 0 }">
        <text class="btn-icon">←</text>
        <text class="btn-text">上一题</text>
      </view>
      <view class="nav-btn next" @click="nextQuestion" :class="{ disabled: currentIndex === totalQuestions - 1 }">
        <text class="btn-text">下一题</text>
        <text class="btn-icon">→</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import db from '@/common/database'
import { checkAndInitDB } from '@/utils/dbInit'
import { formatDateTime } from '@/utils/dateUtil'
import { 
    getQuestionById, 
    updateLearnStatus, 
    cancelLearnStatus, 
    toggleFavorite,
    getQuestionsWithStatus
} from '@/api/api'

const categoryId = ref('')
const categoryName = ref('')
const questionId = ref('')
const questions = ref([])
const currentIndex = ref(0)
const isLoading = ref(false)
const isMarking = ref(false)
const isCancelling = ref(false)

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || {}
})

// 总题目数
const totalQuestions = computed(() => {
  return questions.value.length
})

// 是否已收藏
const isFavorite = computed(() => {
  return currentQuestion.value.is_favorite || false
})

// 加载题目列表
const loadQuestions = async () => {
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
          await loadQuestions()
        }, 100)
        return
      }
    }
    
    // 获取该分类下的所有题目
    const result = await getQuestionsWithStatus(categoryId.value)
    console.log('获取到的题目列表:', result)
    
    if (result && result.length > 0) {
      questions.value = result
      console.log('处理后的题目列表:', questions.value)
      console.log('当前题目:', questions.value[currentIndex.value])
    } else {
      questions.value = []
      console.log('未找到题目数据')
    }
  } catch (error) {
    console.error('加载题目失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 更新学习状态
const updateStudyTime = async (questionId) => {
  try {
    // 确保 questionId 是有效的数字
    const numericQuestionId = parseInt(questionId)
    if (isNaN(numericQuestionId)) {
      console.log('无效的 questionId:', questionId)
      return null
    }
    
    console.log('更新学习时间，questionId:', numericQuestionId)
    
    // 更新学习状态
    const success = await updateLearnStatus(numericQuestionId)
    if (!success) {
      return null
    }
    
    // 获取更新后的题目信息
    const result = await getQuestionById(numericQuestionId)
    return result ? { learn_time: result.last_study_time } : null
  } catch (error) {
    console.error('更新学习时间失败:', JSON.stringify(error))
    return null
  }
}

// 切换收藏状态
const toggleFavoriteStatus = async () => {
  try {
    const questionId = currentQuestion.value.id
    if (!questionId) {
      console.error('无效的题目ID')
      return
    }
    
    console.log('切换收藏状态，当前收藏状态:', isFavorite.value)
    
    const success = await toggleFavorite(questionId)
    if (!success) {
      throw new Error('切换收藏状态失败')
    }
    
    // 重新加载题目列表以更新收藏状态
    await loadQuestions()
    
    uni.showToast({
      title: isFavorite.value ? '已取消收藏' : '已收藏',
      icon: 'success'
    })
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 打开详情链接
const openDetail = () => {
  if (currentQuestion.value.uri) {
    uni.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(currentQuestion.value.uri)}`
    })
  }
}

// 切换学习状态
const toggleStudyStatus = async () => {
  try {
    const questionId = currentQuestion.value.id
    if (!questionId) return
    
    isMarking.value = !isMarking.value
    
    if (isMarking.value) {
      // 标记为已学习
      const result = await updateStudyTime(questionId)
      if (result) {
        questions.value[currentIndex.value].last_study_time = result.learn_time
      }
    } else {
      // 取消已学习状态
      const success = await cancelLearnStatus(questionId)
      if (!success) {
        throw new Error('取消学习状态失败')
      }
      
      // 更新本地数据
      questions.value[currentIndex.value].last_study_time = null
    }
  } catch (error) {
    console.error('切换学习状态失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
    isMarking.value = !isMarking.value // 恢复状态
  }
}

// 上一题
const prevQuestion = async () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    // 更新学习状态标记
    isMarking.value = !!questions.value[currentIndex.value].last_study_time
  }
}

// 下一题
const nextQuestion = async () => {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    // 更新学习状态标记
    isMarking.value = !!questions.value[currentIndex.value].last_study_time
  }
}

// 返回上一页
const navigateBack = () => {
  uni.navigateBack()
}

onMounted(async () => {
  console.log('question页面加载完成')
  
  try {
    // 获取页面参数
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    console.log('当前页面参数:', currentPage.$page.options)
    
    const { 
      id,
      categoryId: categoryIdParam,
      categoryName: name,
      index
    } = currentPage.$page.options
    
    console.log('解析后的参数:', { id, categoryIdParam, name, index })
    
    if (!id || !name) {
      console.error('缺少必要的页面参数')
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      return
    }
    
    // 设置参数
    questionId.value = id
    categoryId.value = categoryIdParam || id
    categoryName.value = decodeURIComponent(name)
    // 设置当前题目索引
    if (index !== undefined) {
      currentIndex.value = parseInt(index)
    }
    
    // 确保数据库已初始化
    await checkAndInitDB()
    console.log('数据库初始化完成')
    
    // 加载题目列表
    await loadQuestions()
    console.log('题目列表加载完成')
  } catch (error) {
    console.error('页面初始化失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-top: calc(var(--status-bar-height) + 88rpx);
  padding-bottom: 120rpx;
  box-sizing: border-box;
}

.nav-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  padding-top: var(--status-bar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: calc(var(--status-bar-height) + 88rpx);
  box-sizing: border-box;
}

.nav-left, .nav-right {
  width: 60rpx;
}

.nav-title {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  background-color: #f0f0f0;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  display: inline-block;
}

.nav-icon {
  font-size: 40rpx;
  color: #333;
}

.content {
  flex: 1;
  padding: 20rpx;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.question-content {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.question-title {
  font-size: 32rpx;
  color: #333;
  line-height: 1.8;
  display: block;
  font-weight: bold;
  width: 100%;
  word-break: break-all;
}

.question-meta {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
}

.study-badge {
  display: inline-flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.study-badge.studied {
  background-color: rgba(76, 175, 80, 0.1);
}

.study-status {
  font-size: 24rpx;
  color: #666;
  transition: color 0.3s ease;
}

.study-badge.studied .study-status {
  color: #4caf50;
}

.study-time {
  font-size: 24rpx;
  color: #666;
  margin-left: 8rpx;
  border-left: 2rpx solid #ddd;
  padding-left: 8rpx;
  transition: color 0.3s ease;
}

.study-badge.studied .study-time {
  color: #4caf50;
}

.answer-section {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.answer-header {
  padding: 24rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  border-bottom: 1rpx solid #eee;
}

.answer-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.answer-icon {
  font-size: 28rpx;
  color: #2979ff;
  margin-left: 10rpx;
}

.answer-content {
  padding: 30rpx;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
}

.answer-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  width: 100%;
  word-break: break-all;
}

.action-section {
  margin: 20rpx 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  gap: 20rpx;
}

.action-btn {
  font-size: 28rpx;
  padding: 16rpx 40rpx;
  border-radius: 8rpx;
  text-align: center;
  border: none;
  min-width: 180rpx;
  max-width: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.3s ease;
}

.btn-icon {
  font-size: 32rpx;
  margin-right: 4rpx;
}

.study-btn {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: #fff;
  border: none;
  box-shadow: 0 2rpx 12rpx rgba(76, 175, 80, 0.2);
  font-weight: bold;
  transition: all 0.3s ease;
}

.study-btn-active {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  box-shadow: 0 2rpx 12rpx rgba(244, 67, 54, 0.2);
}

.study-btn:active {
  transform: scale(0.98);
}

.view-detail {
  background: linear-gradient(135deg, #2979ff, #1565c0);
  color: #fff;
  box-shadow: 0 2rpx 12rpx rgba(41, 121, 255, 0.2);
}

.view-detail:active {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  transform: translateY(2rpx);
}

.bottom-bar {
  background-color: #fff;
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #eee;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 120rpx;
  box-sizing: border-box;
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  border-radius: 8rpx;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  transition: all 0.3s;
  min-width: 200rpx;
  justify-content: center;
  margin: 0 10rpx;
}

.nav-btn:active {
  background: linear-gradient(135deg, #e0e0e0, #bdbdbd);
  transform: translateY(2rpx);
}

.nav-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.btn-text {
  font-size: 28rpx;
  color: #666;
  font-weight: bold;
}

.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 28rpx;
}
</style> 