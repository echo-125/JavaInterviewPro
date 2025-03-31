import {
	ref
} from 'vue'

// 数据库配置
const dbConfig = {
	dbName: 'java_interview', // 数据库名称
	dbPath: '_doc/java_interview.db' // 数据库地址
}

// 数据库对象
const db = {
	/**
	 * @Description: 创建数据库 或 有该数据库就打开
	 */
	open() {
		return new Promise((resolve, reject) => {
			// 打开数据库
			plus.sqlite.openDatabase({
				name: dbConfig.dbName,
				path: dbConfig.dbPath,
				success(e) {
					console.log('数据库打开成功:', e)
					resolve(e)
				},
				fail(e) {
					console.error('数据库打开失败:', e)
					reject(e)
				}
			})
		})
	},

	/**
	 * @Description: 判断数据库是否打开
	 */
	isOpen() {
		const isOpen = plus.sqlite.isOpenDatabase({
			name: dbConfig.dbName,
			path: dbConfig.dbPath
		})
		console.log('数据库是否打开:', isOpen)
		return isOpen
	},

	/**
	 * @Description: 执行SQL语句
	 */
	executeSql(sql, values = []) {
		return new Promise((resolve, reject) => {
			console.log('执行SQL:', sql, '参数:', JSON.stringify(values))
			plus.sqlite.executeSql({
				name: dbConfig.dbName,
				sql: sql,
				values: values,
				success(e) {
					console.log('SQL执行成功:', JSON.stringify(e))
					resolve(e)
				},
				fail(e) {
					console.error('SQL执行失败:', JSON.stringify(e))
					reject(e)
				}
			})
		})
	},

	/**
	 * @Description: 查询表数据
	 */
	selectTableDataBySql(sql, values = []) {
		return new Promise((resolve, reject) => {
			//console.log('查询SQL:', sql, '参数:', JSON.stringify(values))
			plus.sqlite.selectSql({
				name: dbConfig.dbName,
				sql: sql,
				values: values,
				success(e) {
					//console.log('查询成功:', JSON.stringify(e))
					resolve(e)
				},
				fail(e) {
					console.error('查询失败:', JSON.stringify(e))
					reject(e)
				}
			})
		})
	},

	/**
	 * @Description: 查询数据库所有表
	 */
	QueryTables() {
		return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: dbConfig.dbName,
				sql: "SELECT name FROM sqlite_master WHERE type='table'",
				success(e) {
					resolve(e)
				},
				fail(e) {
					reject(e)
				}
			})
		})
	},

	/**
	 * @Description: 关闭数据库
	 */
	close() {
		return new Promise((resolve, reject) => {
			plus.sqlite.closeDatabase({
				name: dbConfig.dbName,
				success(e) {
					resolve(e)
				},
				fail(e) {
					reject(e)
				}
			})
		})
	}
}

export default db