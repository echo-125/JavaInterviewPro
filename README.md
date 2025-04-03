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

### 5. 语音播放功能
- 支持题目内容语音播放
- 支持答案解析语音播放
- 可调节播放音量
- 可调节播放速度
- 支持播放控制（播放/暂停/停止）
- 完全离线播放，无需网络连接

## 技术栈

- 前端框架：uni-app
- 数据库：SQLite
- 状态管理：Vue 3 Composition API
- UI 组件：自定义组件
- 音频播放：uni.createInnerAudioContext

## 项目结构

```
├── pages/
│   ├── study/
│   │   ├── index.vue      # 分类列表页
│   │   ├── questions.vue  # 题目列表页
│   │   └── question.vue   # 题目详情页
│   └── webview/
│       └── index.vue      # 网页详情页
├── api/
│   └── api.js            # API 接口封装
├── common/
│   └── database.js       # 数据库操作封装
└── utils/
    ├── dbInit.js         # 数据库初始化
    └── dateUtil.js       # 日期工具类
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
     - 点击播放按钮播放当前内容
     - 使用滑块调节音量和播放速度
     - 可随时暂停或停止播放

## 注意事项

1. 确保数据库初始化成功
2. 保持网络连接以加载详细资料
3. 定期备份学习数据
4. 语音播放相关：
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

## 主要功能说明

### 1. 题目学习
- 支持标记题目为"已学习"
- 记录学习时间
- 显示学习进度

### 2. 收藏功能
- 支持收藏/取消收藏题目
- 收藏列表按时间倒序排列
- 显示收藏数量

### 3. 分类管理
- 按分类浏览题目
- 显示分类完成进度
- 支持分类内题目排序

### 4. 数据统计
- 总题目数统计
- 已完成题目统计
- 收藏题目统计

## 技术栈

- 前端：Vue 3 + uni-app
- 数据库：SQLite
- 状态管理：Vue 3 Composition API

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