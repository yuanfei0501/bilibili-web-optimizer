# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

B站优化（Bilibili Optimizer）— 一个 Tampermonkey 用户脚本，用于净化 B站 Web 端页面体验。隐藏广告、推广、简化界面，支持可视化配置。

## 构建命令

```bash
npm install        # 安装依赖（仅 rollup）
npm run dev        # watch 模式开发
npm run build      # 构建发布版本到 dist/
```

产出文件：`dist/bilibili-web-optimizer.user.js`（IIFE 格式，带 userscript header）

## 架构

```
src/
├── main.js           # 入口：路由匹配 → 页面初始化 → observer 启动 → SPA 路由监听
├── meta.js           # Userscript metadata（版本号、@match、@grant 等）
├── config/
│   ├── default.js    # 所有页面的默认配置定义（key → value/name/desc）
│   └── store.js      # 配置读写（GM_setValue/GM_getValue），merge 逻辑
├── core/
│   ├── observer.js   # MutationObserver 管理器，watch(selector, callback) 模式
│   └── purifier.js   # 净化引擎：注册规则 → 按配置启用/回退，支持 css/dom/handler 三种规则类型
├── pages/
│   ├── home.js       # 首页（www.bilibili.com）
│   ├── video.js      # 播放页（www.bilibili.com/video/）
│   ├── space.js      # 个人空间/收藏（space.bilibili.com/）
│   ├── search.js     # 搜索页（search.bilibili.com/）
│   └── dynamic.js    # 动态页（t.bilibili.com/）
├── panel/
│   ├── index.js      # 设置面板（Shadow DOM 隔离），通过油猴菜单「B站优化设置」唤起
│   └── style.js      # 面板 CSS（深色主题）
└── utils/
    ├── dom.js        # waitForElement、removeElements、injectStyle、removeStyle
    └── logger.js     # 带 [B站优化] 前缀的日志，受 debug 开关控制
```

### 核心流程

1. **main.js** 根据 URL 正则匹配页面类型（ROUTES 数组）
2. 调用对应 `initXxxPage()`，向 `purifier` 注册净化规则
3. `observer.start()` 启动全局 MutationObserver
4. `purifier.purify(pageKey)` 读取配置，应用/回退规则
5. MutationObserver 监听 DOM 变化 + URL 变化，处理 SPA 导航

### 规则格式

每条规则定义在 pages/*.js 中，格式：
```js
{ key: '配置项key', type: 'css'|'dom', css: 'CSS字符串', styleId: '注入style元素id', handler?: Function }
```
- `type: 'css'` — 注入/移除 style 标签
- `type: 'dom'` — 移除匹配元素或执行 handler

### 配置系统

`default.js` 定义所有配置项（分 general/home/video/space/search/dynamic 页面），每项含 `value`（默认值）、`name`（显示名）、`desc`（描述）。`store.js` 负责持久化到 GM_storage，自动 merge 用户配置与默认值。

## 关键约定

- 使用 `GM_*` API（Tampermonkey 油猴脚本 API），不是标准浏览器 API
- CSS 隐藏优先于 DOM 移除（可逆性更好）
- 设置面板使用 Shadow DOM 隔离样式，避免与宿主页面冲突
- 版本号在 `src/meta.js` 中维护
- ES Module 源码，Rollup 打包为 IIFE
