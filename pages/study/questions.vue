<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header">
			<view class="header-left">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">←</text>
				</view>
			</view>
			<view class="header-center">
				<text class="title">{{ categoryName }}</text>
				<text class="subtitle">已学习({{ completedCount }}/{{ questions.length }})</text>
			</view>
		</view>

		<!-- 题目列表 -->
		<scroll-view scroll-y class="question-list" refresher-enabled :refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
			<view v-for="(question, index) in questions" :key="question.id" class="question-item"
				@click="navigateToQuestion(question)">
				<view class="question-info">
					<text class="question-title">{{ index + 1 }}. {{ question.title }}</text>
					<view class="question-meta">
						<view class="question-tags">
							<view v-if="question.is_favorite" class="tag favorite">
								<text class="icon">★</text>
								<text>已收藏</text>
							</view>
							<view v-else class="tag unfavorite">
								<text class="icon">☆</text>
								<text>未收藏</text>
							</view>
							<view v-if="question.is_learned" class="tag completed">
								<text class="icon">✓</text>
								<text>已学习</text>
							</view>
							<view v-else class="tag uncompleted">
								<text class="icon">○</text>
								<text>未学习</text>
							</view>
						</view>
					</view>
				</view>
				<view class="question-arrow">
					<text class="icon">›</text>
				</view>
			</view>

			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading">
				<text>加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-if="!isLoading && questions.length === 0" class="empty">
				<text>暂无题目数据</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		onUnmounted
	} from 'vue'
	import db from '@/common/database'
	import { checkAndInitDB, initTables, importCategoryData, importQuestionMapData } from '@/utils/dbInit'
	import { onBackPress } from '@dcloudio/uni-app'
	import { getQuestionsWithStatus, getCategoryProgress } from '@/api/api'

	// 页面配置
	defineOptions({
		navigationStyle: 'custom',
		navigationBarTitleText: '',
		navigationBar: {
			titleText: ''
		}
	})

	const categoryId = ref('')
	const categoryName = ref('')
	const questions = ref([])
	const isLoading = ref(false)
	const isRefreshing = ref(false)
	const scrollTop = ref(0)
	
	// 触摸相关变量
	const touchStartX = ref(0)
	const touchEndX = ref(0)
	const minSwipeDistance = 50 // 最小滑动距离

	// 返回上一页
	const goBack = () => {
		// 发送刷新通知
		uni.$emit('categoryProgressChanged', {
			categoryId: categoryId.value
		})
		console.log('发送分类进度变更通知，categoryId:', categoryId.value)
		
		uni.switchTab({
			url: '/pages/study/index'
		})
	}

	// 监听系统返回按钮
	onBackPress(() => {
		goBack()
		return true // 返回true表示我们自己处理返回事件
	})

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

	// 页面显示时恢复滚动位置并刷新数据
	const onShow = async () => {
		const route = '/pages/study/index'
		const saved = uni.$store?.scrollPositions?.[route]
		if (saved !== undefined) {
			uni.pageScrollTo({
				scrollTop: saved,
				duration: 0
			})
		}
		// 刷新题目列表
		await loadQuestions()
	}

	onMounted(() => {
		// 获取页面参数
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		const {
			categoryId: id,
			categoryName: name
		} = currentPage.$page.options
		
		// 确保categoryId是数字类型
		categoryId.value = Number(id)
		categoryName.value = decodeURIComponent(name)
		
		// 加载题目列表
		loadQuestions()
		
		// 监听题目状态变更事件
		uni.$on('questionStatusChanged', handleQuestionStatusChanged)
		console.log('已添加题目状态变更事件监听')
	})

	// 移除页面滚动监听和事件监听
	onUnmounted(() => {
		// 移除题目状态变更事件监听
		uni.$off('questionStatusChanged', handleQuestionStatusChanged)
		console.log('已移除题目状态变更事件监听')
	})

	// 处理触摸开始
	const handleTouchStart = (e) => {
		touchStartX.value = e.touches[0].clientX
	}

	// 处理触摸结束
	const handleTouchEnd = (e) => {
		touchEndX.value = e.changedTouches[0].clientX
		handleSwipe()
	}

	// 处理滑动
	const handleSwipe = () => {
		const swipeDistance = touchEndX.value - touchStartX.value
		if (Math.abs(swipeDistance) > minSwipeDistance) {
			if (swipeDistance > 0) {
				// 向右滑动，返回上一页
				goBack()
			}
		}
	}

	// 暴露页面生命周期函数
	defineExpose({
		onHide,
		onShow,
		onPageScroll
	})

	// 在 script setup 部分添加计算属性
	const completedCount = ref(0)

	// 处理题目状态变更
	const handleQuestionStatusChanged = async (data) => {
		console.log('收到题目状态变更事件:', data)
		// 确保类型一致进行比较
		const eventCategoryId = Number(data.categoryId)
		console.log('事件中的categoryId:', eventCategoryId, '当前页面的categoryId:', categoryId.value)
		
		// 只有当变更的题目属于当前分类时才刷新
		if (eventCategoryId === categoryId.value) {
			console.log('开始刷新题目列表，当前categoryId:', categoryId.value)
			try {
				await loadQuestions()
				console.log('题目列表刷新完成')
			} catch (error) {
				console.error('刷新题目列表失败:', error)
				uni.showToast({
					title: '刷新失败',
					icon: 'none'
				})
			}
		} else {
			console.log('忽略其他分类的状态变更')
		}
	}

	// 加载题目列表
	const loadQuestions = async () => {
		try {
			isLoading.value = true
			console.log('开始加载题目列表')
			
			// 确保数据库已初始化
			await checkAndInitDB()
			console.log('数据库初始化检查完成')
			
			// 检查question_map表中是否有数据
			const checkSql = 'SELECT COUNT(*) as count FROM question_map'
			const checkResult = await db.selectTableDataBySql(checkSql)
			console.log('数据检查结果:', checkResult[0].count)
			
			// 如果没有数据，重新初始化数据库
			if (checkResult[0].count === 0) {
				console.log('数据库为空，开始初始化')
				await initTables()
				await importCategoryData()
				await importQuestionMapData()
				console.log('数据库初始化完成')
			}
			
			// 获取题目列表
			console.log('开始获取题目列表，categoryId:', categoryId.value)
			const result = await getQuestionsWithStatus(categoryId.value)
			console.log('获取到的题目数量:', result?.length || 0)
			
			if (result && result.length > 0) {
				questions.value = result
				// 计算已完成的题目数量
				completedCount.value = questions.value.filter(q => q.is_learned).length
				console.log('已完成的题目数量:', completedCount.value)
			} else {
				questions.value = []
				completedCount.value = 0
				console.log('未找到题目数据')
			}
			
		} catch (error) {
			console.error('加载题目失败:', error)
			uni.showToast({
				title: '加载题目失败',
				icon: 'none'
			})
			throw error // 向上抛出错误
		} finally {
			isLoading.value = false
			isRefreshing.value = false
			console.log('加载题目列表完成')
		}
	}

	// 跳转到题目详情
	const navigateToQuestion = (question) => {
		console.log('点击题目:', question)
		const index = questions.value.findIndex(q => q.id === question.id)
		console.log('题目索引:', index)
		const url = `/pages/study/question?id=${question.id}&index=${index}&categoryId=${categoryId.value}&categoryName=${encodeURIComponent(categoryName.value)}`
		console.log('跳转URL:', url)
		uni.navigateTo({
			url,
			fail: (err) => {
				console.error('页面跳转失败:', err)
				uni.showToast({
					title: '页面跳转失败',
					icon: 'none'
				})
			}
		})
	}

	// 下拉刷新处理
	const onRefresh = async () => {
		isRefreshing.value = true
		await loadQuestions()
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f5f6fa;
		padding-top: var(--status-bar-height);
	}

	.header {
		background-color: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		align-items: center;
		border-bottom: 1rpx solid #eee;
		position: sticky;
		top: var(--status-bar-height);
		z-index: 100;
	}

	.header-left {
		width: 100rpx;
		position: absolute;
		left: 30rpx;
	}

	.header-center {
		width: 100%;
		text-align: center;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 40rpx;
		color: #333;
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

	.question-list {
		height: calc(100vh - var(--status-bar-height) - 100rpx);
		padding: 16rpx;
		box-sizing: border-box;
	}

	.question-item {
		background-color: #fff;
		padding: 20rpx;
		border-radius: 16rpx;
		margin-bottom: 12rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
		min-height: 100rpx;
	}

	.question-item:active {
		transform: scale(0.98);
		background-color: #fafafa;
	}

	.question-info {
		flex: 1;
		margin-right: 12rpx;
		display: flex;
		align-items: center;
	}

	.question-title {
		flex: 1;
		font-size: 28rpx;
		color: #333;
		line-height: 1.4;
		margin-right: 12rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.question-meta {
		display: flex;
		align-items: center;
		min-width: 90rpx;
	}

	.question-tags {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		align-self: center;
	}

	.tag {
		font-size: 18rpx;
		padding: 2rpx 8rpx;
		border-radius: 16rpx;
		display: inline-flex;
		align-items: center;
		gap: 2rpx;
		line-height: 1.2;
		white-space: nowrap;
	}

	.tag .icon {
		font-size: 18rpx;
		margin-right: 2rpx;
	}

	.tag.favorite, .tag.unfavorite {
		background-color: #fff3e0;
		color: #ff9800;
		border: 1rpx solid #ffb74d;
	}

	.tag.completed, .tag.uncompleted {
		background-color: #e8f5e9;
		color: #4caf50;
		border: 1rpx solid #81c784;
	}

	.tag.unfavorite {
		background-color: #f5f5f5;
		color: #9e9e9e;
		border: 1rpx solid #e0e0e0;
	}
	
	.tag.uncompleted {
		background-color: #f5f5f5;
		color: #9e9e9e;
		border: 1rpx solid #e0e0e0;
	}

	.question-arrow {
		display: flex;
		align-items: center;
		padding: 0 8rpx;
		align-self: center;
	}

	.question-arrow .icon {
		font-size: 32rpx;
		color: #ccc;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 28rpx;
	}

	/* 添加滚动条样式 */
	.question-list::-webkit-scrollbar {
		width: 4rpx;
	}

	.question-list::-webkit-scrollbar-thumb {
		background-color: #ddd;
		border-radius: 2rpx;
	}

	.question-list::-webkit-scrollbar-track {
		background-color: transparent;
	}
</style>