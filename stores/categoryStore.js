import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCategories } from '@/api/api'

const STORAGE_KEY = 'java_interview_categories'

export const useCategoryStore = defineStore('category', () => {
  // 状态
  const categories = ref([])
  const currentCategory = ref(null)
  const isLoading = ref(false)

  // 从本地存储加载数据
  async function loadFromStorage() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        categories.value = parsed.categories || []
        currentCategory.value = parsed.currentCategory || null
        console.log('从本地存储加载分类数据成功')
      }
    } catch (error) {
      console.error('加载分类数据失败:', error)
    }
  }

  // 保存数据到本地存储
  async function saveToStorage() {
    try {
      const data = {
        categories: categories.value,
        currentCategory: currentCategory.value
      }
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
      console.log('保存分类数据到本地存储成功')
    } catch (error) {
      console.error('保存分类数据失败:', error)
    }
  }

  // 获取分类列表
  async function fetchCategories() {
    try {
      isLoading.value = true
      console.log('开始获取分类列表')
      const result = await getCategories()
      categories.value = result
      if (!currentCategory.value && result.length > 0) {
        currentCategory.value = result[0]
      }
      await saveToStorage()
      console.log('获取分类列表成功:', result)
    } catch (error) {
      console.error('获取分类列表失败:', error)
      uni.showToast({
        title: '获取分类失败',
        icon: 'none'
      })
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 切换分类
  async function switchCategory(categoryId) {
    try {
      const category = categories.value.find(c => c.id === categoryId)
      if (category) {
        currentCategory.value = category
        await saveToStorage()
        console.log('切换分类成功:', category.name)
      }
    } catch (error) {
      console.error('切换分类失败:', error)
    }
  }

  // 获取分类
  function getCategoryById(id) {
    return categories.value.find(c => c.id === id)
  }

  // 更新分类进度
  async function updateCategoryProgress(categoryId, completedCount) {
    try {
      const category = getCategoryById(categoryId)
      if (category) {
        category.completedCount = completedCount
        await saveToStorage()
        console.log('更新分类进度成功:', { categoryId, completedCount })
      }
    } catch (error) {
      console.error('更新分类进度失败:', error)
    }
  }

  // 初始化
  loadFromStorage()

  return {
    categories,
    currentCategory,
    isLoading,
    fetchCategories,
    switchCategory,
    getCategoryById,
    updateCategoryProgress
  }
}) 