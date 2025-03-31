import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'java_interview_user_data'
const MAX_RECENT_QUESTIONS = 20

export const useUserStore = defineStore('user', () => {
  // 状态
  const stats = ref({
    totalQuestions: 0,
    completedQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    favoriteCount: 0,
    lastStudyTime: 0
  })
  const favorites = ref([])
  const recentQuestions = ref([])
  const isLoading = ref(false)

  // 计算属性
  const completionRate = computed(() => 
    stats.value.totalQuestions > 0 
      ? (stats.value.completedQuestions / stats.value.totalQuestions) * 100 
      : 0
  )
  const correctRate = computed(() => 
    stats.value.completedQuestions > 0 
      ? (stats.value.correctAnswers / stats.value.completedQuestions) * 100 
      : 0
  )

  // 从本地存储加载数据
  async function loadFromStorage() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        stats.value = parsed.stats || stats.value
        favorites.value = parsed.favorites || []
        recentQuestions.value = parsed.recentQuestions || []
        console.log('从本地存储加载用户数据成功')
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  }

  // 保存数据到本地存储
  async function saveToStorage() {
    try {
      const data = {
        stats: stats.value,
        favorites: favorites.value,
        recentQuestions: recentQuestions.value
      }
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
      console.log('保存用户数据到本地存储成功')
    } catch (error) {
      console.error('保存用户数据失败:', error)
    }
  }

  // 获取用户统计信息
  async function fetchUserStats() {
    try {
      isLoading.value = true
      console.log('开始获取用户统计信息')
      // TODO: 从API获取用户统计信息
      await saveToStorage()
      console.log('获取用户统计信息成功')
    } catch (error) {
      console.error('获取用户统计信息失败:', error)
      uni.showToast({
        title: '获取统计信息失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取收藏题目
  async function fetchFavorites() {
    try {
      isLoading.value = true
      console.log('开始获取收藏题目')
      // TODO: 从API获取收藏题目
      await saveToStorage()
      console.log('获取收藏题目成功')
    } catch (error) {
      console.error('获取收藏题目失败:', error)
      uni.showToast({
        title: '获取收藏题目失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 获取最近学习记录
  async function fetchRecentQuestions() {
    try {
      isLoading.value = true
      console.log('开始获取最近学习记录')
      // TODO: 从API获取最近学习记录
      await saveToStorage()
      console.log('获取最近学习记录成功')
    } catch (error) {
      console.error('获取最近学习记录失败:', error)
      uni.showToast({
        title: '获取学习记录失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 切换收藏状态
  async function toggleFavorite(questionId) {
    try {
      const index = favorites.value.indexOf(questionId)
      if (index === -1) {
        favorites.value.push(questionId)
        stats.value.favoriteCount++
      } else {
        favorites.value.splice(index, 1)
        stats.value.favoriteCount--
      }
      await saveToStorage()
      console.log('切换收藏状态成功:', { questionId, isFavorite: index === -1 })
    } catch (error) {
      console.error('切换收藏状态失败:', error)
    }
  }

  // 添加学习记录
  async function addRecentQuestion(question) {
    try {
      const index = recentQuestions.value.findIndex(q => q.id === question.id)
      if (index !== -1) {
        recentQuestions.value.splice(index, 1)
      }
      recentQuestions.value.unshift(question)
      if (recentQuestions.value.length > MAX_RECENT_QUESTIONS) {
        recentQuestions.value.pop()
      }
      stats.value.lastStudyTime = Date.now()
      await saveToStorage()
      console.log('添加学习记录成功:', question)
    } catch (error) {
      console.error('添加学习记录失败:', error)
    }
  }

  // 更新学习统计
  async function updateStats(status) {
    try {
      stats.value.completedQuestions++
      if (status === 'correct') {
        stats.value.correctAnswers++
      } else {
        stats.value.incorrectAnswers++
      }
      await saveToStorage()
      console.log('更新学习统计成功:', { status })
    } catch (error) {
      console.error('更新学习统计失败:', error)
    }
  }

  // 初始化
  loadFromStorage()

  return {
    stats,
    favorites,
    recentQuestions,
    isLoading,
    completionRate,
    correctRate,
    fetchUserStats,
    fetchFavorites,
    fetchRecentQuestions,
    toggleFavorite,
    addRecentQuestion,
    updateStats
  }
}) 