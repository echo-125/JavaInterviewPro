<template>
	<view class="container">
		<view class="header">
			<text class="title">Java面试题大全</text>
		</view>
		
		<view class="category-list">
			<view v-for="category in categories" :key="category.id" 
					class="category-item" @click="navigateToQuestionList(category)">
				<view class="category-name">{{ category.name }}</view>
				<view class="progress-info">
					<text>已学习 {{ category.completed }}/{{ category.total }} 题</text>
					<progress :percent="(category.completed/category.total)*100" 
							 stroke-width="3" color="#007AFF" />
				</view>
			</view>
		</view>

		<view class="continue-section" v-if="lastQuestion" @click="continueLastQuestion">
			<text>继续上次学习</text>
			<text class="last-question-title">{{ lastQuestion.title }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/common/database'

const categories = ref([])
const lastQuestion = ref(null)

// 加载分类列表
const loadCategories = async () => {
	try {
		// 检查数据库表是否存在
		const tables = await db.QueryTables()
		if (!tables.some(table => table.name === 'category')) {
			console.log('category表不存在')
			return
		}
		
		// 查询分类列表
		const sql = `
			SELECT c.*, 
				   COUNT(q.id) as count,
				   ROUND(COUNT(CASE WHEN q.is_favorite = 1 THEN 1 END) * 100.0 / COUNT(*), 1) as progress
			FROM category c
			LEFT JOIN question_map q ON c.id = q.category_id
			GROUP BY c.id
			ORDER BY c.sort_order
		`
		
		const result = await db.selectTableDataBySql(sql)
		categories.value = result
		console.log('分类列表:', categories.value)
	} catch (error) {
		console.error('加载分类失败:', error)
	}
}

// 加载上次学习的题目
const loadLastQuestion = async () => {
	try {
		// 检查数据库表是否存在
		const tables = await db.QueryTables()
		if (!tables.some(table => table.name === 'question_map')) {
			console.log('question_map表不存在')
			return
		}
		
		// 查询最后一条收藏的题目
		const sql = `
			SELECT q.*, c.name as category_name
			FROM question_map q
			LEFT JOIN category c ON q.category_id = c.id
			WHERE q.is_favorite = 1
			ORDER BY q.last_study_time DESC
			LIMIT 1
		`
		
		const result = await db.selectTableDataBySql(sql)
		if (result && result.length > 0) {
			lastQuestion.value = result[0]
			console.log('上次学习:', lastQuestion.value)
		}
	} catch (error) {
		console.error('加载上次学习失败:', error)
	}
}

// 跳转到分类页面
const navigateToCategory = (category) => {
	uni.navigateTo({
		url: '/pages/study/category?id=' + category.id
	})
}

// 跳转到题目详情
const navigateToQuestion = (question) => {
	uni.navigateTo({
		url: '/pages/question/detail?id=' + question.id
	})
}

// 导航到题目列表页
const navigateToQuestionList = (category) => {
	uni.navigateTo({
		url: '/pages/questionList/questionList?categoryId='+category.id
	})
}

// 继续上次学习
const continueLastQuestion = () => {
	if (lastQuestion.value) {
		uni.navigateTo({
			url: 'pages/question/question?id='+lastQuestion.value.id
		})
	}
}

onMounted(() => {
	loadCategories()
	loadLastQuestion()
})
</script>

<style>
	.container {
		padding: 20rpx;
	}

	.header {
		padding: 30rpx 0;
		text-align: center;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
	}

	.category-list {
		margin-top: 20rpx;
	}

	.category-item {
		background-color: #fff;
		border-radius: 12rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}

	.category-name {
		font-size: 32rpx;
		font-weight: 500;
		margin-bottom: 10rpx;
	}

	.progress-info {
		font-size: 24rpx;
		color: #666;
	}

	.continue-section {
		margin-top: 40rpx;
		background-color: #f8f8f8;
		padding: 20rpx;
		border-radius: 12rpx;
		text-align: center;
	}

	.last-question-title {
		display: block;
		margin-top: 10rpx;
		font-size: 28rpx;
		color: #666;
	}
</style>
