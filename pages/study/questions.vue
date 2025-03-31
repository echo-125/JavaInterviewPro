<template>
	<view class="container">
		<!-- 顶部标题栏 -->
		<view class="header">
			<text class="title">{{ categoryName }}</text>
			<text class="subtitle">{{ questions.length }}题</text>
		</view>

		<!-- 题目列表 -->
		<scroll-view scroll-y class="question-list" refresher-enabled :refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh">
			<view v-for="question in questions" :key="question.id" class="question-item"
				@click="navigateToQuestion(question)">
				<view class="question-info">
					<text class="question-title">{{ question.title }}</text>
					<view class="question-meta">
						<text class="question-desc">{{ question.content || '暂无描述' }}</text>
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
		onMounted
	} from 'vue'
	import db from '@/common/database'

	const categoryId = ref('')
	const categoryName = ref('')
	const questions = ref([])
	const isLoading = ref(false)
	const isRefreshing = ref(false)

	// 加载题目列表
	const loadQuestions = async () => {
		try {
			isLoading.value = true
			
			// 获取题目列表
			const sql = `
				SELECT q.*, 
					CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite,
					up.last_visit_time
				FROM question_map q
				LEFT JOIN favorites f ON q.id = f.question_id
				LEFT JOIN user_progress up ON q.id = up.question_id
				WHERE q.category_id = ?
				ORDER BY q.sort_order ASC
			`
			
			console.log('执行SQL查询:', sql)
			console.log('查询参数:', [categoryId.value])
			
			const result = await db.selectTableDataBySql(sql, [categoryId.value])
			console.log('原始查询结果:', result)
			
			// 检查question_map表中是否有数据
			const checkSql = 'SELECT COUNT(*) as count FROM question_map WHERE category_id = ?'
			const checkResult = await db.selectTableDataBySql(checkSql, [categoryId.value])
			console.log('题目数量检查:', checkResult)
			
			questions.value = result.map(item => ({
				...item,
				content: item.content ? item.content.substring(0, 100) + '...' : '暂无描述'
			}))
			
			console.log('处理后的题目列表:', questions.value)
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
		console.log('触发下拉刷新')
		isRefreshing.value = true
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
		
		categoryId.value = id
		categoryName.value = decodeURIComponent(name)
		
		// 加载题目列表
		loadQuestions()
	})
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #f8f8f8;
	}

	.header {
		background-color: #fff;
		padding: 30rpx;
		text-align: center;
		border-bottom: 1rpx solid #eee;
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
	}

	.question-item {
		background-color: #fff;
		padding: 30rpx;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		display: flex;
		align-items: flex-start;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.question-info {
		flex: 1;
		margin-right: 20rpx;
	}

	.question-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
		display: block;
		line-height: 1.4;
	}

	.question-meta {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.question-desc {
		font-size: 26rpx;
		color: #666;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.question-tags {
		display: flex;
		gap: 12rpx;
	}

	.tag {
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		border-radius: 4rpx;
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
		font-size: 32rpx;
		color: #999;
		padding-top: 8rpx;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 40rpx;
		color: #999;
		font-size: 28rpx;
	}
</style>