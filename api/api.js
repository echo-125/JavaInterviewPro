import db from '@/common/database.js'

/**
 * 打开数据库连接
 */
async function openDB() {
    if (!db.isOpen()) {
        await db.open()
    }
}

/**
 * 关闭数据库连接
 */
async function closeDB() {
    if (db.isOpen()) {
        await db.close()
    }
}

/**
 * 获取所有分类列表
 * @returns {Promise<Array>} 返回分类列表，包含每个分类的完成进度
 */
export async function getCategories() {
    await openDB()
    try {
        // 查询所有分类及其完成进度
        const sql = `
            SELECT 
                c.id,
                c.name,
                COUNT(q.id) as questionCount,
                COUNT(up.id) as completedCount
            FROM category c
            LEFT JOIN question_map q ON c.id = q.category_id
            LEFT JOIN user_progress up ON q.id = up.question_id
            GROUP BY c.id
            ORDER BY c.create_time
        `
        const result = await db.selectTableDataBySql(sql)
        return result
    } catch (error) {
        console.error('获取分类列表失败:', error)
        return []
    } finally {
        await closeDB()
    }
}

/**
 * 获取指定分类下的所有题目
 * @param {number} categoryId 分类ID
 * @returns {Promise<Array>} 返回题目列表，包含完成状态和收藏状态
 */
export async function getQuestionsByCategory(categoryId) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.id,
                q.uri,
                q.title,
                q.sort_order,
                CASE WHEN up.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
                CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite,
                up.last_visit_time
            FROM question_map q
            LEFT JOIN user_progress up ON q.id = up.question_id
            LEFT JOIN favorites f ON q.id = f.question_id
            WHERE q.category_id = ${categoryId}
            ORDER BY q.sort_order
        `
        const result = await db.selectTableDataBySql(sql)
        return result
    } catch (error) {
        console.error('获取题目列表失败:', error)
        return []
    } finally {
        await closeDB()
    }
}

/**
 * 获取题目详情
 * @param {number} questionId 题目ID
 * @returns {Promise<Object>} 返回题目详情
 */
export async function getQuestionDetail(questionId) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.*,
                CASE WHEN up.id IS NOT NULL THEN 1 ELSE 0 END as is_completed,
                CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite,
                up.last_visit_time
            FROM question_map q
            LEFT JOIN user_progress up ON q.id = up.question_id
            LEFT JOIN favorites f ON q.id = f.question_id
            WHERE q.id = ${questionId}
        `
        const result = await db.selectTableDataBySql(sql)
        return result[0] || null
    } catch (error) {
        console.error('获取题目详情失败:', error)
        return null
    } finally {
        await closeDB()
    }
}

/**
 * 获取上一题/下一题
 * @param {number} currentId 当前题目ID
 * @param {number} categoryId 分类ID
 * @param {string} direction 方向：'prev' 或 'next'
 * @returns {Promise<Object>} 返回上一题或下一题的信息
 */
export async function getAdjacentQuestion(currentId, categoryId, direction) {
    await openDB()
    try {
        const operator = direction === 'prev' ? '<' : '>'
        const order = direction === 'prev' ? 'DESC' : 'ASC'
        
        const sql = `
            SELECT q.id, q.title
            FROM question_map q
            WHERE q.category_id = ${categoryId}
            AND q.sort_order ${operator} (
                SELECT sort_order 
                FROM question_map 
                WHERE id = ${currentId}
            )
            ORDER BY q.sort_order ${order}
            LIMIT 1
        `
        const result = await db.selectTableDataBySql(sql)
        return result[0] || null
    } catch (error) {
        console.error('获取相邻题目失败:', error)
        return null
    } finally {
        await closeDB()
    }
}

/**
 * 更新用户进度
 * @param {number} questionId 题目ID
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateProgress(questionId) {
    await openDB()
    try {
        // 检查是否已存在进度记录
        const checkSql = `SELECT id FROM user_progress WHERE question_id = ${questionId}`
        const existing = await db.selectTableDataBySql(checkSql)
        
        if (existing.length > 0) {
            // 更新现有记录
            const updateSql = `
                UPDATE user_progress 
                SET last_visit_time = CURRENT_TIMESTAMP 
                WHERE question_id = ${questionId}
            `
            await db.executeSql(updateSql)
        } else {
            // 插入新记录
            const insertSql = `
                INSERT INTO user_progress (question_id, last_visit_time)
                VALUES (${questionId}, CURRENT_TIMESTAMP)
            `
            await db.executeSql(insertSql)
        }
        return true
    } catch (error) {
        console.error('更新进度失败:', error)
        return false
    } finally {
        await closeDB()
    }
}

/**
 * 切换收藏状态
 * @param {number} questionId 题目ID
 * @returns {Promise<boolean>} 是否操作成功
 */
export async function toggleFavorite(questionId) {
    await openDB()
    try {
        // 检查是否已收藏
        const checkSql = `SELECT id FROM favorites WHERE question_id = ${questionId}`
        const existing = await db.selectTableDataBySql(checkSql)
        
        if (existing.length > 0) {
            // 取消收藏
            const deleteSql = `DELETE FROM favorites WHERE question_id = ${questionId}`
            await db.executeSql(deleteSql)
        } else {
            // 添加收藏
            const insertSql = `INSERT INTO favorites (question_id) VALUES (${questionId})`
            await db.executeSql(insertSql)
        }
        return true
    } catch (error) {
        console.error('切换收藏状态失败:', error)
        return false
    } finally {
        await closeDB()
    }
}

/**
 * 获取收藏列表
 * @returns {Promise<Array>} 返回收藏的题目列表
 */
export async function getFavorites() {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.*,
                c.name as category_name,
                up.last_visit_time
            FROM favorites f
            JOIN question_map q ON f.question_id = q.id
            JOIN category c ON q.category_id = c.id
            LEFT JOIN user_progress up ON q.id = up.question_id
            ORDER BY f.create_time DESC
        `
        const result = await db.selectTableDataBySql(sql)
        return result
    } catch (error) {
        console.error('获取收藏列表失败:', error)
        return []
    } finally {
        await closeDB()
    }
}

/**
 * 获取用户统计信息
 * @returns {Promise<Object>} 返回用户统计信息，包含总题目数和已完成题目数
 */
export async function getUserStats() {
    await openDB()
    try {
        // 获取总题目数
        const totalSql = 'SELECT COUNT(*) as total FROM question_map'
        const totalResult = await db.selectTableDataBySql(totalSql)
        
        // 获取已完成题目数
        const completedSql = 'SELECT COUNT(*) as completed FROM user_progress'
        const completedResult = await db.selectTableDataBySql(completedSql)
        
        // 获取收藏题目数
        const favoritesSql = 'SELECT COUNT(*) as favorites FROM favorites'
        const favoritesResult = await db.selectTableDataBySql(favoritesSql)
        
        return {
            total: totalResult[0].total || 0,
            completed: completedResult[0].completed || 0,
            favorites: favoritesResult[0].favorites || 0
        }
    } catch (error) {
        console.error('获取用户统计信息失败:', error)
        return {
            total: 0,
            completed: 0,
            favorites: 0
        }
    } finally {
        await closeDB()
    }
}

/**
 * 获取最近访问的题目
 * @param {number} limit 限制返回数量
 * @returns {Promise<Array>} 返回最近访问的题目列表
 */
export async function getRecentQuestions(limit = 5) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.*,
                c.name as category_name,
                up.last_visit_time
            FROM user_progress up
            JOIN question_map q ON up.question_id = q.id
            JOIN category c ON q.category_id = c.id
            ORDER BY up.last_visit_time DESC
            LIMIT ${limit}
        `
        const result = await db.selectTableDataBySql(sql)
        return result
    } catch (error) {
        console.error('获取最近访问题目失败:', error)
        return []
    } finally {
        await closeDB()
    }
} 