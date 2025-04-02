<script>
import { checkAndInitDB } from '@/common/dbInit.js'

export default {
	onLaunch: async function() {
		console.log('App Launch')
		try {
			// 显示loading提示
			uni.showLoading({
				title: '正在初始化数据库...',
				mask: true
			})
			
			await checkAndInitDB()
			
			// 隐藏loading提示
			uni.hideLoading()
			
			// 数据库初始化完成后，跳转到首页
			uni.reLaunch({
				url: '/pages/study/index'
			})
		} catch (error) {
			console.error('数据库初始化失败:', JSON.stringify(error))
			uni.hideLoading()
			uni.showToast({
				title: '数据库初始化失败',
				icon: 'none'
			})
		}
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
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
