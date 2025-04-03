class AudioPlayer {
  constructor() {
    this.audioContext = null
    this.isPlaying = false
    this.progress = 0
    this.currentTime = 0
    this.duration = 0
    this.progressTimer = null
    this.onStateChange = null
  }

  // 设置状态变化回调
  setStateChangeCallback(callback) {
    this.onStateChange = callback
  }

  // 更新状态并通知
  updateState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        progress: this.progress,
        currentTime: this.currentTime,
        duration: this.duration
      })
    }
  }

  // 初始化音频上下文
  init() {
    // 如果已经存在，先销毁
    if (this.audioContext) {
      this.destroy()
    }
    
    this.audioContext = uni.createInnerAudioContext()
    
    // 监听播放开始
    this.audioContext.onPlay(() => {
      this.isPlaying = true
      this.progressTimer = setInterval(() => this.updateProgress(), 100)
      this.updateState()
    })
    
    // 监听播放结束
    this.audioContext.onEnded(() => {
      this.isPlaying = false
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
      this.progress = 0
      this.currentTime = 0
      this.updateState()
    })
    
    // 监听播放错误
    this.audioContext.onError((res) => {
      console.error('音频播放错误:', res)
      this.isPlaying = false
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
      this.progress = 0
      this.currentTime = 0
      this.updateState()
      uni.showToast({
        title: '音频播放失败',
        icon: 'none'
      })
    })
  }

  // 更新进度
  updateProgress() {
    if (this.audioContext && this.isPlaying) {
      this.currentTime = this.audioContext.currentTime
      this.duration = this.audioContext.duration
      this.progress = (this.currentTime / this.duration) * 100
      this.updateState()
    }
  }

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 检查音频文件是否存在
  async checkAudioFile(path) {
    return new Promise((resolve) => {
      uni.getFileInfo({
        filePath: path,
        success: () => resolve(true),
        fail: () => {
          const sourcePath = path
          const destPath = `${uni.env.USER_DATA_PATH}${path}`
          
          uni.copyFile({
            srcPath: sourcePath,
            destPath: destPath,
            success: () => resolve(true),
            fail: () => resolve(false)
          })
        }
      })
    })
  }

  // 切换播放状态
  async togglePlay(audioPath) {
    if (!audioPath) {
      uni.showToast({
        title: '暂无音频文件',
        icon: 'none'
      })
      return
    }

    try {
      // 确保 audioContext 已初始化
      if (!this.audioContext) {
        this.init()
      }

      if (this.isPlaying) {
        this.audioContext.stop()
        this.isPlaying = false
        this.updateState()
      } else {
        const exists = await this.checkAudioFile(audioPath)
        if (!exists) {
          uni.showToast({
            title: '音频文件不存在',
            icon: 'none'
          })
          return
        }

        this.audioContext.src = audioPath
        this.audioContext.play()
      }
    } catch (error) {
      console.error('播放操作失败:', error)
      uni.showToast({
        title: '播放操作失败',
        icon: 'none'
      })
    }
  }

  // 停止播放
  stop() {
    if (this.isPlaying && this.audioContext) {
      this.audioContext.stop()
      this.isPlaying = false
      if (this.progressTimer) {
        clearInterval(this.progressTimer)
        this.progressTimer = null
      }
      this.progress = 0
      this.currentTime = 0
      this.updateState()
    }
  }

  // 销毁
  destroy() {
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
    this.isPlaying = false
    this.progress = 0
    this.currentTime = 0
    this.duration = 0
  }
}

export default new AudioPlayer() 