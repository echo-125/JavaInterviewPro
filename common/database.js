// 数据库配置
const dbConfig = {
	dbName: 'JavaInterviewPro.db',
	dbPath: '_doc/JavaInterviewPro.db'
}

class Database {
	constructor() {
		this.db = null
		this.isOpening = false
	}

	/**
	 * 打开数据库
	 */
	async open() {
		try {
			if (this.isOpening) {
				await new Promise(resolve => setTimeout(resolve, 100))
				return this.open()
			}

			if (this.isOpen()) {
				return this.db
			}

			this.isOpening = true
			this.db = await new Promise((resolve, reject) => {
				plus.sqlite.openDatabase({
					name: dbConfig.dbName,
					path: dbConfig.dbPath,
					success: resolve,
					fail: reject
				})
			})
			return this.db
		} catch (error) {
			if (error.code === -1402) {
				// 数据库已经打开，返回现有连接
				return this.db
			}
			throw error
		} finally {
			this.isOpening = false
		}
	}

	/**
	 * 关闭数据库
	 */
	async close() {
		try {
			if (this.db && this.isOpen()) {
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
			if (error.code === -1401) {
				// 数据库未打开，忽略错误
				return
			}
			throw error
		}
	}

	/**
	 * 检查数据库是否打开
	 */
	isOpen() {
		try {
			return plus.sqlite.isOpenDatabase({
				name: dbConfig.dbName,
				path: dbConfig.dbPath
			})
		} catch (error) {
			return false
		}
	}

	/**
	 * 执行SQL语句
	 */
	async executeSql(sql, params = []) {
		try {
			if (!this.isOpen()) {
				await this.open()
			}

			const result = await new Promise((resolve, reject) => {
				plus.sqlite.executeSql({
					name: dbConfig.dbName,
					sql: sql,
					values: params,
					success: resolve,
					fail: reject
				})
			})
			return result
		} catch (error) {
			if (error.code === -1401) {
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
			if (!this.isOpen()) {
				await this.open()
			}

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
			if (error.code === -1401) {
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
			if (!this.isOpen()) {
				await this.open()
			}
			return await this.selectTableDataBySql("SELECT name FROM sqlite_master WHERE type='table'")
		} catch (error) {
			throw error
		}
	}
}

export default new Database()