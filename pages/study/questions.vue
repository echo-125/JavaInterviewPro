<template>
	<view class="container" :style="themeStyle">
		<!-- 顶部标题栏 -->
		<view class="header" :style="cardStyle">
			<view class="header-left">
				<view class="back-btn" @click="goBack">
					<text class="back-icon" :style="{ color: theme.textColor }">←</text>
				</view>
			</view>
			<view class="header-center">
				<text class="title" :style="{ color: theme.textColor }">{{ categoryName }}</text>
				<text class="subtitle" :style="{ color: theme.secondaryTextColor }">已学习({{ completedCount }}/{{ questions.length }})</text>
			</view>
		</view>

		<!-- 题目列表 -->
		<scroll-view scroll-y class="question-list" refresher-enabled :refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
			<view v-for="question in questions" :key="question.id" class="question-item"
				:style="cardStyle"
				@click="navigateToQuestion(question)">
				<view class="question-info">
					<text class="question-title" :style="{ color: theme.textColor }">{{ question.sort_order }}. {{ question.title }}</text>
					<view class="question-meta">
						<view class="question-tags">
							<view v-if="question.is_favorite" class="tag favorite">
								<text class="icon">★</text>
								<text :style="{ color: theme.textColor }">已收藏</text>
							</view>
							<view v-else class="tag unfavorite">
								<text class="icon">☆</text>
								<text :style="{ color: theme.secondaryTextColor }">未收藏</text>
							</view>
							<view v-if="question.is_learned" class="tag completed">
								<text class="icon">✓</text>
								<text :style="{ color: theme.textColor }">已学习</text>
							</view>
							<view v-else class="tag uncompleted">
								<text class="icon">○</text>
								<text :style="{ color: theme.secondaryTextColor }">未学习</text>
							</view>
						</view>
					</view>
				</view>
				<view class="question-arrow">
					<text class="icon" :style="{ color: theme.secondaryTextColor }">›</text>
				</view>
			</view>

			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading">
				<text :style="{ color: theme.secondaryTextColor }">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-if="!isLoading && questions.length === 0" class="empty">
				<text :style="{ color: theme.secondaryTextColor }">暂无题目数据</text>
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
	import { checkAndInitDB, initTables, importCategoryData, importQuestionMapData } from '@/common/dbInit'
	import { onBackPress } from '@dcloudio/uni-app'
	import { getQuestionsWithStatus, getCategoryProgress } from '@/api/api'
	import useTheme from '@/mixins/themeMixin'

	const { theme, themeStyle, cardStyle } = useTheme()

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
		
		// 使用 switchTab 而不是 navigateBack
		uni.switchTab({
			url: '/pages/study/index',
			success: () => {
				// 确保事件被发送后再关闭页面
				setTimeout(() => {
					uni.navigateBack()
				}, 100)
			}
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
	})

	// 移除页面滚动监听和事件监听
	onUnmounted(() => {
		// 移除题目状态变更事件监听
		uni.$off('questionStatusChanged', handleQuestionStatusChanged)
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
		// 确保类型一致进行比较
		const eventCategoryId = Number(data.categoryId)
		
		// 只有当变更的题目属于当前分类时才刷新
		if (eventCategoryId === categoryId.value) {
			try {
				await loadQuestions()
			} catch (error) {
				console.error('刷新题目列表失败:', error)
				uni.showToast({
					title: '刷新失败',
					icon: 'none'
				})
			}
		}
	}

	// 加载题目列表
	const loadQuestions = async () => {
		try {
			isLoading.value = true
			
			// 获取题目列表
			let result = []
			try {
				result = await getQuestionsWithStatus(categoryId.value)
				
				// 检查是否有数据
				if (result.length === 0) {
					await checkAndInitDB()
					// 重新查询数据
					result = await getQuestionsWithStatus(categoryId.value)
				}
			} catch (error) {
				console.error('查询题目数据失败:', error)
				return
			}
			
			// 处理数据
			questions.value = result.map((item, index) => ({
				id: item.id,
				title: item.title,
				uri: item.uri,
				is_favorite: item.is_favorite,
				is_learned: item.is_learned,
				last_study_time: item.last_study_time,
				sort_order: index + 1 // 添加序号
			}))
			
			// 计算已完成的题目数量
			completedCount.value = questions.value.filter(q => q.is_learned).length
			
		} catch (error) {
			console.error('加载题目失败:', error)
			uni.showToast({
				title: '加载题目失败',
				icon: 'none'
			})
		} finally {
			isLoading.value = false
			isRefreshing.value = false
		}
	}

	// 跳转到题目详情
	const navigateToQuestion = (question) => {
		const index = questions.value.findIndex(q => q.id === question.id)
		const url = `/pages/study/question?id=${question.id}&index=${index}&categoryId=${categoryId.value}&categoryName=${encodeURIComponent(categoryName.value)}`
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
		padding: 40rpx 0;
		transition: background-color 0.3s ease;
	}

	.header {
		padding: 20rpx 30rpx;
		display: flex;
		align-items: center;
		border-bottom: 1rpx solid;
		border-color: var(--border-color);
		position: sticky;
		top: var(--status-bar-height);
		z-index: 100;
		transition: all 0.3s ease;
		margin-bottom: 20rpx;
	}

	.header-left {
		width: 100rpx;
		position: absolute;
		left: 30rpx;
	}

	.header-center {
		flex: 1;
		text-align: center;
		position: relative;
		z-index: 1;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 30rpx;
		background-color: transparent;
		transition: all 0.3s ease;
	}

	.back-icon {
		font-size: 40rpx;
		transition: color 0.3s ease;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		transition: color 0.3s ease;
	}

	.subtitle {
		font-size: 24rpx;
		margin-top: 8rpx;
		display: block;
		transition: color 0.3s ease;
	}

	.question-list {
		height: calc(100vh - 200rpx);
		padding: 20rpx 20rpx 0;
		box-sizing: border-box;
	}

	.question-item {
		padding: 20rpx;
		border-radius: 16rpx;
		margin-bottom: 12rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
	}

	.question-item:active {
		transform: scale(0.98);
		background-color: #fafafa;
	}

	.question-info {
		flex: 1;
		min-width: 0;
	}

	.question-title {
		font-size: 28rpx;
		line-height: 1.6;
		margin-bottom: 8rpx;
		transition: color 0.3s ease;
	}

	.question-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.question-tags {
		display: flex;
		gap: 12rpx;
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 4rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		transition: all 0.3s ease;
	}

	.tag.favorite {
		background-color: rgba(255, 215, 0, 0.1);
	}

	.tag.unfavorite {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.tag.completed {
		background-color: rgba(76, 175, 80, 0.1);
	}

	.tag.uncompleted {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.tag .icon {
		font-size: 24rpx;
	}

	.question-arrow {
		margin-left: 16rpx;
		display: flex;
		align-items: center;
	}

	.question-arrow .icon {
		font-size: 40rpx;
		transition: color 0.3s ease;
	}

	.loading,
	.empty {
		padding: 40rpx 0;
		text-align: center;
		transition: color 0.3s ease;
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