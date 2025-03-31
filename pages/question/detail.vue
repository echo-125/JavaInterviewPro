<template>
  <view class="container">
    <view class="header">
      <view class="nav-buttons">
        <button class="nav-btn" @click="prevQuestion" :disabled="!canPrev">上一题</button>
        <button class="nav-btn" @click="nextQuestion" :disabled="!canNext">下一题</button>
      </view>
      <view class="actions">
        <view class="favorite-btn" @click="toggleFavorite">
          <text :class="['iconfont', isFavorite ? 'icon-star-filled' : 'icon-star']"></text>
        </view>
      </view>
    </view>

    <view class="content">
      <view class="question-section">
        <view class="section-title">题目</view>
        <view class="question-content">{{ question.content }}</view>
      </view>

      <view class="answer-section">
        <view class="section-title">答案</view>
        <view class="answer-content">{{ question.answer }}</view>
      </view>

      <view class="detail-section">
        <button class="detail-btn" @click="viewDetail">查看详细解析</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/common/database'

const question = ref(null)
const isFavorite = ref(false)
const canPrev = ref(false)
const canNext = ref(false)

// 加载题目详情
const loadQuestion = async (id) => {
  try {
    // 检查数据库表是否存在
    const tables = await db.QueryTables()
    if (!tables.some(table => table.name === 'question_map')) {
      console.log('question_map表不存在')
      return
    }
    
    // 查询题目详情
    const sql = `
      SELECT q.*, c.name as category_name
      FROM question_map q
      LEFT JOIN category c ON q.category_id = c.id
      WHERE q.id = ?
    `
    
    const result = await db.selectTableDataBySql(sql, [id])
    if (result && result.length > 0) {
      question.value = result[0]
      isFavorite.value = question.value.is_favorite === 1
      checkNavigation()
      console.log('题目详情:', question.value)
    }
  } catch (error) {
    console.error('加载题目失败:', error)
  }
}

// 检查收藏状态
const checkFavoriteStatus = async () => {
  if (!question.value) return
  try {
    const sql = 'SELECT is_favorite FROM question_map WHERE id = ?'
    const result = await db.selectTableDataBySql(sql, [question.value.id])
    if (result && result.length > 0) {
      isFavorite.value = result[0].is_favorite === 1
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
  }
}

// 检查导航状态
const checkNavigation = async () => {
  if (!question.value) return
  try {
    // 检查是否有上一题
    const prevSql = 'SELECT id FROM question_map WHERE id < ? ORDER BY id DESC LIMIT 1'
    const prevResult = await db.selectTableDataBySql(prevSql, [question.value.id])
    canPrev.value = prevResult && prevResult.length > 0
    
    // 检查是否有下一题
    const nextSql = 'SELECT id FROM question_map WHERE id > ? ORDER BY id ASC LIMIT 1'
    const nextResult = await db.selectTableDataBySql(nextSql, [question.value.id])
    canNext.value = nextResult && nextResult.length > 0
  } catch (error) {
    console.error('检查导航状态失败:', error)
  }
}

// 更新学习进度
const updateProgress = async () => {
  if (!question.value) return
  try {
    const sql = 'UPDATE question_map SET last_study_time = ? WHERE id = ?'
    await db.executeSql(sql, [new Date().getTime(), question.value.id])
  } catch (error) {
    console.error('更新进度失败:', error)
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  if (!question.value) return
  try {
    const newStatus = isFavorite.value ? 0 : 1
    const sql = 'UPDATE question_map SET is_favorite = ? WHERE id = ?'
    await db.executeSql(sql, [newStatus, question.value.id])
    isFavorite.value = !isFavorite.value
  } catch (error) {
    console.error('切换收藏状态失败:', error)
  }
}

// 上一题
const prevQuestion = async () => {
  if (!question.value || !canPrev.value) return
  try {
    const sql = 'SELECT id FROM question_map WHERE id < ? ORDER BY id DESC LIMIT 1'
    const result = await db.selectTableDataBySql(sql, [question.value.id])
    if (result && result.length > 0) {
      loadQuestion(result[0].id)
    }
  } catch (error) {
    console.error('加载上一题失败:', error)
  }
}

// 下一题
const nextQuestion = async () => {
  if (!question.value || !canNext.value) return
  try {
    const sql = 'SELECT id FROM question_map WHERE id > ? ORDER BY id ASC LIMIT 1'
    const result = await db.selectTableDataBySql(sql, [question.value.id])
    if (result && result.length > 0) {
      loadQuestion(result[0].id)
    }
  } catch (error) {
    console.error('加载下一题失败:', error)
  }
}

// 查看详细解析
const viewDetail = () => {
  uni.navigateTo({
    url: '/pages/question/webview?uri=' + encodeURIComponent(question.value.uri)
  })
}

// 加载第一题
const loadFirstQuestion = async () => {
  try {
    const sql = 'SELECT id FROM question_map ORDER BY id ASC LIMIT 1'
    const result = await db.selectTableDataBySql(sql)
    if (result && result.length > 0) {
      loadQuestion(result[0].id)
    }
  } catch (error) {
    console.error('加载第一题失败:', error)
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const id = currentPage.options.id
  
  if (id) {
    loadQuestion(parseInt(id))
  } else {
    loadFirstQuestion()
  }
})
</script>

<style>
.container {
  padding: 20rpx;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.nav-buttons {
  display: flex;
  gap: 20rpx;
}

.nav-btn {
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
}

.nav-btn[disabled] {
  opacity: 0.5;
}

.favorite-btn {
  padding: 10rpx;
}

.icon-star {
  color: #ddd;
  font-size: 40rpx;
}

.icon-star-filled {
  color: #FFD700;
  font-size: 40rpx;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.question-section,
.answer-section {
  margin-bottom: 40rpx;
}

.question-content,
.answer-content {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

.detail-section {
  margin-top: 40rpx;
  text-align: center;
}

.detail-btn {
  background-color: #007AFF;
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style> 