# Java面试题学习助手

一个基于 uni-app 开发的 Java 面试题学习应用，帮助用户系统地学习和复习 Java 面试题。

## 功能特点

### 1. 分类管理
- 支持多个面试题分类
- 显示每个分类的学习进度
- 分类列表实时更新学习状态

### 2. 题目学习
- 题目列表展示
  - 显示题目标题
  - 显示学习状态（已学习/未学习）
  - 显示收藏状态
  - 支持下拉刷新
- 题目详情
  - 显示题目内容
  - 显示答案解析
  - 支持上一题/下一题导航
  - 支持收藏功能
  - 支持标记学习状态
  - 支持查看详细资料（如果有）
  - 支持语音播放功能

### 3. 学习进度
- 实时显示学习进度
- 支持重置学习状态
- 记录最后学习时间
- 分类进度实时更新

### 4. 数据管理
- 本地数据库存储
- 支持数据初始化
- 支持数据导入
  - 支持从URL导入
  - 支持从本地文件导入
  - 支持JSON格式数据导入

### 5. 个人中心
- 显示学习统计信息
- 支持深色模式切换
- 支持清除缓存
- 支持重置数据
- 支持导入题库
- 支持查看关于信息

### 6. 收藏功能
- 支持收藏/取消收藏题目
- 收藏列表按时间倒序排列
- 显示收藏数量

## 技术栈

- 前端框架：uni-app
- 数据库：SQLite
- 状态管理：Vue 3 Composition API
- UI 组件：自定义组件
- 音频播放：uni.createInnerAudioContext

## 项目结构

```
├── pages/
│   ├── study/              # 学习相关页面
│   │   ├── index.vue      # 分类列表页
│   │   ├── questions.vue  # 题目列表页
│   │   └── question.vue   # 题目详情页
│   ├── favorite/          # 收藏相关页面
│   │   └── index.vue      # 收藏列表页
│   ├── profile/           # 个人中心相关页面
│   │   ├── index.vue      # 个人中心主页
│   │   └── import.vue     # 导入题库页面
│   └── webview/           # 网页相关页面
│       └── index.vue      # 网页详情页
├── api/
│   └── api.js            # API 接口封装
├── common/
│   ├── database.js       # 数据库操作封装
│   └── dbInit.js         # 数据库初始化
├── utils/
│   ├── cacheUtil.js      # 缓存工具类
│   ├── dateUtil.js       # 日期工具类
│   └── theme.js          # 主题工具类
└── mixins/
    └── themeMixin.js     # 主题混入
```

## 开发进度

### 已完成功能
1. 基础框架搭建
2. 数据库设计和实现
3. 分类列表页面
4. 题目列表页面
5. 题目详情页面
6. 学习状态管理
7. 收藏功能
8. 进度显示
9. 页面间数据同步
10. 个人中心功能
11. 数据导入功能
12. 深色模式支持

### 进行中功能
1. 语音播放功能
   - [x] 音频播放器封装
   - [ ] 音频文件准备
   - [ ] 界面集成
   - [ ] 播放控制优化

### 待优化功能
1. 数据导入功能完善
2. 搜索功能
3. 错题本功能
4. 学习计划功能
5. 统计分析功能
6. 语音播放优化
   - 音频文件压缩
   - 音频预加载
   - 播放进度显示
   - 音频精灵图优化

## 使用说明

1. 首次启动时会自动初始化数据库
2. 在分类列表页可以查看所有分类及其学习进度
3. 点击分类进入题目列表页
4. 在题目列表页可以查看该分类下的所有题目
5. 点击题目进入详情页进行学习
6. 在详情页可以：
   - 查看题目内容和答案
   - 标记学习状态
   - 收藏题目
   - 查看详细资料
   - 切换上一题/下一题
   - 使用语音播放功能
7. 在个人中心可以：
   - 查看学习统计
   - 切换深色模式
   - 清除缓存
   - 重置数据
   - 导入题库
   - 查看关于信息

## 注意事项

1. 确保数据库初始化成功
2. 保持网络连接以加载详细资料
3. 定期备份学习数据
4. 导入数据时请确保JSON格式正确
5. 语音播放相关：
   - 首次使用需下载音频资源包
   - 建议使用耳机播放
   - 音频文件较大，请预留足够存储空间

## 后续计划

1. 添加用户系统
2. 支持云端同步
3. 添加学习计划功能
4. 优化UI/UX设计
5. 添加更多学习辅助功能
6. 语音功能增强
   - 支持在线TTS转换
   - 支持自定义音色
   - 支持批量音频下载

## 数据库设计

### 分类表 (category)
```sql
CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 题目映射表 (question_map)
```sql
CREATE TABLE question_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    uri TEXT,
    answer TEXT,
    sort_order INTEGER DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_learned INTEGER DEFAULT 0,
    learn_time TIMESTAMP,
    is_favorite INTEGER DEFAULT 0,
    favorite_time TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id)
);
```

### 索引
```sql
-- 分类索引
CREATE INDEX idx_category_id ON question_map(category_id);

-- 学习状态索引
CREATE INDEX idx_is_learned ON question_map(is_learned);

-- 收藏状态索引
CREATE INDEX idx_is_favorite ON question_map(is_favorite);
```

## 开发环境

- Node.js >= 14
- HBuilderX
- 微信开发者工具

## 安装和运行

1. 克隆项目
```bash
git clone [项目地址]
```

2. 安装依赖
```bash
npm install
```

3. 运行项目
```bash
npm run dev
```

## 注意事项

1. 首次运行需要初始化数据库
2. 确保微信开发者工具已开启"不校验合法域名"选项
3. 建议在真机上测试，以获得更好的体验

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 