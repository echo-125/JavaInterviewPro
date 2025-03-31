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
				<text class="subtitle">{{ questions.length }}题</text>
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
							<text v-if="question.is_favorite" class="tag favorite">已收藏</text>
							<text v-if="question.last_visit_time" class="tag completed">已完成</text>
						</view>
					</view>
				</view>
				<view class="question-arrow">></view>
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
	import { checkAndInitDB, initTables, importCategoryData, importQuestionMapData, importInitialProgressData, importInitialFavoriteData } from '@/utils/dbInit'
	import { onBackPress } from '@dcloudio/uni-app'

	// 页面配置
	defineOptions({
		navigationStyle: 'custom'
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

	// 页面显示时恢复滚动位置
	const onShow = () => {
		const route = '/pages/study/index'
		const saved = uni.$store?.scrollPositions?.[route]
		if (saved !== undefined) {
			uni.pageScrollTo({
				scrollTop: saved,
				duration: 0
			})
		}
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
	})

	// 移除页面滚动监听
	onUnmounted(() => {
		// 不需要移除监听，因为onPageScroll是生命周期函数
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

	// 加载题目列表
	const loadQuestions = async () => {
		try {
			isLoading.value = true
			
			// 确保数据库已初始化
			await checkAndInitDB()
			
			// 检查question_map表中是否有数据
			const checkSql = 'SELECT COUNT(*) as count FROM question_map'
			const checkResult = await db.selectTableDataBySql(checkSql)
			
			// 如果没有数据，重新初始化数据库
			if (checkResult[0].count === 0) {
				await initTables()
				await importCategoryData()
				await importQuestionMapData()
				await importInitialProgressData()
				await importInitialFavoriteData()
			}
			
			// 获取题目列表
			const sql = `
				SELECT q.id, q.title, q.sort_order
				FROM question_map q
				WHERE q.category_id = ${categoryId.value}
				ORDER BY q.sort_order ASC
			`
			
			let result = await db.selectTableDataBySql(sql)
			
			// 如果基本查询有结果，再查询收藏和进度信息
			if (result && result.length > 0) {
				const questionIds = result.map(q => q.id)
				
				// 查询收藏信息
				const favoriteSql = 'SELECT question_id FROM favorites WHERE question_id IN (' + questionIds.join(',') + ')'
				const favoriteResult = await db.selectTableDataBySql(favoriteSql)
				
				// 查询进度信息
				const progressSql = 'SELECT question_id, last_visit_time FROM user_progress WHERE question_id IN (' + questionIds.join(',') + ')'
				const progressResult = await db.selectTableDataBySql(progressSql)
				
				// 合并数据
				const favoriteSet = new Set(favoriteResult.map(f => f.question_id))
				const progressMap = new Map(progressResult.map(p => [p.question_id, p.last_visit_time]))
				
				questions.value = result.map(item => ({
					...item,
					is_favorite: favoriteSet.has(item.id) ? 1 : 0,
					last_visit_time: progressMap.get(item.id)
				}))
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
			isRefreshing.value = false
		}
	}

	// 跳转到题目详情
	const navigateToQuestion = (question) => {
		uni.navigateTo({
			url: `/pages/study/question?id=${question.id}&categoryId=${categoryId.value}&categoryName=${encodeURIComponent(categoryName.value)}`
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
	}

	.header {
		background-color: #fff;
		padding: 20rpx 30rpx;
		display: flex;
		align-items: center;
		border-bottom: 1rpx solid #eee;
		position: sticky;
		top: 0;
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
		margin-top: 10rpx;
		display: block;
	}

	.question-list {
		height: calc(100vh - 180rpx);
		padding: 20rpx;
		box-sizing: border-box;
	}

	.question-item {
		background-color: #fff;
		padding: 24rpx;
		border-radius: 16rpx;
		margin-bottom: 16rpx;
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
		margin-right: 16rpx;
	}

	.question-title {
		font-size: 30rpx;
		color: #333;
		line-height: 1.5;
		display: block;
	}

	.question-meta {
		margin-top: 12rpx;
	}

	.question-tags {
		display: flex;
		gap: 8rpx;
	}

	.tag {
		font-size: 20rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;
	}

	.tag.favorite {
		background-color: #fff3e0;
		color: #ff9800;
	}

	.tag.completed {
		background-color: #e8f5e9;
		color: #4caf50;
	}

	.question-arrow {
		font-size: 28rpx;
		color: #ccc;
		padding: 0 8rpx;
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