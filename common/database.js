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
			console.log('查询SQL:', sql, '参数:', JSON.stringify(values))
			plus.sqlite.selectSql({
				name: dbConfig.dbName,
				sql: sql,
				values: values,
				success(e) {
					console.log('查询成功:', JSON.stringify(e))
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
	},

	/**
	 * @Description: 初始化数据库
	 */
	async initDatabase() {
		try {
			console.log('开始初始化数据库...')
			if (!this.isOpen()) {
				console.log('数据库未打开，创建并初始化...')
				await this.open()
			}
			
			// 检查表结构
			const tables = await this.QueryTables()
			console.log('当前数据库中的表:', JSON.stringify(tables))
			
			// 检查是否已创建必要的表
			const requiredTables = ['category', 'question_map', 'user_progress', 'favorites']
			const existingTables = tables.map(table => table.name)
			const missingTables = requiredTables.filter(table => !existingTables.includes(table))
			
			if (missingTables.length > 0) {
				console.log('缺少必要的表，开始创建表...')
				await this.createTables()
			} else {
				// 检查是否需要插入测试数据
				try {
					const categoryCount = await this.selectTableDataBySql('SELECT COUNT(*) as count FROM category')
					console.log('当前分类数量:', categoryCount[0].count)
					if (categoryCount[0].count === 0) {
						console.log('开始插入测试数据...')
						await this.insertTestData()
					}
				} catch (error) {
					console.error('检查分类数量失败:', error)
					// 如果查询失败，可能是表结构有问题，重新创建表
					console.log('重新创建表...')
					await this.createTables()
				}
			}
			
			return true
		} catch (error) {
			console.error('初始化数据库失败:', JSON.stringify(error))
			return false
		}
	},

	/**
	 * @Description: 创建表
	 */
	async createTables() {
		try {
			console.log('开始创建表...')
			
			// 删除已存在的表（如果存在）
			await this.executeSql('DROP TABLE IF EXISTS favorites')
			await this.executeSql('DROP TABLE IF EXISTS user_progress')
			await this.executeSql('DROP TABLE IF EXISTS question_map')
			await this.executeSql('DROP TABLE IF EXISTS category')
			console.log('清理旧表成功')
			
			// 创建类别表
			await this.executeSql(`
				CREATE TABLE category (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name VARCHAR(50) NOT NULL,
					create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`)
			console.log('类别表创建成功')

			// 创建题目映射表
			await this.executeSql(`
				CREATE TABLE question_map (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					uri VARCHAR(255) NOT NULL,
					title VARCHAR(255),
					category_id INTEGER,
					sort_order INTEGER,
					content TEXT,
					answer TEXT,
					last_study_time TIMESTAMP,
					create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (category_id) REFERENCES category(id)
				)
			`)
			console.log('题目映射表创建成功')

			// 创建用户进度表
			await this.executeSql(`
				CREATE TABLE user_progress (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					question_id INTEGER,
					last_visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (question_id) REFERENCES question_map(id)
				)
			`)
			console.log('用户进度表创建成功')

			// 创建收藏表
			await this.executeSql(`
				CREATE TABLE favorites (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					question_id INTEGER,
					create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (question_id) REFERENCES question_map(id)
				)
			`)
			console.log('收藏表创建成功')

			// 创建索引
			await this.executeSql('CREATE INDEX idx_question_category ON question_map(category_id)')
			await this.executeSql('CREATE INDEX idx_question_uri ON question_map(uri)')
			await this.executeSql('CREATE INDEX idx_question_sort ON question_map(category_id, sort_order)')
			await this.executeSql('CREATE INDEX idx_user_progress_question ON user_progress(question_id)')
			await this.executeSql('CREATE INDEX idx_favorites_question ON favorites(question_id)')
			console.log('索引创建成功')
			
			console.log('所有表创建成功')
			
			// 插入测试数据
			console.log('开始插入测试数据...')
			await this.insertTestData()
			console.log('测试数据插入成功')
			
			return true
		} catch (error) {
			console.error('创建表失败:', JSON.stringify(error))
			throw error
		}
	},

	/**
	 * @Description: 插入测试数据
	 */
	async insertTestData() {
		try {
			console.log('开始插入测试数据...')
			
			// 插入分类数据
			const categories = [
				{ name: 'Java基础' },
				{ name: 'Java高级' },
				{ name: 'Spring框架' },
				{ name: '数据库' }
			]

			for (const category of categories) {
				const result = await this.executeSql(
					'INSERT INTO category (name) VALUES ("' + category.name + '")'
				)
				console.log('插入分类:', category.name, '结果:', JSON.stringify(result))
			}

			// 插入题目数据
			const questions = [
				{
					uri: 'https://zha-ge.cn/1',
					title: 'Java中的基本数据类型有哪些？',
					category_id: 1,
					sort_order: 1,
					content: '请列举Java中的基本数据类型及其占用字节数。',
					answer: 'Java中有8种基本数据类型：\n1. byte: 1字节\n2. short: 2字节\n3. int: 4字节\n4. long: 8字节\n5. float: 4字节\n6. double: 8字节\n7. char: 2字节\n8. boolean: 1字节'
				},
				{
					uri: 'https://zha-ge.cn/2',
					title: '什么是Java？',
					category_id: 1,
					sort_order: 2,
					content: '请解释Java编程语言的特点。',
					answer: 'Java是一种面向对象的编程语言，具有以下特点：\n1. 跨平台性\n2. 面向对象\n3. 安全性\n4. 多线程\n5. 动态性'
				},
				{
					uri: 'https://zha-ge.cn/3',
					title: '什么是Spring框架？',
					category_id: 3,
					sort_order: 1,
					content: '请介绍Spring框架的主要特性。',
					answer: 'Spring是一个轻量级的Java开发框架，主要特性包括：\n1. 依赖注入\n2. 面向切面编程\n3. 声明式事务\n4. 集成其他框架'
				}
			]

			for (const question of questions) {
				const result = await this.executeSql(
					`INSERT INTO question_map (uri, title, category_id, sort_order, content, answer) 
					VALUES ("${question.uri}", "${question.title}", ${question.category_id}, ${question.sort_order}, "${question.content}", "${question.answer}")`
				)
				console.log('插入题目:', question.title, '结果:', JSON.stringify(result))
			}

			// 插入一些用户进度数据
			const progressData = [
				{ question_id: 1, last_visit_time: new Date().toISOString() },
				{ question_id: 2, last_visit_time: new Date().toISOString() }
			]

			for (const progress of progressData) {
				const result = await this.executeSql(
					`INSERT INTO user_progress (question_id, last_visit_time) 
					VALUES (${progress.question_id}, "${progress.last_visit_time}")`
				)
				console.log('插入进度:', JSON.stringify(progress), '结果:', JSON.stringify(result))
			}

			// 插入一些收藏数据
			const favoritesData = [
				{ question_id: 1 },
				{ question_id: 3 }
			]

			for (const favorite of favoritesData) {
				const result = await this.executeSql(
					`INSERT INTO favorites (question_id) VALUES (${favorite.question_id})`
				)
				console.log('插入收藏:', JSON.stringify(favorite), '结果:', JSON.stringify(result))
			}

			console.log('测试数据插入成功')
			return true
		} catch (error) {
			console.error('插入测试数据失败:', JSON.stringify(error))
			throw error
		}
	}
}

export default db