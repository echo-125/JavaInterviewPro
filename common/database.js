// 数据库配置
const dbConfig = {
	dbName: 'JavaInterviewPro.db',
	dbPath: '_doc/JavaInterviewPro.db'
}

class Database {
	constructor() {
		this.db = null
	}

	/**
	 * 打开数据库
	 */
	async open() {
		try {
			if (this.db) {
				return this.db
			}

			this.db = await new Promise((resolve, reject) => {
				plus.sqlite.openDatabase({
					name: dbConfig.dbName,
					path: dbConfig.dbPath,
					success: (e) => {
						console.log('数据库打开成功:', e)
						resolve(e)
					},
					fail: (e) => {
						console.error('数据库打开失败:', e)
						reject(e)
					}
				})
			})
			return this.db
		} catch (error) {
			console.error('打开数据库失败:', error)
			throw error
		}
	}

	/**
	 * 关闭数据库
	 */
	async close() {
		try {
			if (this.db) {
				await new Promise((resolve, reject) => {
					plus.sqlite.closeDatabase({
						name: dbConfig.dbName,
						success: resolve,
						fail: reject
					})
				})
				this.db = null
			}
		} catch (error) {
			console.error('关闭数据库失败:', error)
			throw error
		}
	}

	/**
	 * 检查数据库是否打开
	 */
	isOpen() {
		return plus.sqlite.isOpenDatabase({
			name: dbConfig.dbName,
			path: dbConfig.dbPath
		})
	}

	/**
	 * 执行SQL语句
	 */
	async executeSql(sql, params = []) {
		try {
			// 确保数据库已打开
			if (!this.isOpen()) {
				await this.open()
			}

			console.log('执行SQL:', sql, '参数:', params)
			const result = await new Promise((resolve, reject) => {
				plus.sqlite.executeSql({
					name: dbConfig.dbName,
					sql: sql,
					values: params,
					success: (e) => {
						console.log('SQL执行成功:', e)
						resolve(e)
					},
					fail: (e) => {
						console.error('SQL执行失败:', e)
						reject(e)
					}
				})
			})
			return result
		} catch (error) {
			console.error('SQL执行失败:', error)
			// 如果是数据库未打开的错误，尝试重新打开
			if (error.message.includes('Not Open')) {
				await this.open()
				return this.executeSql(sql, params)
			}
			throw error
		}
	}

	/**
	 * 查询数据
	 */
	async selectTableDataBySql(sql, params = []) {
		try {
			// 确保数据库已打开
			if (!this.isOpen()) {
				await this.open()
			}

			console.log('执行查询:', sql, '参数:', params)
			const result = await new Promise((resolve, reject) => {
				plus.sqlite.selectSql({
					name: dbConfig.dbName,
					sql: sql,
					values: params,
					success: resolve,
					fail: reject
				})
			})
			return result
		} catch (error) {
			console.error('查询失败:', error)
			// 如果是数据库未打开的错误，尝试重新打开
			if (error.message.includes('Not Open')) {
				await this.open()
				return this.selectTableDataBySql(sql, params)
			}
			throw error
		}
	}

	/**
	 * @Description: 查询数据库所有表
	 */
	async QueryTables() {
		try {
			// 确保数据库已打开
			if (!this.isOpen()) {
				await this.open()
			}

			const result = await this.selectTableDataBySql("SELECT name FROM sqlite_master WHERE type='table'")
			return result
		} catch (error) {
			console.error('查询数据库表失败:', error)
			throw error
		}
	}
}

export default new Database()