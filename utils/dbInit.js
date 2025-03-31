import db from '@/common/database.js'
import categoryData from '@/static/data/Category.json'
import questionMapData from '@/static/data/question_map.json'
/**
 * 检查表是否存在
 */
async function checkTableExists(tableName) {
    try {
        const result = await db.selectTableDataBySql(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
        )
        return result.length > 0
    } catch (error) {
        console.error(`检查表 ${tableName} 是否存在失败:`, error)
        return false
    }
}

/**
 * 初始化数据库表
 */
async function initTables() {
    try {
        console.log('开始创建表...')
        
        // 删除已存在的表（如果存在）
        await db.executeSql('DROP TABLE IF EXISTS favorites')
        await db.executeSql('DROP TABLE IF EXISTS user_progress')
        await db.executeSql('DROP TABLE IF EXISTS question_map')
        await db.executeSql('DROP TABLE IF EXISTS category')
        console.log('清理旧表成功')
        
        // 创建分类表
        await db.executeSql(`
            CREATE TABLE category (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                create_time TEXT NOT NULL
            )
        `)

        // 创建题目表
        await db.executeSql(`
            CREATE TABLE question_map (
                id INTEGER PRIMARY KEY,
                category_id INTEGER NOT NULL,
                uri TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                answer TEXT,
                sort_order INTEGER NOT NULL,
                create_time TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES category(id)
            )
        `)

        // 创建用户进度表
        await db.executeSql(`
            CREATE TABLE user_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                last_visit_time TEXT NOT NULL,
                create_time TEXT NOT NULL,
                FOREIGN KEY (question_id) REFERENCES question_map(id)
            )
        `)

        // 创建收藏表
        await db.executeSql(`
            CREATE TABLE favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                create_time TEXT NOT NULL,
                FOREIGN KEY (question_id) REFERENCES question_map(id)
            )
        `)

        // 创建索引
        await db.executeSql('CREATE INDEX idx_question_category ON question_map(category_id)')
        await db.executeSql('CREATE INDEX idx_question_uri ON question_map(uri)')
        await db.executeSql('CREATE INDEX idx_question_sort ON question_map(category_id, sort_order)')
        await db.executeSql('CREATE INDEX idx_user_progress_question ON user_progress(question_id)')
        await db.executeSql('CREATE INDEX idx_favorites_question ON favorites(question_id)')

        console.log('数据库表创建成功')
    } catch (error) {
        console.error('创建数据库表失败:', JSON.stringify(error))
        throw error
    }
}

/**
 * 导入分类数据
 */
async function importCategoryData() {
    try {
        // 导入新数据
        for (const category of categoryData) {
            const sql = `
                INSERT INTO category (id, name, create_time)
                VALUES (${category.id}, '${category.name}', '${category.createTime}')
            `
            await db.executeSql(sql)
        }
        
        console.log('分类数据导入成功')
    } catch (error) {
        console.error('导入分类数据失败:', error)
        throw error
    }
}

/**
 * 导入题目数据
 */
async function importQuestionMapData() {
    try {
        // 清空现有数据
        await db.executeSql('DELETE FROM question_map')

        // 导入新数据
        for (const question of questionMapData) {
            const sql = `
                INSERT INTO question_map (id, category_id, uri, title, content, answer, sort_order, create_time)         
                VALUES (${question.id}, ${question.categoryId}, '${question.uri}', '${question.title}', '${question.content}', '${question.answer}', ${question.sortOrder}, '${question.createTime}')
            `
            await db.executeSql(sql)
        }

        console.log('题目数据导入成功')
    } catch (error) {
        console.error('导入题目数据失败:', error)
        throw error
    }
}

/**
 * 导入初始用户进度数据
 */
async function importInitialProgressData() {
    try {
        // 清空现有数据
        await db.executeSql('DELETE FROM user_progress')
        
        // 导入初始数据
        const currentTime = new Date().toISOString()
        const sql = `
            INSERT INTO user_progress (question_id, last_visit_time, create_time)
            VALUES (1, '${currentTime}', '${currentTime}')
        `
        await db.executeSql(sql)
        
        console.log('初始用户进度数据导入成功')
    } catch (error) {
        console.error('导入初始用户进度数据失败:', error)
        throw error
    }
}

/**
 * 导入初始收藏数据
 */
async function importInitialFavoriteData() {
    try {
        // 清空现有数据
        await db.executeSql('DELETE FROM favorites')
        
        // 导入初始数据
        const currentTime = new Date().toISOString()
        const sql = `
            INSERT INTO favorites (question_id, create_time)
            VALUES (1, '${currentTime}')
        `
        await db.executeSql(sql)
        
        console.log('初始收藏数据导入成功')
    } catch (error) {
        console.error('导入初始收藏数据失败:', error)
        throw error
    }
}

/**
 * 检查数据库是否需要初始化
 */
async function checkAndInitDB() {
    try {
        console.log('开始检查数据库初始化...')
        
        // 确保数据库已打开
        if (!db.isOpen()) {
            console.log('数据库未打开，正在打开...')
            await db.open()
            console.log('数据库打开成功')
        }

        // 检查表是否存在
        console.log('检查表是否存在...')
        const categoryExists = await checkTableExists('category')
        const questionMapExists = await checkTableExists('question_map')
        const userProgressExists = await checkTableExists('user_progress')
        const favoritesExists = await checkTableExists('favorites')
        
        console.log('表检查结果:', {
            category: categoryExists,
            questionMap: questionMapExists,
            userProgress: userProgressExists,
            favorites: favoritesExists
        })

        // 如果任何表不存在，重新初始化
        if (!categoryExists || !questionMapExists || !userProgressExists || !favoritesExists) {
            console.log('检测到表不存在，开始初始化...')
            await initTables()
            console.log('表初始化完成')
            
            // 导入数据
            console.log('开始导入数据...')
            await importCategoryData()
            console.log('分类数据导入完成')
            
            await importQuestionMapData()
            console.log('题目数据导入完成')
            
            await importInitialProgressData()
            console.log('用户进度数据导入完成')
            
            await importInitialFavoriteData()
            console.log('收藏数据导入完成')
            
            console.log('所有数据导入完成')
        } else {
            console.log('所有表已存在，无需初始化')
            
            // 检查是否有数据
            const categoryCount = await db.selectTableDataBySql('SELECT COUNT(*) as count FROM category')
            const questionCount = await db.selectTableDataBySql('SELECT COUNT(*) as count FROM question_map')
            
            console.log('数据检查结果:', {
                categoryCount: categoryCount[0].count,
                questionCount: questionCount[0].count
            })
            
            // 如果没有数据，重新导入
            if (categoryCount[0].count === 0 || questionCount[0].count === 0) {
                console.log('检测到数据为空，开始导入数据...')
                await importCategoryData()
                await importQuestionMapData()
                await importInitialProgressData()
                await importInitialFavoriteData()
                console.log('数据导入完成')
            }
        }
        
        console.log('数据库初始化检查完成')
    } catch (error) {
        console.error('数据库初始化失败:', JSON.stringify(error))
        throw error
    }
}

export {
    checkAndInitDB,
    initTables,
    importCategoryData,
    importQuestionMapData,
    importInitialProgressData,
    importInitialFavoriteData
}