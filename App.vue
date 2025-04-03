<script>
import { checkAndInitDB } from '@/common/dbInit.js'

export default {
	onLaunch: async function() {
		try {
			uni.showLoading({
				title: '初始化数据...',
				mask: true
			})
			
			await checkAndInitDB()
			uni.hideLoading()
			
			uni.reLaunch({
				url: '/pages/study/index',
				fail: (err) => {
					console.error('跳转到首页失败:', err)
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					})
				}
			})
		} catch (error) {
			console.error('数据库初始化失败:', error)
			uni.hideLoading()
			uni.showToast({
				title: '数据库初始化失败',
				icon: 'none',
				duration: 2000
			})
		}
	},
	onShow: function() {
		// 可以在这里添加应用显示时的逻辑
	},
	onHide: function() {
		// 可以在这里添加应用隐藏时的逻辑
	}
}
</script>

<style>
	/*每个页面公共css */
	/* 引入图标字体 */
	@font-face {
		font-family: "iconfont";
		src: url('static/fonts/iconfont.woff2') format('woff2'),
			 url('static/fonts/iconfont.woff') format('woff'),
			 url('static/fonts/iconfont.ttf') format('truetype');
	}

	.iconfont {
		font-family: "iconfont" !important;
		font-size: 16px;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.icon-star:before {
		content: "\\e6a9";
	}

	.icon-star-filled:before {
		content: "\\e6aa";
	}

	/* 全局样式 */
	page {
		background-color: #f8f8f8;
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
			Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei',
			sans-serif;
	}
</style>
