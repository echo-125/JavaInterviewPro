if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const dbConfig = {
    dbName: "java_interview",
    // 数据库名称
    dbPath: "_doc/java_interview.db"
    // 数据库地址
  };
  const db = {
    /**
     * @Description: 创建数据库 或 有该数据库就打开
     */
    open() {
      return new Promise((resolve, reject) => {
        plus.sqlite.openDatabase({
          name: dbConfig.dbName,
          path: dbConfig.dbPath,
          success(e) {
            formatAppLog("log", "at common/database.js:23", "数据库打开成功:", e);
            resolve(e);
          },
          fail(e) {
            formatAppLog("error", "at common/database.js:27", "数据库打开失败:", e);
            reject(e);
          }
        });
      });
    },
    /**
     * @Description: 判断数据库是否打开
     */
    isOpen() {
      const isOpen = plus.sqlite.isOpenDatabase({
        name: dbConfig.dbName,
        path: dbConfig.dbPath
      });
      formatAppLog("log", "at common/database.js:42", "数据库是否打开:", isOpen);
      return isOpen;
    },
    /**
     * @Description: 执行SQL语句
     */
    executeSql(sql, values = []) {
      return new Promise((resolve, reject) => {
        formatAppLog("log", "at common/database.js:51", "执行SQL:", sql, "参数:", JSON.stringify(values));
        plus.sqlite.executeSql({
          name: dbConfig.dbName,
          sql,
          values,
          success(e) {
            formatAppLog("log", "at common/database.js:57", "SQL执行成功:", JSON.stringify(e));
            resolve(e);
          },
          fail(e) {
            formatAppLog("error", "at common/database.js:61", "SQL执行失败:", JSON.stringify(e));
            reject(e);
          }
        });
      });
    },
    /**
     * @Description: 查询表数据
     */
    selectTableDataBySql(sql, values = []) {
      return new Promise((resolve, reject) => {
        formatAppLog("log", "at common/database.js:73", "查询SQL:", sql, "参数:", JSON.stringify(values));
        plus.sqlite.selectSql({
          name: dbConfig.dbName,
          sql,
          values,
          success(e) {
            formatAppLog("log", "at common/database.js:79", "查询成功:", JSON.stringify(e));
            resolve(e);
          },
          fail(e) {
            formatAppLog("error", "at common/database.js:83", "查询失败:", JSON.stringify(e));
            reject(e);
          }
        });
      });
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
            resolve(e);
          },
          fail(e) {
            reject(e);
          }
        });
      });
    },
    /**
     * @Description: 关闭数据库
     */
    close() {
      return new Promise((resolve, reject) => {
        plus.sqlite.closeDatabase({
          name: dbConfig.dbName,
          success(e) {
            resolve(e);
          },
          fail(e) {
            reject(e);
          }
        });
      });
    },
    /**
     * @Description: 初始化数据库
     */
    async initDatabase() {
      try {
        formatAppLog("log", "at common/database.js:130", "开始初始化数据库...");
        if (!this.isOpen()) {
          formatAppLog("log", "at common/database.js:132", "数据库未打开，创建并初始化...");
          await this.open();
        }
        const tables = await this.QueryTables();
        formatAppLog("log", "at common/database.js:138", "当前数据库中的表:", JSON.stringify(tables));
        const requiredTables = ["category", "question_map", "user_progress", "favorites"];
        const existingTables = tables.map((table) => table.name);
        const missingTables = requiredTables.filter((table) => !existingTables.includes(table));
        if (missingTables.length > 0) {
          formatAppLog("log", "at common/database.js:146", "缺少必要的表，开始创建表...");
          await this.createTables();
        } else {
          try {
            const categoryCount = await this.selectTableDataBySql("SELECT COUNT(*) as count FROM category");
            formatAppLog("log", "at common/database.js:152", "当前分类数量:", categoryCount[0].count);
            if (categoryCount[0].count === 0) {
              formatAppLog("log", "at common/database.js:154", "开始插入测试数据...");
              await this.insertTestData();
            }
          } catch (error) {
            formatAppLog("error", "at common/database.js:158", "检查分类数量失败:", error);
            formatAppLog("log", "at common/database.js:160", "重新创建表...");
            await this.createTables();
          }
        }
        return true;
      } catch (error) {
        formatAppLog("error", "at common/database.js:167", "初始化数据库失败:", JSON.stringify(error));
        return false;
      }
    },
    /**
     * @Description: 创建表
     */
    async createTables() {
      try {
        formatAppLog("log", "at common/database.js:177", "开始创建表...");
        await this.executeSql("DROP TABLE IF EXISTS favorites");
        await this.executeSql("DROP TABLE IF EXISTS user_progress");
        await this.executeSql("DROP TABLE IF EXISTS question_map");
        await this.executeSql("DROP TABLE IF EXISTS category");
        formatAppLog("log", "at common/database.js:184", "清理旧表成功");
        await this.executeSql(`
				CREATE TABLE category (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					name VARCHAR(50) NOT NULL,
					create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
        formatAppLog("log", "at common/database.js:194", "类别表创建成功");
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
			`);
        formatAppLog("log", "at common/database.js:211", "题目映射表创建成功");
        await this.executeSql(`
				CREATE TABLE user_progress (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					question_id INTEGER,
					last_visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (question_id) REFERENCES question_map(id)
				)
			`);
        formatAppLog("log", "at common/database.js:222", "用户进度表创建成功");
        await this.executeSql(`
				CREATE TABLE favorites (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					question_id INTEGER,
					create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (question_id) REFERENCES question_map(id)
				)
			`);
        formatAppLog("log", "at common/database.js:233", "收藏表创建成功");
        await this.executeSql("CREATE INDEX idx_question_category ON question_map(category_id)");
        await this.executeSql("CREATE INDEX idx_question_uri ON question_map(uri)");
        await this.executeSql("CREATE INDEX idx_question_sort ON question_map(category_id, sort_order)");
        await this.executeSql("CREATE INDEX idx_user_progress_question ON user_progress(question_id)");
        await this.executeSql("CREATE INDEX idx_favorites_question ON favorites(question_id)");
        formatAppLog("log", "at common/database.js:241", "索引创建成功");
        formatAppLog("log", "at common/database.js:243", "所有表创建成功");
        formatAppLog("log", "at common/database.js:246", "开始插入测试数据...");
        await this.insertTestData();
        formatAppLog("log", "at common/database.js:248", "测试数据插入成功");
        return true;
      } catch (error) {
        formatAppLog("error", "at common/database.js:252", "创建表失败:", JSON.stringify(error));
        throw error;
      }
    },
    /**
     * @Description: 插入测试数据
     */
    async insertTestData() {
      try {
        formatAppLog("log", "at common/database.js:262", "开始插入测试数据...");
        const categories = [
          { name: "Java基础" },
          { name: "Java高级" },
          { name: "Spring框架" },
          { name: "数据库" }
        ];
        for (const category of categories) {
          const result = await this.executeSql(
            'INSERT INTO category (name) VALUES ("' + category.name + '")'
          );
          formatAppLog("log", "at common/database.js:276", "插入分类:", category.name, "结果:", JSON.stringify(result));
        }
        const questions = [
          {
            uri: "https://zha-ge.cn/1",
            title: "Java中的基本数据类型有哪些？",
            category_id: 1,
            sort_order: 1,
            content: "请列举Java中的基本数据类型及其占用字节数。",
            answer: "Java中有8种基本数据类型：\n1. byte: 1字节\n2. short: 2字节\n3. int: 4字节\n4. long: 8字节\n5. float: 4字节\n6. double: 8字节\n7. char: 2字节\n8. boolean: 1字节"
          },
          {
            uri: "https://zha-ge.cn/2",
            title: "什么是Java？",
            category_id: 1,
            sort_order: 2,
            content: "请解释Java编程语言的特点。",
            answer: "Java是一种面向对象的编程语言，具有以下特点：\n1. 跨平台性\n2. 面向对象\n3. 安全性\n4. 多线程\n5. 动态性"
          },
          {
            uri: "https://zha-ge.cn/3",
            title: "什么是Spring框架？",
            category_id: 3,
            sort_order: 1,
            content: "请介绍Spring框架的主要特性。",
            answer: "Spring是一个轻量级的Java开发框架，主要特性包括：\n1. 依赖注入\n2. 面向切面编程\n3. 声明式事务\n4. 集成其他框架"
          }
        ];
        for (const question of questions) {
          const result = await this.executeSql(
            `INSERT INTO question_map (uri, title, category_id, sort_order, content, answer) 
					VALUES ("${question.uri}", "${question.title}", ${question.category_id}, ${question.sort_order}, "${question.content}", "${question.answer}")`
          );
          formatAppLog("log", "at common/database.js:312", "插入题目:", question.title, "结果:", JSON.stringify(result));
        }
        const progressData = [
          { question_id: 1, last_visit_time: (/* @__PURE__ */ new Date()).toISOString() },
          { question_id: 2, last_visit_time: (/* @__PURE__ */ new Date()).toISOString() }
        ];
        for (const progress of progressData) {
          const result = await this.executeSql(
            `INSERT INTO user_progress (question_id, last_visit_time) 
					VALUES (${progress.question_id}, "${progress.last_visit_time}")`
          );
          formatAppLog("log", "at common/database.js:326", "插入进度:", JSON.stringify(progress), "结果:", JSON.stringify(result));
        }
        const favoritesData = [
          { question_id: 1 },
          { question_id: 3 }
        ];
        for (const favorite of favoritesData) {
          const result = await this.executeSql(
            `INSERT INTO favorites (question_id) VALUES (${favorite.question_id})`
          );
          formatAppLog("log", "at common/database.js:339", "插入收藏:", JSON.stringify(favorite), "结果:", JSON.stringify(result));
        }
        formatAppLog("log", "at common/database.js:342", "测试数据插入成功");
        return true;
      } catch (error) {
        formatAppLog("error", "at common/database.js:345", "插入测试数据失败:", JSON.stringify(error));
        throw error;
      }
    }
  };
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$5 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const categories = vue.ref([]);
      const searchText = vue.ref("");
      const isLoading = vue.ref(false);
      const filteredCategories = vue.computed(() => {
        if (!searchText.value)
          return categories.value;
        return categories.value.filter(
          (category) => category.name.toLowerCase().includes(searchText.value.toLowerCase())
        );
      });
      const initDatabase = async () => {
        try {
          formatAppLog("log", "at pages/study/index.vue:69", "开始初始化数据库...");
          const success = await db.initDatabase();
          if (!success) {
            formatAppLog("error", "at pages/study/index.vue:72", "数据库初始化失败");
            return false;
          }
          formatAppLog("log", "at pages/study/index.vue:75", "数据库初始化成功");
          return true;
        } catch (error) {
          formatAppLog("error", "at pages/study/index.vue:78", "数据库初始化失败:", error);
          return false;
        }
      };
      const loadCategories = async () => {
        try {
          isLoading.value = true;
          formatAppLog("log", "at pages/study/index.vue:87", "开始加载分类列表...");
          formatAppLog("log", "at pages/study/index.vue:90", "查询分类数据...");
          let result = [];
          try {
            result = await db.selectTableDataBySql(`
        SELECT c.*, 
          COUNT(q.id) as questionCount,
          COUNT(CASE WHEN up.last_visit_time IS NOT NULL THEN 1 END) as completedCount
        FROM category c
        LEFT JOIN question_map q ON c.id = q.category_id
        LEFT JOIN user_progress up ON q.id = up.question_id
        GROUP BY c.id
        ORDER BY c.create_time ASC
      `);
            formatAppLog("log", "at pages/study/index.vue:103", "原始查询结果:", JSON.stringify(result));
          } catch (error) {
            formatAppLog("error", "at pages/study/index.vue:105", "查询分类数据失败:", error);
            return;
          }
          categories.value = result.map((item) => ({
            id: item.id,
            name: item.name,
            questionCount: item.questionCount || 0,
            completedCount: item.completedCount || 0,
            progress: item.questionCount ? Math.round(item.completedCount / item.questionCount * 100) : 0
          }));
          formatAppLog("log", "at pages/study/index.vue:118", "处理后的分类列表:", JSON.stringify(categories.value));
        } catch (error) {
          formatAppLog("error", "at pages/study/index.vue:120", "加载分类失败:", error);
        } finally {
          isLoading.value = false;
        }
      };
      const handleSearch = () => {
      };
      const navigateToQuestions = (category) => {
        uni.navigateTo({
          url: `/pages/study/questions?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`
        });
      };
      vue.onMounted(async () => {
        formatAppLog("log", "at pages/study/index.vue:139", "页面加载完成，开始加载数据...");
        try {
          const initSuccess = await initDatabase();
          if (!initSuccess) {
            formatAppLog("error", "at pages/study/index.vue:144", "数据库初始化失败，无法加载分类");
            return;
          }
          await loadCategories();
        } catch (error) {
          formatAppLog("error", "at pages/study/index.vue:150", "页面初始化失败:", error);
        }
      });
      const __returned__ = { categories, searchText, isLoading, filteredCategories, initDatabase, loadCategories, handleSearch, navigateToQuestions, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get db() {
        return db;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createCommentVNode(" 顶部搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "text",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.searchText = $event),
            placeholder: "搜索题目",
            onInput: $setup.handleSearch
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $setup.searchText]
        ])
      ]),
      vue.createCommentVNode(" 分类列表 "),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        class: "category-list"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.filteredCategories, (category) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: category.id,
              class: "category-item",
              onClick: ($event) => $setup.navigateToQuestions(category)
            }, [
              vue.createElementVNode("view", { class: "category-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "category-name" },
                  vue.toDisplayString(category.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "category-count" },
                  vue.toDisplayString(category.questionCount) + "题",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "progress-bar" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "progress-inner",
                    style: vue.normalizeStyle({ width: category.progress + "%" })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "category-stats" }, [
                vue.createElementVNode(
                  "text",
                  { class: "completed-count" },
                  "已完成 " + vue.toDisplayString(category.completedCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "progress-text" },
                  vue.toDisplayString(category.progress) + "%",
                  1
                  /* TEXT */
                )
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createCommentVNode(" 加载状态 "),
      $setup.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "loading"
      }, [
        vue.createElementVNode("text", null, "加载中...")
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 空状态 "),
      !$setup.isLoading && $setup.categories.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "empty"
      }, [
        vue.createElementVNode("text", null, "暂无分类数据")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesStudyIndex = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__file", "D:/workspace/android/JavaInterviewPro/pages/study/index.vue"]]);
  const _sfc_main$4 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const favorites = vue.ref([]);
      const isLoading = vue.ref(false);
      const loadFavorites = async () => {
        try {
          isLoading.value = true;
          let isOpen = false;
          try {
            isOpen = await db.isOpen();
            formatAppLog("log", "at pages/favorite/index.vue:44", "数据库是否打开:", isOpen);
          } catch (error) {
            formatAppLog("error", "at pages/favorite/index.vue:46", "检查数据库状态失败:", error);
          }
          if (!isOpen) {
            formatAppLog("log", "at pages/favorite/index.vue:50", "数据库未打开，尝试打开数据库...");
            try {
              await db.openDatabase();
              formatAppLog("log", "at pages/favorite/index.vue:53", "数据库打开成功");
            } catch (error) {
              formatAppLog("error", "at pages/favorite/index.vue:55", "打开数据库失败:", error);
              setTimeout(async () => {
                await loadFavorites();
              }, 100);
              return;
            }
          }
          const sql = `
      SELECT q.*, c.name as category_name
      FROM question_map q
      LEFT JOIN category c ON q.category_id = c.id
      INNER JOIN favorites f ON q.id = f.question_id
      ORDER BY f.create_time DESC
    `;
          const result = await db.selectTableDataBySql(sql);
          favorites.value = result;
          formatAppLog("log", "at pages/favorite/index.vue:74", "收藏列表:", favorites.value);
        } catch (error) {
          formatAppLog("error", "at pages/favorite/index.vue:76", "加载收藏失败:", error);
          setTimeout(async () => {
            await loadFavorites();
          }, 100);
        } finally {
          isLoading.value = false;
        }
      };
      const navigateToQuestion = (question) => {
        uni.navigateTo({
          url: "/pages/question/detail?id=" + question.id
        });
      };
      const formatDate = (timestamp) => {
        if (!timestamp)
          return "未学习";
        const date = new Date(timestamp);
        return date.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      };
      vue.onMounted(() => {
        loadFavorites();
      });
      const __returned__ = { favorites, isLoading, loadFavorites, navigateToQuestion, formatDate, ref: vue.ref, onMounted: vue.onMounted, get db() {
        return db;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "我的收藏"),
        vue.createElementVNode(
          "text",
          { class: "subtitle" },
          "共" + vue.toDisplayString($setup.favorites.length) + "题",
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "favorite-list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.favorites, (item, index) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: index,
              class: "favorite-item",
              onClick: ($event) => $setup.navigateToQuestion(item)
            }, [
              vue.createElementVNode("view", { class: "question-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "question-title" },
                  vue.toDisplayString(item.title),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "question-category" },
                  vue.toDisplayString(item.category_name),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "question-meta" }, [
                vue.createElementVNode(
                  "text",
                  { class: "study-time" },
                  "上次学习: " + vue.toDisplayString($setup.formatDate(item.last_study_time)),
                  1
                  /* TEXT */
                )
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      $setup.favorites.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "empty-state"
      }, [
        vue.createElementVNode("text", { class: "empty-text" }, "暂无收藏题目")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesFavoriteIndex = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "D:/workspace/android/JavaInterviewPro/pages/favorite/index.vue"]]);
  async function openDB() {
    if (!db.isOpen()) {
      await db.open();
    }
  }
  async function closeDB() {
    if (db.isOpen()) {
      await db.close();
    }
  }
  async function getUserStats() {
    await openDB();
    try {
      const totalSql = "SELECT COUNT(*) as total FROM question_map";
      const totalResult = await db.selectTableDataBySql(totalSql);
      const completedSql = "SELECT COUNT(*) as completed FROM user_progress";
      const completedResult = await db.selectTableDataBySql(completedSql);
      const favoritesSql = "SELECT COUNT(*) as favorites FROM favorites";
      const favoritesResult = await db.selectTableDataBySql(favoritesSql);
      return {
        total: totalResult[0].total || 0,
        completed: completedResult[0].completed || 0,
        favorites: favoritesResult[0].favorites || 0
      };
    } catch (error) {
      formatAppLog("error", "at api/api.js:268", "获取用户统计信息失败:", error);
      return {
        total: 0,
        completed: 0,
        favorites: 0
      };
    } finally {
      await closeDB();
    }
  }
  const _imports_0 = "/static/images/avatar.png";
  const _sfc_main$3 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const userInfo = vue.ref({
        username: "",
        avatar: "/static/images/default-avatar.png",
        total: 0,
        completed: 0,
        favorites: 0
      });
      const stats = vue.ref({
        total: 0,
        completed: 0,
        favorites: 0
      });
      const isDarkMode = vue.ref(false);
      const isLoading = vue.ref(false);
      async function loadUserInfo() {
        try {
          isLoading.value = true;
          const result = await getUserStats();
          stats.value = result;
          userInfo.value = {
            ...userInfo.value,
            total: result.total,
            completed: result.completed,
            favorites: result.favorites
          };
        } catch (error) {
          formatAppLog("error", "at pages/profile/index.vue:102", "加载用户信息失败:", error);
          uni.showToast({
            title: "加载用户信息失败",
            icon: "none"
          });
        } finally {
          isLoading.value = false;
        }
      }
      const formatDate = (timestamp) => {
        if (!timestamp)
          return "未学习";
        const date = new Date(timestamp);
        return date.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      };
      const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
      };
      const clearCache = () => {
        uni.showModal({
          title: "提示",
          content: "确定要清除缓存吗？",
          success: (res) => {
            if (res.confirm) {
              uni.showToast({
                title: "清除成功",
                icon: "success"
              });
            }
          }
        });
      };
      const navigateToHistory = () => {
        uni.navigateTo({
          url: "/pages/profile/history"
        });
      };
      const navigateToWrongQuestions = () => {
        uni.navigateTo({
          url: "/pages/profile/wrong-questions"
        });
      };
      const navigateToAbout = () => {
        uni.navigateTo({
          url: "/pages/profile/about"
        });
      };
      const navigateToFeedback = () => {
        uni.navigateTo({
          url: "/pages/profile/feedback"
        });
      };
      vue.onMounted(() => {
        loadUserInfo();
      });
      const __returned__ = { userInfo, stats, isDarkMode, isLoading, loadUserInfo, formatDate, toggleDarkMode, clearCache, navigateToHistory, navigateToWrongQuestions, navigateToAbout, navigateToFeedback, ref: vue.ref, onMounted: vue.onMounted, get db() {
        return db;
      }, get getUserStats() {
        return getUserStats;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "avatar-section" }, [
          vue.createElementVNode("image", {
            class: "avatar",
            src: _imports_0,
            mode: "aspectFill"
          }),
          vue.createElementVNode("text", { class: "nickname" }, "Java学习者")
        ]),
        vue.createElementVNode("view", { class: "stats-section" }, [
          vue.createElementVNode("view", { class: "stat-item" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.total),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "总题目")
          ]),
          vue.createElementVNode("view", { class: "stat-item" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.completed),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "已完成")
          ]),
          vue.createElementVNode("view", { class: "stat-item" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-value" },
              vue.toDisplayString($setup.stats.favorites),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "收藏")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "menu-list" }, [
        vue.createElementVNode("view", { class: "menu-group" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.navigateToHistory
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "📅"),
            vue.createElementVNode("text", { class: "menu-text" }, "学习历史"),
            vue.createElementVNode("text", { class: "menu-arrow" }, ">")
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.navigateToWrongQuestions
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "❌"),
            vue.createElementVNode("text", { class: "menu-text" }, "错题本"),
            vue.createElementVNode("text", { class: "menu-arrow" }, ">")
          ])
        ]),
        vue.createElementVNode("view", { class: "menu-group" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.toggleDarkMode
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "🌙"),
            vue.createElementVNode("text", { class: "menu-text" }, "深色模式"),
            vue.createElementVNode("switch", {
              checked: $setup.isDarkMode,
              onChange: $setup.toggleDarkMode
            }, null, 40, ["checked"])
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.clearCache
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "🗑️"),
            vue.createElementVNode("text", { class: "menu-text" }, "清除缓存"),
            vue.createElementVNode("text", { class: "menu-arrow" }, ">")
          ])
        ]),
        vue.createElementVNode("view", { class: "menu-group" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.navigateToAbout
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "ℹ️"),
            vue.createElementVNode("text", { class: "menu-text" }, "关于我们"),
            vue.createElementVNode("text", { class: "menu-arrow" }, ">")
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: $setup.navigateToFeedback
          }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "📝"),
            vue.createElementVNode("text", { class: "menu-text" }, "意见反馈"),
            vue.createElementVNode("text", { class: "menu-arrow" }, ">")
          ])
        ])
      ])
    ]);
  }
  const PagesProfileIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "D:/workspace/android/JavaInterviewPro/pages/profile/index.vue"]]);
  const _sfc_main$2 = {
    __name: "detail",
    setup(__props, { expose: __expose }) {
      __expose();
      const question = vue.ref(null);
      const isFavorite = vue.ref(false);
      const canPrev = vue.ref(false);
      const canNext = vue.ref(false);
      const loadQuestion = async (id) => {
        try {
          const tables = await db.QueryTables();
          if (!tables.some((table) => table.name === "question_map")) {
            formatAppLog("log", "at pages/question/detail.vue:48", "question_map表不存在");
            return;
          }
          const sql = `
      SELECT q.*, c.name as category_name
      FROM question_map q
      LEFT JOIN category c ON q.category_id = c.id
      WHERE q.id = ?
    `;
          const result = await db.selectTableDataBySql(sql, [id]);
          if (result && result.length > 0) {
            question.value = result[0];
            isFavorite.value = question.value.is_favorite === 1;
            checkNavigation();
            formatAppLog("log", "at pages/question/detail.vue:65", "题目详情:", question.value);
          }
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:68", "加载题目失败:", error);
        }
      };
      const checkFavoriteStatus = async () => {
        if (!question.value)
          return;
        try {
          const sql = "SELECT is_favorite FROM question_map WHERE id = ?";
          const result = await db.selectTableDataBySql(sql, [question.value.id]);
          if (result && result.length > 0) {
            isFavorite.value = result[0].is_favorite === 1;
          }
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:82", "检查收藏状态失败:", error);
        }
      };
      const checkNavigation = async () => {
        if (!question.value)
          return;
        try {
          const prevSql = "SELECT id FROM question_map WHERE id < ? ORDER BY id DESC LIMIT 1";
          const prevResult = await db.selectTableDataBySql(prevSql, [question.value.id]);
          canPrev.value = prevResult && prevResult.length > 0;
          const nextSql = "SELECT id FROM question_map WHERE id > ? ORDER BY id ASC LIMIT 1";
          const nextResult = await db.selectTableDataBySql(nextSql, [question.value.id]);
          canNext.value = nextResult && nextResult.length > 0;
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:100", "检查导航状态失败:", error);
        }
      };
      const updateProgress = async () => {
        if (!question.value)
          return;
        try {
          const sql = "UPDATE question_map SET last_study_time = ? WHERE id = ?";
          await db.executeSql(sql, [(/* @__PURE__ */ new Date()).getTime(), question.value.id]);
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:111", "更新进度失败:", error);
        }
      };
      const toggleFavorite = async () => {
        if (!question.value)
          return;
        try {
          const newStatus = isFavorite.value ? 0 : 1;
          const sql = "UPDATE question_map SET is_favorite = ? WHERE id = ?";
          await db.executeSql(sql, [newStatus, question.value.id]);
          isFavorite.value = !isFavorite.value;
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:124", "切换收藏状态失败:", error);
        }
      };
      const prevQuestion = async () => {
        if (!question.value || !canPrev.value)
          return;
        try {
          const sql = "SELECT id FROM question_map WHERE id < ? ORDER BY id DESC LIMIT 1";
          const result = await db.selectTableDataBySql(sql, [question.value.id]);
          if (result && result.length > 0) {
            loadQuestion(result[0].id);
          }
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:138", "加载上一题失败:", error);
        }
      };
      const nextQuestion = async () => {
        if (!question.value || !canNext.value)
          return;
        try {
          const sql = "SELECT id FROM question_map WHERE id > ? ORDER BY id ASC LIMIT 1";
          const result = await db.selectTableDataBySql(sql, [question.value.id]);
          if (result && result.length > 0) {
            loadQuestion(result[0].id);
          }
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:152", "加载下一题失败:", error);
        }
      };
      const viewDetail = () => {
        uni.navigateTo({
          url: "/pages/question/webview?uri=" + encodeURIComponent(question.value.uri)
        });
      };
      const loadFirstQuestion = async () => {
        try {
          const sql = "SELECT id FROM question_map ORDER BY id ASC LIMIT 1";
          const result = await db.selectTableDataBySql(sql);
          if (result && result.length > 0) {
            loadQuestion(result[0].id);
          }
        } catch (error) {
          formatAppLog("error", "at pages/question/detail.vue:172", "加载第一题失败:", error);
        }
      };
      vue.onMounted(() => {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const id = currentPage.options.id;
        if (id) {
          loadQuestion(parseInt(id));
        } else {
          loadFirstQuestion();
        }
      });
      const __returned__ = { question, isFavorite, canPrev, canNext, loadQuestion, checkFavoriteStatus, checkNavigation, updateProgress, toggleFavorite, prevQuestion, nextQuestion, viewDetail, loadFirstQuestion, ref: vue.ref, onMounted: vue.onMounted, get db() {
        return db;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "nav-buttons" }, [
          vue.createElementVNode("button", {
            class: "nav-btn",
            onClick: $setup.prevQuestion,
            disabled: !$setup.canPrev
          }, "上一题", 8, ["disabled"]),
          vue.createElementVNode("button", {
            class: "nav-btn",
            onClick: $setup.nextQuestion,
            disabled: !$setup.canNext
          }, "下一题", 8, ["disabled"])
        ]),
        vue.createElementVNode("view", { class: "actions" }, [
          vue.createElementVNode("view", {
            class: "favorite-btn",
            onClick: $setup.toggleFavorite
          }, [
            vue.createElementVNode(
              "text",
              {
                class: vue.normalizeClass(["iconfont", $setup.isFavorite ? "icon-star-filled" : "icon-star"])
              },
              null,
              2
              /* CLASS */
            )
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "content" }, [
        vue.createElementVNode("view", { class: "question-section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "题目"),
          vue.createElementVNode(
            "view",
            { class: "question-content" },
            vue.toDisplayString($setup.question.content),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "answer-section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "答案"),
          vue.createElementVNode(
            "view",
            { class: "answer-content" },
            vue.toDisplayString($setup.question.answer),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "detail-section" }, [
          vue.createElementVNode("button", {
            class: "detail-btn",
            onClick: $setup.viewDetail
          }, "查看详细解析")
        ])
      ])
    ]);
  }
  const PagesQuestionDetail = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "D:/workspace/android/JavaInterviewPro/pages/question/detail.vue"]]);
  const _sfc_main$1 = {
    __name: "webview",
    setup(__props, { expose: __expose }) {
      __expose();
      const url = vue.ref("");
      const handleMessage = (event) => {
        formatAppLog("log", "at pages/question/webview.vue:14", "收到webview消息:", event.detail);
      };
      vue.onMounted(() => {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const uri = currentPage.options.uri;
        if (uri) {
          url.value = decodeURIComponent(uri);
        } else {
          uni.showToast({
            title: "无效的解析链接",
            icon: "none"
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        }
      });
      const viewDetail = () => {
        uni.navigateTo({
          url: "/pages/question/webview?uri=" + encodeURIComponent(currentQuestion.value.uri)
        });
      };
      const __returned__ = { url, handleMessage, viewDetail, ref: vue.ref, onMounted: vue.onMounted };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("web-view", {
        src: $setup.url,
        onMessage: $setup.handleMessage
      }, null, 40, ["src"])
    ]);
  }
  const PagesQuestionWebview = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "D:/workspace/android/JavaInterviewPro/pages/question/webview.vue"]]);
  __definePage("pages/study/index", PagesStudyIndex);
  __definePage("pages/favorite/index", PagesFavoriteIndex);
  __definePage("pages/profile/index", PagesProfileIndex);
  __definePage("pages/question/detail", PagesQuestionDetail);
  __definePage("pages/question/webview", PagesQuestionWebview);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/workspace/android/JavaInterviewPro/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
