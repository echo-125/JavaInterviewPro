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
        <text class="favorite-icon" @click="toggleFavoriteStatus">{{ isFavorite ? '★' : '☆' }}</text>
      </view>
    </view>

    <!-- 题目内容 -->
    <scroll-view scroll-y class="content">
      <view class="question-content">
        <text class="question-title">{{ currentQuestion.title }}</text>
        <view class="question-meta">
          <view class="study-badge" 
                :class="{ studied: currentQuestion.is_learned }"
                @click="handleStudyBadgeClick">
            <text class="study-status">{{ currentQuestion.is_learned ? '已学习' : '未学习' }}</text>
            <text v-if="currentQuestion.last_study_time" class="study-time">{{ formatDateTime(currentQuestion.last_study_time) }}</text>
          </view>
        </view>
      </view>

      <!-- 答案部分 -->
      <view class="answer-section">
        <view class="answer-header">
          <view class="answer-title-wrapper">
            <text class="answer-title">答案解析</text>
            <view class="play-btn" @click="togglePlay">
              <text class="icon-text">{{ isPlaying ? '⏹' : '▶' }}</text>
            </view>
          </view>
        </view>
        <view class="answer-content">
          <rich-text class="answer-text" :nodes="currentQuestion.answer || '暂无答案'"></rich-text>
          <view v-if="currentQuestion.uri" class="detail-link" @click="openDetail">
            <text class="link-text">查看详情</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部导航栏 -->
    <view class="bottom-bar">
      <view class="nav-buttons">
        <view class="nav-btn study" 
              :class="{ 'study-btn-disabled': currentQuestion.is_learned }"
              @click="toggleStudyStatus">
          <text class="btn-text">{{ currentQuestion.is_learned ? '已学习' : '记住了' }}</text>
        </view>
        <view class="nav-btn prev" @click="prevQuestion" :class="{ disabled: currentIndex === 0 }">
          <text class="btn-text">上一题</text>
        </view>
        <view class="nav-btn next" @click="nextQuestion" :class="{ disabled: currentIndex === totalQuestions - 1 }">
          <text class="btn-text">下一题</text>
        </view>
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
import { checkAndInitDB } from '@/common/dbInit'
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
const isPlaying = ref(false) // 保留状态，后续用于离线语音播放

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
        
        // 确保数据库已初始化
        await checkAndInitDB()
        
        // 获取该分类下的所有题目
        const result = await getQuestionsWithStatus(categoryId.value)
        
        if (result && result.length > 0) {
            // 确保每个题目都有正确的学习状态和收藏状态
            questions.value = result.map(question => ({
                ...question,
                last_study_time: question.learn_time || null,
                is_favorite: Boolean(question.is_favorite),
                is_learned: Boolean(question.is_learned)
            }))
            
            // 如果是从收藏页面进入，且当前题目不在列表中，添加当前题目
            const pages = getCurrentPages()
            const currentPage = pages[pages.length - 1]
            const { from } = currentPage.$page.options
            
            if (from === 'favorite') {
                const currentQuestionId = parseInt(questionId.value)
                const exists = questions.value.some(q => q.id === currentQuestionId)
                if (!exists) {
                    const currentQuestion = await getQuestionById(currentQuestionId)
                    if (currentQuestion) {
                        // 从收藏页面进入时，确保收藏状态为 true，并保持原有的学习状态
                        questions.value.unshift({
                            ...currentQuestion,
                            last_study_time: currentQuestion.learn_time || null,
                            is_favorite: true,
                            is_learned: Boolean(currentQuestion.is_learned)
                        })
                    }
                } else {
                    // 如果题目已存在，确保收藏状态为 true，并保持原有的学习状态
                    const questionIndex = questions.value.findIndex(q => q.id === currentQuestionId)
                    if (questionIndex !== -1) {
                        questions.value[questionIndex].is_favorite = true
                        questions.value[questionIndex].is_learned = Boolean(questions.value[questionIndex].is_learned)
                    }
                }
            }
            
            // 设置当前题目索引
            if (from === 'favorite') {
                const currentQuestionId = parseInt(questionId.value)
                const index = questions.value.findIndex(q => q.id === currentQuestionId)
                if (index !== -1) {
                    currentIndex.value = index
                }
            }
        } else {
            questions.value = []
        }
    } catch (error) {
        console.error('加载题目失败:', error)
        uni.showToast({
            title: '加载题目失败',
            icon: 'none'
        })
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
            return null
        }
        
        // 更新学习状态
        const success = await updateLearnStatus(numericQuestionId)
        if (!success) {
            return null
        }
        
        // 获取更新后的题目信息
        const result = await getQuestionById(numericQuestionId)
        if (result) {
            // 更新本地数据
            const currentTime = new Date().getTime()
            questions.value[currentIndex.value].last_study_time = currentTime
            return { learn_time: currentTime }
        }
        return null
    } catch (error) {
        console.error('更新学习时间失败:', error)
        return null
    }
}

// 切换收藏状态
const toggleFavoriteStatus = async () => {
    try {
        console.log('开始切换收藏状态')
        const questionId = currentQuestion.value.id
        console.log('当前题目ID:', questionId)
        
        if (!questionId) {
            console.error('无效的题目ID')
            return
        }
        
        console.log('调用 toggleFavorite API')
        const success = await toggleFavorite(questionId)
        console.log('API 返回结果:', success)
        
        if (!success) {
            throw new Error('切换收藏状态失败')
        }
        
        // 直接更新当前题目的收藏状态，而不是重新加载
        const newIsFavorite = !currentQuestion.value.is_favorite
        questions.value[currentIndex.value].is_favorite = newIsFavorite
        
        // 发送刷新通知
        notifyListRefresh()
        
        uni.showToast({
            title: newIsFavorite ? '已收藏' : '已取消收藏',
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
    const uri = currentQuestion.value.uri
    if (!uri) {
        uni.showToast({
            title: '暂无详情链接',
            icon: 'none'
        })
        return
    }
    
    // 简单的 URL 格式检查
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
        uni.showToast({
            title: '无效的链接地址',
            icon: 'none'
        })
        return
    }
    
    uni.navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(uri)}`,
        fail: (err) => {
            console.error('打开详情页面失败:', err)
            uni.showToast({
                title: '打开详情失败',
                icon: 'none'
            })
        }
    })
}

// 通知列表页面刷新
const notifyListRefresh = () => {
    uni.$emit('questionStatusChanged', {
        categoryId: categoryId.value
    })
}

// 处理学习状态徽章点击
const handleStudyBadgeClick = async () => {
    if (currentQuestion.value.is_learned) {
        try {
            const questionId = currentQuestion.value.id
            if (!questionId) return
            
            // 取消已学习状态
            const success = await cancelLearnStatus(questionId)
            if (!success) {
                throw new Error('取消学习状态失败')
            }
            
            // 更新本地数据
            questions.value[currentIndex.value].is_learned = false
            questions.value[currentIndex.value].last_study_time = null
            
            // 发送刷新通知
            notifyListRefresh()
            
            uni.showToast({
                title: '已重置学习状态',
                icon: 'success'
            })
        } catch (error) {
            console.error('取消学习状态失败:', error)
            uni.showToast({
                title: '操作失败',
                icon: 'none'
            })
        }
    }
}

// 切换学习状态
const toggleStudyStatus = async () => {
    try {
        const questionId = currentQuestion.value.id
        if (!questionId || currentQuestion.value.is_learned) return
        
        // 更新学习状态
        const result = await updateStudyTime(questionId)
        if (result) {
            // 同时更新学习状态和时间
            questions.value[currentIndex.value].is_learned = true
            questions.value[currentIndex.value].last_study_time = result.learn_time
            // 发送刷新通知
            notifyListRefresh()
            uni.showToast({
                title: '已标记为学习',
                icon: 'success'
            })
        }
    } catch (error) {
        console.error('更新学习状态失败:', error)
        uni.showToast({
            title: '操作失败',
            icon: 'none'
        })
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
const navigateBack = async () => {
    // 确保发送数字类型的categoryId
    const numericCategoryId = Number(categoryId.value)
    
    // 发送刷新通知
    uni.$emit('questionStatusChanged', {
        categoryId: numericCategoryId
    })
    
    // 等待一段时间确保事件被处理
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 返回上一页
    uni.navigateBack()
}

const togglePlay = () => {
  // 暂时禁用播放功能
  uni.showToast({
    title: '语音播放功能开发中',
    icon: 'none'
  })
}

onMounted(async () => {
    try {
        // 获取页面参数
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        
        const { 
            id,
            categoryId: categoryIdParam,
            categoryName: name,
            index
        } = currentPage.$page.options
        
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
        
        // 加载题目列表
        await loadQuestions()
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
    background-color: #f5f6fa;
    padding-top: var(--status-bar-height);
}

.nav-bar {
    background-color: #fff;
    padding: 20rpx 30rpx;
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid #eee;
    position: sticky;
    top: var(--status-bar-height);
    z-index: 100;
}

.nav-left {
    width: 100rpx;
}

.nav-title {
    flex: 1;
    text-align: center;
}

.nav-right {
    width: 100rpx;
    text-align: right;
}

.nav-icon {
    font-size: 40rpx;
    color: #333;
}

/* 添加收藏图标的特殊样式 */
.nav-right .nav-icon {
    color: #FFD700;  /* 金黄色 */
    text-shadow: 0 0 2rpx rgba(0, 0, 0, 0.1);  /* 添加轻微阴影效果 */
}

.title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    display: block;
}

.subtitle {
    font-size: 24rpx;
    color: #666;
    margin-top: 8rpx;
    display: block;
}

.content {
    height: calc(100vh - var(--status-bar-height) - 220rpx);
    padding: 16rpx;
    box-sizing: border-box;
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
  cursor: pointer;
}

.study-badge.studied {
  background-color: rgba(33, 150, 243, 0.1);
}

.study-status {
  font-size: 24rpx;
  color: #666;
  transition: color 0.3s ease;
}

.study-badge.studied .study-status {
  color: #2196f3;
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
  color: #2196f3;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}

.answer-title-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.answer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.play-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  transition: all 0.3s ease;
}

.play-btn:active {
  background-color: #e0e0e0;
  transform: scale(0.95);
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
  color: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: translateY(2rpx);
}

.study-btn {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
}

.study-btn:active {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
}

.study-btn-disabled {
  background: linear-gradient(135deg, #9E9E9E, #757575);
  box-shadow: none;
  opacity: 0.8;
  pointer-events: none;
}

.view-detail {
  background: linear-gradient(135deg, #2979ff, #1565c0);
}

.view-detail:active {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
}

.bottom-bar {
  background-color: #f8f8f8;
  padding: 12rpx 24rpx;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #e0e0e0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 100rpx;
  box-sizing: border-box;
}

.nav-buttons {
  flex: 1;
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  border-radius: 8rpx;
  background-color: #fff;
  border: 1rpx solid #ddd;
  transition: all 0.2s;
  min-width: 0;
}

.nav-btn.study {
  border-color: #007AFF;
}

.nav-btn .btn-text {
  font-size: 32rpx;
  color: #666;
  font-weight: 400;
}

.nav-btn.study .btn-text {
  color: #007AFF;
  font-weight: 400;
}

.nav-btn:active {
  background-color: #f5f5f5;
}

.nav-btn.study:active {
  background-color: rgba(0, 122, 255, 0.1);
}

.nav-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.nav-btn.study.study-btn-disabled {
  background-color: #f5f5f5;
  border-color: #ddd;
  opacity: 1;
}

.nav-btn.study.study-btn-disabled .btn-text {
  color: #999;
}

/* 修改详情链接样式 */
.detail-link {
  margin-top: 20rpx;
  text-align: right;
}

.link-text {
  font-size: 28rpx;
  color: #007AFF;
  display: inline-block;
  padding: 10rpx 0;
}

/* 修改收藏图标样式 */
.favorite-icon {
  font-size: 56rpx;
  color: #FFD700;
  text-shadow: 0 0 2rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.favorite-icon:active {
  transform: scale(0.95);
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

.icon-text {
  font-size: 28rpx;
  color: #666;
}
</style> 