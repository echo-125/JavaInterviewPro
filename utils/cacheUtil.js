/**
 * 缓存工具类
 */
class CacheUtil {
  /**
   * 清除应用缓存
   * @returns {Promise<boolean>} 是否清除成功
   */
  static clearCache() {
    return new Promise((resolve, reject) => {
      try {
        plus.cache.clear(
          () => {
            resolve(true)
          },
          (error) => {
            console.error('清除缓存失败:', error)
            reject(error)
          }
        )
      } catch (error) {
        console.error('清除缓存失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取缓存大小
   * @returns {Promise<number>} 缓存大小（字节）
   */
  static getCacheSize() {
    return new Promise((resolve, reject) => {
      try {
        plus.cache.calculate(
          (size) => {
            resolve(size)
          },
          (error) => {
            console.error('获取缓存大小失败:', error)
            reject(error)
          }
        )
      } catch (error) {
        console.error('获取缓存大小失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 格式化缓存大小
   * @param {number} bytes 字节数
   * @returns {string} 格式化后的缓存大小
   */
  static formatCacheSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default CacheUtil 