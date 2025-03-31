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
        <text class="question-text">{{ currentQuestion.content }}</text>
      </view>

      <!-- 答案部分 -->
      <view class="answer-section">
        <view class="answer-header" @click="toggleAnswer">
          <text class="answer-title">答案</text>
          <text class="answer-icon">{{ showAnswer ? '▼' : '▶' }}</text>
        </view>
        <view v-if="showAnswer" class="answer-content">
          <text class="answer-text">{{ currentQuestion.answer }}</text>
        </view>
      </view>

      <!-- 详情链接 -->
      <view v-if="currentQuestion.uri" class="detail-section">
        <button class="detail-btn" @click="openDetail">查看详情</button>
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

const categoryId = ref('')
const categoryName = ref('')
const questions = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const isLoading = ref(false)

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
    
    // 获取题目列表
    const sql = `
      SELECT q.*, 
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite,
        up.last_visit_time as last_study_time
      FROM question_map q
      LEFT JOIN favorites f ON q.id = f.question_id
      LEFT JOIN user_progress up ON q.id = up.question_id
      WHERE q.category_id = ?
      ORDER BY q.sort_order ASC
    `
    
    const result = await db.selectTableDataBySql(sql, [categoryId.value])
    questions.value = result
    
    // 更新学习时间
    if (currentQuestion.value.id) {
      await updateStudyTime(currentQuestion.value.id)
    }
    
    console.log('题目列表:', questions.value)
  } catch (error) {
    console.error('加载题目失败:', error)
    // 发生错误时，等待100ms后重试
    setTimeout(async () => {
      await loadQuestions()
    }, 100)
  } finally {
    isLoading.value = false
  }
}

// 更新学习时间
const updateStudyTime = async (questionId) => {
  try {
    const sql = `
      INSERT OR REPLACE INTO user_progress (question_id, last_visit_time, create_time)
      VALUES (?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `
    await db.executeSql(sql, [questionId])
  } catch (error) {
    console.error('更新学习时间失败:', error)
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  try {
    const questionId = currentQuestion.value.id
    if (!questionId) return
    
    if (isFavorite.value) {
      // 取消收藏
      const sql = 'DELETE FROM favorites WHERE question_id = ?'
      await db.executeSql(sql, [questionId])
    } else {
      // 添加收藏
      const sql = 'INSERT INTO favorites (question_id, create_time) VALUES (?, datetime("now", "localtime"))'
      await db.executeSql(sql, [questionId])
    }
    
    // 重新加载题目列表以更新收藏状态
    await loadQuestions()
  } catch (error) {
    console.error('切换收藏状态失败:', error)
  }
}

// 切换答案显示
const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value
}

// 打开详情链接
const openDetail = () => {
  if (currentQuestion.value.uri) {
    uni.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(currentQuestion.value.uri)}`
    })
  }
}

// 上一题
const prevQuestion = async () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
    await updateStudyTime(currentQuestion.value.id)
  }
}

// 下一题
const nextQuestion = async () => {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    showAnswer.value = false
    await updateStudyTime(currentQuestion.value.id)
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
    
    const { categoryId: id, categoryName: name } = currentPage.$page.options
    console.log('解析后的参数:', { id, name })
    
    if (!id || !name) {
      console.error('缺少必要的页面参数')
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      return
    }
    
    categoryId.value = id
    categoryName.value = decodeURIComponent(name)
    
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
}

.nav-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee;
}

.nav-left, .nav-right {
  width: 60rpx;
}

.nav-title {
  flex: 1;
  text-align: center;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
  display: block;
}

.nav-icon {
  font-size: 40rpx;
  color: #333;
}

.content {
  flex: 1;
  padding: 30rpx;
}

.question-content {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.question-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.question-text {
  font-size: 30rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.answer-section {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.answer-header {
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
}

.answer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.answer-icon {
  font-size: 24rpx;
  color: #666;
}

.answer-content {
  padding: 30rpx;
}

.answer-text {
  font-size: 30rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.detail-section {
  margin-top: 20rpx;
  padding: 0 30rpx;
}

.detail-btn {
  background-color: #007AFF;
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  text-align: center;
}

.bottom-bar {
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #eee;
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
}

.nav-btn.disabled {
  opacity: 0.5;
}

.btn-icon {
  font-size: 32rpx;
  color: #666;
  margin: 0 10rpx;
}

.btn-text {
  font-size: 28rpx;
  color: #666;
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