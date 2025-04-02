// TTS语音播放模块
class TTSManager {
  constructor() {
    this.isPlaying = false
    this.isSupported = false
    console.log('TTSManager 构造函数被调用')
  }

  // 检查是否支持TTS
  checkSupport() {
    console.log('开始检查TTS支持状态')
    // #ifdef APP-PLUS
    try {
      console.log('plus对象:', plus)
      console.log('plus.speech对象:', plus.speech)
      
      if (plus.speech && plus.speech.TTS) {
        this.isSupported = true
        console.log('TTS模块可用')
        return true
      } else {
        this.isSupported = false
        console.warn('当前平台不支持TTS')
        return false
      }
    } catch (error) {
      console.error('TTS初始化失败:', error)
      this.isSupported = false
      return false
    }
    // #endif
    return false
  }

  // 播放文本
  speak(text) {
    if (!text) return
    
    // #ifdef APP-PLUS
    if (!this.isSupported) {
      console.log('TTS未初始化，尝试初始化')
      if (!this.checkSupport()) {
        uni.showModal({
          title: '提示',
          content: '请检查系统TTS设置和中文语音包',
          success: (res) => {
            if (res.confirm) {
              // 跳转到系统TTS设置页面
              plus.runtime.openURL('intent:#Intent;action=com.android.settings.TTS_SETTINGS;end')
            }
          }
        })
        return
      }
    }

    try {
      // 移除HTML标签
      const cleanText = text.replace(/<[^>]+>/g, '')
      console.log('准备播放文本:', cleanText)
      
      plus.speech.TTS.speak({
        content: cleanText,
        lang: 'zh-CN',
        pitch: 1,
        rate: 1,
        volume: 1,
        success: () => {
          this.isPlaying = true
          console.log('开始播放')
        },
        fail: (error) => {
          console.error('语音播放失败:', error)
          uni.showToast({
            title: '播放失败',
            icon: 'none'
          })
        },
        complete: () => {
          this.isPlaying = false
          console.log('播放完成')
        }
      })
    } catch (error) {
      console.error('语音播放异常:', error)
      uni.showToast({
        title: '播放失败',
        icon: 'none'
      })
    }
    // #endif
  }

  // 停止播放
  stop() {
    // #ifdef APP-PLUS
    if (this.isSupported) {
      plus.speech.TTS.stop()
      this.isPlaying = false
    }
    // #endif
  }

  // 获取播放状态
  getPlayingStatus() {
    return this.isPlaying
  }
}

// 创建单例实例
const ttsManager = new TTSManager()

// 在应用启动时初始化
// #ifdef APP-PLUS
uni.onAppShow(() => {
  console.log('应用显示，初始化TTS')
  ttsManager.checkSupport()
})

// 如果plus对象已存在，直接检查
if (plus) {
  console.log('plus对象已存在，直接初始化TTS')
  ttsManager.checkSupport()
}
// #endif

export default ttsManager 