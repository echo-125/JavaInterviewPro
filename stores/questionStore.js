import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestions, getQuestionDetail } from '@/api/api'

const STORAGE_KEY = 'java_interview_questions'

export const useQuestionStore = defineStore('question', () => {
  // 状态
  const questions = ref([])
  const currentQuestion = ref(null)
  const isLoading = ref(false)
  const currentIndex = ref(0)

  // 计算属性
  const hasPrevious = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < questions.value.length - 1)
  const previousQuestion = computed(() => 
    hasPrevious.value ? questions.value[currentIndex.value - 1] : null
  )
  const nextQuestion = computed(() => 
    hasNext.value ? questions.value[currentIndex.value + 1] : null
  )

  // 从本地存储加载数据
  async function loadFromStorage() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY)
      if (data) {
        questions.value = JSON.parse(data)
        console.log('从本地存储加载题目数据成功')
      }
    } catch (error) {
      console.error('加载题目数据失败:', error)
    }
  }

  // 保存数据到本地存储
  async function saveToStorage() {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(questions.value))
      console.log('保存题目数据到本地存储成功')
    } catch (error) {
      console.error('保存题目数据失败:', error)
    }
  }

  // 加载题目列表
  async function loadQuestions(categoryId) {
    try {
      isLoading.value = true
      console.log('开始加载题目列表:', categoryId)
      const result = await getQuestions(categoryId)
      questions.value = result
      currentIndex.value = 0
      currentQuestion.value = questions.value[0] || null
      console.log('加载题目列表成功:', result)
      await saveToStorage()
    } catch (error) {
      console.error('加载题目列表失败:', error)
      uni.showToast({
        title: '加载题目失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 加载题目详情
  async function loadQuestionDetail(id) {
    try {
      isLoading.value = true
      console.log('开始加载题目详情:', id)
      const result = await getQuestionDetail(id)
      const index = questions.value.findIndex(q => q.id === id)
      if (index !== -1) {
        questions.value[index] = result
        currentQuestion.value = result
        currentIndex.value = index
        await saveToStorage()
      }
      console.log('加载题目详情成功:', result)
    } catch (error) {
      console.error('加载题目详情失败:', error)
      uni.showToast({
        title: '加载题目详情失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 切换到上一题
  function goToPrevious() {
    if (hasPrevious.value) {
      currentIndex.value--
      currentQuestion.value = questions.value[currentIndex.value]
      console.log('切换到上一题:', currentQuestion.value?.title)
    }
  }

  // 切换到下一题
  function goToNext() {
    if (hasNext.value) {
      currentIndex.value++
      currentQuestion.value = questions.value[currentIndex.value]
      console.log('切换到下一题:', currentQuestion.value?.title)
    }
  }

  // 更新学习进度
  async function updateProgress(questionId, status) {
    try {
      const question = questions.value.find(q => q.id === questionId)
      if (question) {
        question.progress = 'completed'
        question.updateTime = Date.now()
        await saveToStorage()
        console.log('更新学习进度成功:', { questionId, status })
      }
    } catch (error) {
      console.error('更新学习进度失败:', error)
    }
  }

  // 初始化
  loadFromStorage()

  return {
    questions,
    currentQuestion,
    isLoading,
    hasPrevious,
    hasNext,
    previousQuestion,
    nextQuestion,
    loadQuestions,
    loadQuestionDetail,
    goToPrevious,
    goToNext,
    updateProgress
  }
}) 