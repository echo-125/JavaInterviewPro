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
                COUNT(CASE WHEN q.is_learned = 1 THEN 1 END) as completedCount
            FROM category c
            LEFT JOIN question_map q ON c.id = q.category_id
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
                q.is_learned,
                q.learn_time,
                q.is_favorite,
                q.favorite_time
            FROM question_map q
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
                c.name as category_name
            FROM question_map q
            LEFT JOIN category c ON q.category_id = c.id
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
 * 更新学习状态
 * @param {number} questionId 题目ID
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateLearnStatus(questionId) {
    await openDB()
    try {
        const sql = `
            UPDATE question_map 
            SET is_learned = 1,
                learn_time = CURRENT_TIMESTAMP
            WHERE id = ${questionId}
        `
        await db.executeSql(sql)
        return true
    } catch (error) {
        console.error('更新学习状态失败:', error)
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
        const sql = `
            UPDATE question_map 
            SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END,
                favorite_time = CASE WHEN is_favorite = 0 THEN CURRENT_TIMESTAMP ELSE NULL END
            WHERE id = ${questionId}
        `
        await db.executeSql(sql)
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
                c.name as category_name
            FROM question_map q
            JOIN category c ON q.category_id = c.id
            WHERE q.is_favorite = 1
            ORDER BY q.favorite_time DESC
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
 * @returns {Promise<Object>} 返回用户统计信息，包含总题目数、已完成题目数和收藏题目数
 */
export async function getUserStats() {
    await openDB()
    try {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_learned = 1 THEN 1 END) as completed,
                COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorites
            FROM question_map
        `
        const result = await db.selectTableDataBySql(sql)
        return result[0] || {
            total: 0,
            completed: 0,
            favorites: 0
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
 * 获取最近学习的题目
 * @param {number} limit 限制返回数量
 * @returns {Promise<Array>} 返回最近学习的题目列表
 */
export async function getRecentQuestions(limit = 5) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.*,
                c.name as category_name
            FROM question_map q
            JOIN category c ON q.category_id = c.id
            WHERE q.is_learned = 1
            ORDER BY q.learn_time DESC
            LIMIT ${limit}
        `
        const result = await db.selectTableDataBySql(sql)
        return result
    } catch (error) {
        console.error('获取最近学习题目失败:', error)
        return []
    } finally {
        await closeDB()
    }
}

/**
 * 获取指定分类的题目列表，包含学习状态和收藏状态
 * @param {number} categoryId 分类ID
 * @returns {Promise<Array>} 返回题目列表
 */
export async function getQuestionsWithStatus(categoryId) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.id, 
                q.title, 
                q.sort_order,
                q.is_favorite,
                q.learn_time as last_visit_time,
                q.answer,
                q.uri
            FROM question_map q
            WHERE q.category_id = ${categoryId}
            ORDER BY q.sort_order ASC
        `
        const result = await db.selectTableDataBySql(sql)
        return result.map(item => ({
            ...item,
            is_favorite: item.is_favorite === 1,
            last_visit_time: item.last_visit_time || null
        }))
    } catch (error) {
        console.error('获取题目列表失败:', error)
        return []
    } finally {
        await closeDB()
    }
}

/**
 * 获取单个题目的详细信息
 * @param {number} questionId 题目ID
 * @returns {Promise<Object>} 返回题目详情
 */
export async function getQuestionById(questionId) {
    await openDB()
    try {
        const sql = `
            SELECT 
                q.id,
                q.category_id,
                q.uri,
                q.title,
                q.answer,
                q.sort_order,
                q.create_time,
                q.is_favorite,
                q.favorite_time,
                q.is_learned,
                q.learn_time as last_study_time
            FROM question_map q
            WHERE q.id = ${questionId}
        `
        const result = await db.selectTableDataBySql(sql)
        if (result && result.length > 0) {
            return {
                ...result[0],
                is_favorite: result[0].is_favorite === 1,
                last_study_time: result[0].last_study_time || null
            }
        }
        return null
    } catch (error) {
        console.error('获取题目详情失败:', error)
        return null
    } finally {
        await closeDB()
    }
}

/**
 * 取消学习状态
 * @param {number} questionId 题目ID
 * @returns {Promise<boolean>} 是否操作成功
 */
export async function cancelLearnStatus(questionId) {
    await openDB()
    try {
        const sql = `
            UPDATE question_map 
            SET is_learned = 0,
                learn_time = NULL
            WHERE id = ${questionId}
        `
        await db.executeSql(sql)
        return true
    } catch (error) {
        console.error('取消学习状态失败:', error)
        return false
    } finally {
        await closeDB()
    }
}

/**
 * 获取分类的完成进度
 * @param {number} categoryId 分类ID
 * @returns {Promise<Object>} 返回分类的完成进度信息
 */
export async function getCategoryProgress(categoryId) {
    await openDB()
    try {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_learned = 1 THEN 1 END) as completed
            FROM question_map
            WHERE category_id = ${categoryId}
        `
        const result = await db.selectTableDataBySql(sql)
        return result[0] || { total: 0, completed: 0 }
    } catch (error) {
        console.error('获取分类进度失败:', error)
        return { total: 0, completed: 0 }
    } finally {
        await closeDB()
    }
} 