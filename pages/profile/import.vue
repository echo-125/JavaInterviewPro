<template>
  <view class="container" :style="themeStyle">
    <view class="import-options">
      <view class="option-card" :style="cardStyle" @click="importFromUrl">
        <view class="option-icon">🌐</view>
        <view class="option-content">
          <text class="option-title" :style="{ color: theme.textColor }">从URL导入</text>
          <text class="option-desc" :style="{ color: theme.secondaryTextColor }">输入题库JSON文件的URL地址</text>
        </view>
        <text class="option-arrow" :style="{ color: theme.secondaryTextColor }">></text>
      </view>

      <view class="option-card" :style="cardStyle" @click="importFromFile">
        <view class="option-icon">📁</view>
        <view class="option-content">
          <text class="option-title" :style="{ color: theme.textColor }">从文件导入</text>
          <text class="option-desc" :style="{ color: theme.secondaryTextColor }">选择本地题库JSON文件</text>
        </view>
        <text class="option-arrow" :style="{ color: theme.secondaryTextColor }">></text>
      </view>
    </view>

    <view class="format-tip" :style="cardStyle">
      <text class="tip-content" :style="{ color: theme.secondaryTextColor }">
        导入的JSON文件需要符合以下格式：
        1. 必须包含categories和questions两个数组
        2. categories数组中的每个对象必须包含id、name、create_time字段
        3. questions数组中的每个对象必须包含id、uri、title、category_id、sort_order、answer、is_favorite、is_learned、create_time字段
        4. 建议先备份当前数据
      </text>
      <view class="json-example" :style="{ color: theme.secondaryTextColor }">
        <pre class="example-code">
{
  "categories": [{
    "id": 1,
    "name": "Java基础必问",
    "create_time": "2025-03-29 18:35:04"
  }],
  "questions": [{
    "id": 1,
    "uri": "详情链接",
    "title": "问题标题",
    "category_id": 1,
    "sort_order": 1,
    "answer": "问题答案",
    "is_favorite": false,
    "is_learned": false,
    "create_time": "2025-03-29 18:35:04"
  }]
}
        </pre>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import useTheme from '@/mixins/themeMixin'

const { theme, themeStyle, cardStyle } = useTheme()

// 从URL导入
const importFromUrl = () => {
  uni.showModal({
    title: '提示',
    content: '该功能正在开发中，敬请期待！',
    showCancel: false
  })
}

// 从文件导入
const importFromFile = () => {
  uni.showModal({
    title: '提示',
    content: '该功能正在开发中，敬请期待！',
    showCancel: false
  })
}
</script>

<style>
.container {
  min-height: 100vh;
  padding: 20rpx;
  padding-top: 40rpx;
}

.import-options {
  margin-bottom: 30rpx;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
}

.option-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.option-desc {
  font-size: 24rpx;
}

.option-arrow {
  font-size: 32rpx;
}

.format-tip {
  padding: 30rpx;
  border-radius: 16rpx;
}

.tip-content {
  font-size: 28rpx;
  line-height: 1.6;
}

.json-example {
  margin-top: 20rpx;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 20rpx;
  border-radius: 8rpx;
  overflow-x: auto;
}

.example-code {
  font-size: 24rpx;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
  margin: 0;
  padding: 0;
}
</style> 