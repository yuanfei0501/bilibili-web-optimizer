# B站 Web 端优化工具 - 设计文档

## 概述

一个模块化构建的篡改猴脚本，用于净化 B站 web 端页面体验。先以篡改猴脚本形式快速迭代，成熟后可迁移为浏览器插件。

## 技术选型

- **打包工具**：Rollup
- **语言**：原生 JavaScript（无框架依赖，保持轻量）
- **存储**：`GM_setValue` / `GM_getValue`
- **目标运行时**：篡改猴 / Tampermonkey

## 项目架构

```
bilibili-web-optimizer/
├── src/
│   ├── main.js              # 入口：初始化路由、加载对应页面模块
│   ├── config/
│   │   ├── default.js       # 默认配置项定义
│   │   └── store.js         # GM_setValue/GM_getValue 封装
│   ├── core/
│   │   ├── purifier.js      # 通用净化引擎（CSS 注入 + DOM 移除）
│   │   └── observer.js      # MutationObserver 封装，处理动态内容
│   ├── pages/
│   │   ├── home.js          # 首页净化规则
│   │   ├── video.js         # 视频播放页净化规则
│   │   ├── space.js         # 个人空间/收藏净化规则
│   │   └── search.js        # 搜索页净化规则
│   ├── panel/
│   │   ├── index.js         # 配置面板入口
│   │   ├── panel.html       # 面板模板
│   │   └── panel.css        # 面板样式
│   └── utils/
│       ├── dom.js           # DOM 操作工具
│       └── logger.js        # 日志工具
├── build/
│   └── rollup.config.js     # Rollup 打包配置
├── package.json
└── README.md
```

## 加载流程

1. 脚本加载 → 读取用户配置（GM_getValue）
2. 根据 `location.href` 判断当前页面类型
3. 注入全局净化 CSS（隐藏广告等通用规则）
4. 启动 MutationObserver 监听动态加载内容
5. 加载对应页面模块的细化净化规则
6. 注册油猴菜单项「B站优化设置」→ 打开配置面板

## 各页面净化规则

### 首页（home.js）

| 功能 | 实现方式 | 默认状态 |
|------|---------|---------|
| 隐藏顶部横幅广告 | CSS 隐藏 | 开启 |
| 隐藏推广/sponsor内容 | CSS + DOM 移除 | 开启 |
| 精简推荐信息流 | 移除直播推荐、番剧推荐等非视频分区 | 可配置 |
| 隐藏侧边栏活动浮窗 | CSS 隐藏 | 开启 |

### 视频播放页（video.js）

| 功能 | 实现方式 | 默认状态 |
|------|---------|---------|
| 隐藏播放器内广告/弹窗 | CSS + DOM 移除 | 开启 |
| 精简右侧推荐栏 | 可过滤 UP主推荐、广告视频 | 可配置 |
| 隐藏下方活动横幅 | CSS 隐藏 | 开启 |
| 简化评论区 | 隐藏评论区顶部活动/话题引导 | 可配置 |

### 个人空间/收藏（space.js）

| 功能 | 实现方式 | 默认状态 |
|------|---------|---------|
| 收藏夹批量操作增强 | DOM 注入批量选择/删除按钮 | 开启 |
| 标记已失效视频 | 扫描失效项，高亮显示 | 开启 |
| 精简个人空间页 | 隐藏不必要的模块 | 可配置 |

### 搜索页（search.js）

| 功能 | 实现方式 | 默认状态 |
|------|---------|---------|
| 过滤搜索结果类型 | 可隐藏直播、番剧、用户等类型 | 可配置 |
| 隐藏搜索页广告 | CSS + DOM 移除 | 开启 |

## 配置面板

通过油猴菜单注册「B站优化设置」入口，点击后注入浮动面板。

### 面板特性

- 右侧滑出抽屉式，半透明遮罩背景
- 分 Tab 展示：通用设置 / 首页 / 播放页 / 收藏 / 搜索
- 每个功能项一个开关（toggle switch）
- 配置实时生效，无需刷新页面
- 底部「重置为默认」按钮
- 数据通过 `GM_setValue` 持久化

### 样式隔离

- 使用 Shadow DOM 隔离面板样式，不影响原有页面
- 面板自身采用暗色主题，兼容 B站深色模式

## 核心模块设计

### purifier.js - 净化引擎

```javascript
// 每个净化规则的定义结构
{
  id: 'hide-banner-ad',        // 唯一标识
  name: '隐藏横幅广告',         // 显示名称
  page: 'home',                // 适用页面
  type: 'css' | 'dom',         // 实现类型
  selector: '.banner-ad',      // CSS 选择器
  enabled: true,               // 默认是否开启
  configKey: 'home.hideBanner' // 配置存储路径
}
```

### observer.js - 动态内容监听

- 封装 MutationObserver，支持按选择器注册回调
- 自动去重，避免重复处理
- 提供 `observe(selector, callback)` 和 `disconnect()` 接口

### store.js - 配置存储

- 封装 `GM_setValue` / `GM_getValue`
- 支持按路径读写（如 `home.hideBanner`）
- 配置变更时触发回调（用于实时生效）

## 打包输出

- Rollup 将 `src/` 下所有模块打包为单个 `.user.js`
- 输出文件头部自动拼接 Tampermonkey metadata（`==UserScript==` 块）
- 开发模式支持 watch + 自动刷新

## 后续扩展

- 成熟后迁移为 Manifest V3 浏览器插件
- 可考虑增加播放器增强（快捷键、倍速控制等）
- 可考虑增加数据导出/同步功能
