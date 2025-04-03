import db from './database'
import categoryData from '@/static/data/Category.json'
import questionMapData from '@/static/data/question_map.json'

// 添加初始化状态锁和初始化完成标志
let isInitializing = false
let isInitialized = false

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
        // 删除已存在的表（如果存在）
        await db.executeSql('DROP TABLE IF EXISTS question_map')
        await db.executeSql('DROP TABLE IF EXISTS category')
        
        // 创建分类表
        await db.executeSql(`
            CREATE TABLE category (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 创建题目表
        await db.executeSql(`
            CREATE TABLE question_map (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uri VARCHAR(255) NOT NULL,
                title VARCHAR(255),
                category_id INTEGER,
                sort_order INTEGER,
                answer TEXT,
                is_favorite BOOLEAN DEFAULT 0,
                favorite_time TIMESTAMP,
                is_learned BOOLEAN DEFAULT 0,
                learn_time TIMESTAMP,
                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES category(id)
            )
        `)

        // 创建索引
        await db.executeSql('CREATE INDEX idx_question_category ON question_map(category_id)')
        await db.executeSql('CREATE INDEX idx_question_uri ON question_map(uri)')
        await db.executeSql('CREATE INDEX idx_question_sort ON question_map(category_id, sort_order)')
    } catch (error) {
        console.error('创建数据库表失败:', error)
        throw error
    }
}

/**
 * 导入分类数据
 */
async function importCategoryData() {
    try {
        for (const category of categoryData) {
            const sql = `
                INSERT INTO category (id, name, create_time)
                VALUES (${category.id}, '${category.name}', '${category.createTime}')
            `
            await db.executeSql(sql)
        }
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
        await db.executeSql('DELETE FROM question_map')

        for (const question of questionMapData) {
            const sql = `
                INSERT INTO question_map (
                    id, category_id, uri, title, answer, sort_order, create_time,
                    is_favorite, favorite_time, is_learned, learn_time
                )         
                VALUES (
                    ${question.id}, 
                    ${question.categoryId}, 
                    '${question.uri}', 
                    '${question.title}', 
                    '${question.answer}', 
                    ${question.sortOrder}, 
                    '${question.createTime}',
                    0,
                    NULL,
                    0,
                    NULL
                )
            `
            await db.executeSql(sql)
        }
    } catch (error) {
        console.error('导入题目数据失败:', error)
        throw error
    }
}

/**
 * 检查数据库是否需要初始化
 */
async function checkAndInitDB() {
    try {
        if (isInitialized) return
        
        if (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100))
            return checkAndInitDB()
        }
        
        isInitializing = true
        
        try {
            if (!db.isOpen()) {
                await db.open()
            }

            const categoryExists = await checkTableExists('category')
            const questionMapExists = await checkTableExists('question_map')

            if (!categoryExists || !questionMapExists) {
                await initTables()
                await importCategoryData()
                await importQuestionMapData()
            } else {
                const categoryCount = await db.selectTableDataBySql('SELECT COUNT(*) as count FROM category')
                const questionCount = await db.selectTableDataBySql('SELECT COUNT(*) as count FROM question_map')
                
                if (categoryCount[0].count === 0 || questionCount[0].count === 0) {
                    await importCategoryData()
                    await importQuestionMapData()
                }
            }
            
            isInitialized = true
        } catch (error) {
            if (error.message.includes('Not Open')) {
                await db.open()
                return checkAndInitDB()
            }
            throw error
        }
    } catch (error) {
        console.error('数据库初始化失败:', error)
        throw error
    } finally {
        isInitializing = false
    }
}

// 在应用启动时初始化数据库
// #ifdef APP-PLUS
plus.globalEvent.addEventListener('plusready', () => {
    checkAndInitDB()
})
// #endif

export {
    checkAndInitDB,
    initTables,
    importCategoryData,
    importQuestionMapData
} 