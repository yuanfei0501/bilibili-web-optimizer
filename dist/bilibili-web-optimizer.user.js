// ==UserScript==
// @name         B站 Web 优化
// @name:en      Bilibili Web Optimizer
// @namespace    https://github.com/yuanfei0501/bilibili-web-optimizer
// @version      0.1.0
// @description  净化 B站 web 端页面体验 - 隐藏广告、推广、简化界面，可視化配置
// @description:en  Clean up Bilibili web experience - hide ads, promotions, simplify UI with visual config
// @author       yuanfei0501
// @match        *://www.bilibili.com/*
// @match        *://search.bilibili.com/*
// @match        *://space.bilibili.com/*
// @match        *://t.bilibili.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// @homepageURL  https://github.com/yuanfei0501/bilibili-web-optimizer
// @supportURL   https://github.com/yuanfei0501/bilibili-web-optimizer/issues
// @updateURL    https://raw.githubusercontent.com/yuanfei0501/bilibili-web-optimizer/main/dist/bilibili-web-optimizer.user.js
// @contributionURL https://github.com/yuanfei0501/bilibili-web-optimizer
// ==/UserScript==

(function () {
  'use strict';

  const defaults = {
    general: {
      debug: { value: false, name: '调试模式', desc: '在控制台输出详细日志' },
    },
    home: {
      hideBannerAd: { value: true, name: '隐藏轮播广告', desc: '移除首页推荐信息流中的轮播广告' },
      hideSponsor: { value: true, name: '隐藏推广内容', desc: '移除推广/sponsor 内容' },
      hideLiveRecommend: { value: false, name: '隐藏直播推荐', desc: '移除推荐中的直播模块' },
      hideBangumiRecommend: { value: false, name: '隐藏番剧推荐', desc: '移除推荐中的番剧模块' },
      hideSidebarPopup: { value: true, name: '隐藏侧边栏活动浮窗', desc: '移除右侧活动弹窗' },
    },
    video: {
      hidePlayerAd: { value: true, name: '隐藏播放器广告', desc: '移除播放器内广告/弹窗' },
      hideRecommendAd: { value: true, name: '精简右侧推荐', desc: '过滤推荐中的广告视频' },
      hideActivityBanner: { value: true, name: '隐藏活动横幅', desc: '移除下方活动横幅' },
      hideCommentTopic: { value: false, name: '简化评论区', desc: '隐藏评论区顶部活动/话题引导' },
    },
    space: {
      batchOperation: { value: true, name: '批量操作增强', desc: '收藏夹增加批量选择/删除' },
      markInvalid: { value: true, name: '标记失效视频', desc: '高亮显示已失效视频' },
      hideUnnecessaryModules: { value: false, name: '精简个人空间', desc: '隐藏不必要模块' },
    },
    search: {
      hideSearchAd: { value: true, name: '隐藏搜索广告', desc: '移除搜索结果中的广告' },
      filterLive: { value: false, name: '过滤直播结果', desc: '隐藏搜索中的直播类型' },
      filterBangumi: { value: false, name: '过滤番剧结果', desc: '隐藏搜索中的番剧类型' },
      filterUser: { value: false, name: '过滤用户结果', desc: '隐藏搜索中的用户类型' },
    },
    dynamic: {
      widenContent: { value: true, name: '动态页加宽', desc: '加宽动态页主内容区域' },
    },
  };

  const PREFIX = '[B站优化]';
  let debug = false;

  function setDebug(val) {
    debug = !!val;
  }

  function log(...args) {
    if (debug) console.log(PREFIX, ...args);
  }

  function warn(...args) {
    console.warn(PREFIX, ...args);
  }

  const STORAGE_KEY = 'bili_optimizer_config';

  function getConfig() {
    let saved = {};
    try {
      const raw = GM_getValue(STORAGE_KEY, '{}');
      saved = JSON.parse(raw);
    } catch (e) {
      warn('配置读取失败，使用默认值', e);
    }
    return mergeWithDefaults(saved);
  }

  function setConfig(page, key, value) {
    const config = getConfig();
    if (!config[page]) {
      warn('未知的配置页面: ' + page);
      return;
    }
    if (!(key in config[page])) {
      warn('未知的配置项: ' + page + '.' + key);
      return;
    }
    config[page][key] = value;
    saveConfig(config);
    log('配置已更新: ' + page + '.' + key + ' = ' + value);
  }

  function resetConfig() {
    saveConfig(mergeWithDefaults({}));
    log('配置已重置为默认值');
  }

  function getEnabledKeys(page) {
    const config = getConfig();
    const pageConfig = config[page];
    if (!pageConfig) return [];
    return Object.entries(pageConfig)
      .filter(([, val]) => val === true)
      .map(([key]) => key);
  }

  function saveConfig(config) {
    GM_setValue(STORAGE_KEY, JSON.stringify(config));
  }

  function mergeWithDefaults(saved) {
    const result = {};
    for (const [page, keys] of Object.entries(defaults)) {
      result[page] = {};
      for (const [key, def] of Object.entries(keys)) {
        result[page][key] = saved[page]?.[key] ?? def.value;
      }
    }
    return result;
  }

  class ObserverManager {
    constructor() {
      this._observer = null;
      this._watchers = new Map();
      this._processed = new WeakSet();
    }

    watch(selector, callback) {
      if (!this._watchers.has(selector)) {
        this._watchers.set(selector, new Set());
      }
      this._watchers.get(selector).add(callback);

      document.querySelectorAll(selector).forEach((el) => {
        if (!this._processed.has(el)) {
          this._processed.add(el);
          callback(el);
        }
      });

      return this;
    }

    start() {
      if (this._observer) return this;

      this._observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            this._checkNode(node);
          }
        }
      });

      this._observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      log('Observer 已启动，监听 ' + this._watchers.size + ' 个选择器');
      return this;
    }

    stop() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      log('Observer 已停止');
      return this;
    }

    _checkNode(node) {
      for (const [selector, callbacks] of this._watchers) {
        if (node.matches?.(selector) && !this._processed.has(node)) {
          this._processed.add(node);
          callbacks.forEach((cb) => cb(node));
        }
        node.querySelectorAll?.(selector).forEach((el) => {
          if (!this._processed.has(el)) {
            this._processed.add(el);
            callbacks.forEach((cb) => cb(el));
          }
        });
      }
    }
  }

  const observer = new ObserverManager();

  /**
   * 等待指定选择器的元素出现
   */
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * 批量移除匹配选择器的元素
   */
  function removeElements(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
    return elements.length;
  }

  /**
   * 注入 CSS 样式
   */
  function injectStyle(css, id) {
    if (id && document.getElementById(id)) return;
    const style = document.createElement('style');
    if (id) style.id = id;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /**
   * 移除已注入的样式
   */
  function removeStyle(id) {
    document.getElementById(id)?.remove();
  }

  class PurifierEngine {
    constructor() {
      this._rules = new Map();
    }

    register(page, rules) {
      this._rules.set(page, rules);
      log('已注册 ' + page + ' 页面的 ' + rules.length + ' 条净化规则');
    }

    async purify(page) {
      const rules = this._rules.get(page);
      if (!rules) return;

      const enabledKeys = new Set(getEnabledKeys(page));

      for (const rule of rules) {
        if (enabledKeys.has(rule.key)) {
          this._applyRule(rule);
        } else {
          this._revertRule(rule);
        }
      }

      log(page + ' 页面净化完成');
    }

    _applyRule(rule) {
      if (rule.type === 'css' && rule.css && rule.styleId) {
        injectStyle(rule.css, rule.styleId);
      } else if (rule.type === 'dom' && rule.selector) {
        rule.handler
          ? rule.handler()
          : document.querySelectorAll(rule.selector).forEach((el) => el.remove());
      } else if (rule.handler) {
        rule.handler();
      }
    }

    _revertRule(rule) {
      if (rule.type === 'css' && rule.styleId) {
        removeStyle(rule.styleId);
      }
    }
  }

  const purifier = new PurifierEngine();

  var purifier$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    purifier: purifier
  });

  const homeCss = `
  /* 隐藏轮播广告 */
  .recommended-swipe,
  .recommended-swipe[data-loc-id] {
    display: none !important;
  }

  /* 修复隐藏轮播后 grid 布局错位：重置所有卡片为自动排列 + 统一 margin */
  .container.is-version8 > .feed-card,
  .container.is-version8 > .floor-single-card,
  .container.is-version8 > .bili-video-card,
  .container.is-version8 > .bili-feed-card,
  .container.is-version8 > .load-more-anchor {
    grid-column: auto !important;
    grid-row: auto !important;
    margin-top: 0 !important;
  }

  /* 推荐信息流中的广告/推广 */
  .feed-card:has(.bili-video-card__info--ad),
  .bili-video-card:has(.bili-video-card__info--ad),
  .feed-card:has([class*="sponsor"]),
  .floor-single-card:has([class*="ad"]),
  .recommend-list__item:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  /* 侧边栏活动浮窗 */
  .activity-m,
  .bili-dyn-sidebar,
  .sidebar-wrap .side-bar__item[data-module="activity"] {
    display: none !important;
  }
`;

  const liveCss = `
  .feed-card:has(.bili-video-card__info--live),
  .bili-live-card,
  [class*="live-recommend"],
  .feed-card:has([data-report="live"]) {
    display: none !important;
  }
`;

  const bangumiCss = `
  .feed-card:has(.bili-video-card__info--bangumi),
  [class*="bangumi-recommend"],
  .feed-card:has([data-report="bangumi"]) {
    display: none !important;
  }
`;

  const rules$4 = [
    {
      key: 'hideBannerAd',
      type: 'css',
      css: homeCss,
      styleId: 'bili-opt-home-banner',
    },
    {
      key: 'hideSponsor',
      type: 'css',
      css: '',
      styleId: 'bili-opt-home-sponsor',
      handler() {
        const count = removeElements('.bili-video-card__info--ad');
        if (count > 0) log('首页移除了 ' + count + ' 个推广内容');
      },
    },
    {
      key: 'hideLiveRecommend',
      type: 'css',
      css: liveCss,
      styleId: 'bili-opt-home-live',
    },
    {
      key: 'hideBangumiRecommend',
      type: 'css',
      css: bangumiCss,
      styleId: 'bili-opt-home-bangumi',
    },
    {
      key: 'hideSidebarPopup',
      type: 'css',
      css: '',
      styleId: 'bili-opt-home-sidebar',
    },
  ];

  function initHomePage() {
    purifier.register('home', rules$4);
  }

  const videoCss = `
  /* 推荐列表中的广告卡 */
  .video-card-ad-small,
  .video-card-ad-small-inner,
  .slide-ad-exp {
    display: none !important;
  }

  /* 右下角横幅广告 */
  .right-bottom-banner,
  .ad-floor-exp {
    display: none !important;
  }

  /* 播放器左侧/右侧条形广告 */
  .strip-ad,
  .left-banner {
    display: none !important;
  }

  /* 播放器内推广弹窗 */
  .bpx-player-promote-wrap,
  .bpx-player-toast-wrap,
  .bili-player-video-toast-item {
    display: none !important;
  }
`;

  const commentCss = `
  .bb-comment .comment-header,
  .bili-comment .comment-header,
  .comment-topbar,
  [class*="comment-topic"],
  [class*="comment-activity"] {
    display: none !important;
  }
`;

  const rules$3 = [
    {
      key: 'hidePlayerAd',
      type: 'css',
      css: videoCss,
      styleId: 'bili-opt-video-player',
    },
    {
      key: 'hideRecommendAd',
      type: 'css',
      css: '',
      styleId: 'bili-opt-video-recommend',
      handler() {
        const count = removeElements('.recommend-list__item:has(.bili-video-card__info--ad)');
        if (count > 0) log('播放页移除了 ' + count + ' 个推荐广告');
      },
    },
    {
      key: 'hideActivityBanner',
      type: 'css',
      css: '',
      styleId: 'bili-opt-video-activity',
    },
    {
      key: 'hideCommentTopic',
      type: 'css',
      css: commentCss,
      styleId: 'bili-opt-video-comment',
    },
  ];

  function initVideoPage() {
    purifier.register('video', rules$3);
  }

  const spaceCss = `
  .space-between .section,
  .space-right .section-video + .section,
  .s-space .col-2 .section:last-child {
    display: none !important;
  }

  .bili-opt-invalid {
    opacity: 0.5;
    position: relative;
  }
  .bili-opt-invalid::after {
    content: '已失效';
    position: absolute;
    top: 4px;
    right: 4px;
    background: #fb7299;
    color: #fff;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

  const batchCss = `
  .bili-opt-batch-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 16px;
    background: #f4f5f7;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .bili-opt-batch-bar button {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  .bili-opt-btn-select { background: #00a1d6; color: #fff; }
  .bili-opt-btn-select:hover { background: #00b5e5; }
  .bili-opt-btn-delete { background: #fb7299; color: #fff; }
  .bili-opt-btn-delete:hover { background: #fc8bab; }
  .bili-opt-btn-cancel { background: #e3e5e7; color: #333; }
  .bili-opt-selected { outline: 3px solid #00a1d6; outline-offset: -3px; }
`;

  const rules$2 = [
    {
      key: 'batchOperation',
      type: 'dom',
      handler() { injectBatchBar(); },
    },
    {
      key: 'markInvalid',
      type: 'css',
      css: spaceCss + batchCss,
      styleId: 'bili-opt-space',
      handler() { markInvalidVideos(); },
    },
    {
      key: 'hideUnnecessaryModules',
      type: 'css',
      css: '',
      styleId: 'bili-opt-space-modules',
    },
  ];

  let batchMode = false;
  const selectedItems = new Set();

  async function injectBatchBar() {
    const container = await waitForElement('.fav-video-list, .favlist-main .fav-video-list', 5000);
    if (!container) return;
    if (document.querySelector('.bili-opt-batch-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'bili-opt-batch-bar';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'bili-opt-btn-select';
    toggleBtn.id = 'bili-opt-toggle-batch';
    toggleBtn.textContent = '开启批量选择';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'bili-opt-btn-delete';
    deleteBtn.id = 'bili-opt-delete-selected';
    deleteBtn.style.display = 'none';
    deleteBtn.textContent = '删除选中';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'bili-opt-btn-cancel';
    cancelBtn.id = 'bili-opt-cancel-batch';
    cancelBtn.style.display = 'none';
    cancelBtn.textContent = '取消';

    const countSpan = document.createElement('span');
    countSpan.className = 'bili-opt-count';
    countSpan.style.cssText = 'display:none;font-size:13px;color:#999;';
    const countB = document.createElement('b');
    countB.textContent = '0';
    countSpan.appendChild(document.createTextNode('已选择 '));
    countSpan.appendChild(countB);
    countSpan.appendChild(document.createTextNode(' 项'));

    bar.appendChild(toggleBtn);
    bar.appendChild(deleteBtn);
    bar.appendChild(cancelBtn);
    bar.appendChild(countSpan);

    container.parentElement.insertBefore(bar, container);

    toggleBtn.addEventListener('click', () => {
      batchMode = !batchMode;
      toggleBatchMode(container);
    });

    deleteBtn.addEventListener('click', () => {
      if (selectedItems.size === 0) return;
      if (confirm('确定删除选中的 ' + selectedItems.size + ' 个视频？')) {
        deleteSelectedItems();
      }
    });

    cancelBtn.addEventListener('click', () => {
      batchMode = false;
      toggleBatchMode(container);
    });

    log('收藏夹批量操作栏已注入');
  }

  function toggleBatchMode(container) {
    const toggleBtn = document.getElementById('bili-opt-toggle-batch');
    const deleteBtn = document.getElementById('bili-opt-delete-selected');
    const cancelBtn = document.getElementById('bili-opt-cancel-batch');
    const countSpan = document.querySelector('.bili-opt-count');

    if (batchMode) {
      toggleBtn.textContent = '全选';
      deleteBtn.style.display = '';
      cancelBtn.style.display = '';
      countSpan.style.display = '';
      container.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', onItemToggle);
      });
    } else {
      toggleBtn.textContent = '开启批量选择';
      deleteBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      countSpan.style.display = 'none';
      selectedItems.clear();
      container.querySelectorAll('.bili-opt-selected').forEach((el) => el.classList.remove('bili-opt-selected'));
      container.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
        item.style.cursor = '';
        item.removeEventListener('click', onItemToggle);
      });
    }
  }

  function onItemToggle(e) {
    if (!batchMode) return;
    const item = e.currentTarget;
    if (selectedItems.has(item)) {
      selectedItems.delete(item);
      item.classList.remove('bili-opt-selected');
    } else {
      selectedItems.add(item);
      item.classList.add('bili-opt-selected');
    }
    updateCount();
  }

  function updateCount() {
    const countEl = document.querySelector('.bili-opt-count b');
    if (countEl) countEl.textContent = String(selectedItems.size);
  }

  function deleteSelectedItems() {
    selectedItems.forEach((item) => {
      const delBtn = item.querySelector('.fav-delete, [title="删除"]');
      if (delBtn) delBtn.click();
    });
    selectedItems.clear();
    updateCount();
    log('批量删除完成');
  }

  function markInvalidVideos() {
    document.querySelectorAll('.fav-video-item, .video-list-item').forEach((item) => {
      const invalid = item.querySelector('.invalid, [class*="invalid"], .fav-invalid');
      const text = item.textContent || '';
      if (invalid || text.includes('已失效') || text.includes('失效')) {
        item.classList.add('bili-opt-invalid');
      }
    });
    log('失效视频标记完成');
  }

  function initSpacePage() {
    purifier.register('space', rules$2);
  }

  const searchCss = `
  .video-list-item:has(.bili-video-card__info--ad),
  .search-result-list .video-list-item:has([class*="ad"]),
  [class*="search-ad"],
  .bili-video-card:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  .video-list-item:has(.bili-live-card),
  .search-page-live,
  [data-type="live"] {
    display: none !important;
  }

  .video-list-item:has(.bili-bangumi-card),
  .search-page-bangumi,
  [data-type="bangumi"] {
    display: none !important;
  }

  .video-list-item:has(.bili-user-card),
  .search-page-user,
  [data-type="user"] {
    display: none !important;
  }
`;

  const rules$1 = [
    { key: 'hideSearchAd', type: 'css', css: searchCss, styleId: 'bili-opt-search-ad' },
    { key: 'filterLive', type: 'css', css: '', styleId: 'bili-opt-search-live' },
    { key: 'filterBangumi', type: 'css', css: '', styleId: 'bili-opt-search-bangumi' },
    { key: 'filterUser', type: 'css', css: '', styleId: 'bili-opt-search-user' },
  ];

  function initSearchPage() {
    purifier.register('search', rules$1);
  }

  const dynamicCss = `
  /* 动态页主内容区适度加宽，不完全填满 */
  .bili-dyn-home--member > main {
    flex: 1 1 0% !important;
    max-width: 960px !important;
  }
`;

  const rules = [
    {
      key: 'widenContent',
      type: 'css',
      css: dynamicCss,
      styleId: 'bili-opt-dynamic-width',
    },
  ];

  function initDynamicPage() {
    purifier.register('dynamic', rules);
  }

  const panelCSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    display: flex;
    justify-content: flex-end;
  }

  .panel {
    width: 380px;
    max-width: 90vw;
    height: 100vh;
    background: #1a1a2e;
    color: #e0e0e0;
    display: flex;
    flex-direction: column;
    box-shadow: -4px 0 20px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #2a2a4a;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .panel-close {
    background: none;
    border: none;
    color: #999;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .panel-close:hover { background: #2a2a4a; color: #fff; }

  .tabs {
    display: flex;
    border-bottom: 1px solid #2a2a4a;
    overflow-x: auto;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    padding: 10px 16px;
    font-size: 13px;
    color: #999;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .tab:hover { color: #e0e0e0; }
  .tab.active { color: #00a1d6; border-bottom-color: #00a1d6; }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 2px; }

  .tab-page { display: none; }
  .tab-page.active { display: block; }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #22223a;
  }
  .setting-item:last-child { border-bottom: none; }

  .setting-info { flex: 1; margin-right: 12px; }
  .setting-name { font-size: 14px; color: #e0e0e0; margin-bottom: 2px; }
  .setting-desc { font-size: 12px; color: #777; }

  .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #3a3a5a; border-radius: 24px; transition: 0.3s;
  }
  .toggle-slider::before {
    content: "";
    position: absolute; height: 18px; width: 18px;
    left: 3px; bottom: 3px;
    background: #fff; border-radius: 50%; transition: 0.3s;
  }
  .toggle input:checked + .toggle-slider { background: #00a1d6; }
  .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

  .panel-footer {
    padding: 16px 20px;
    border-top: 1px solid #2a2a4a;
  }
  .btn-reset {
    width: 100%; padding: 10px;
    background: #2a2a4a; color: #fb7299;
    border: none; border-radius: 8px;
    font-size: 14px; cursor: pointer;
    transition: background 0.2s;
  }
  .btn-reset:hover { background: #3a3a5a; }
`;

  const TABS = [
    { key: 'general', name: '通用' },
    { key: 'home', name: '首页' },
    { key: 'video', name: '播放页' },
    { key: 'space', name: '收藏' },
    { key: 'search', name: '搜索' },
  ];

  let panelHost = null;

  function openPanel() {
    if (panelHost) { closePanel(); return; }

    panelHost = document.createElement('div');
    panelHost.id = 'bili-opt-panel-host';
    const shadow = panelHost.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = panelCSS;
    shadow.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const panel = document.createElement('div');
    panel.className = 'panel';

    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    const title = document.createElement('span');
    title.textContent = 'B站优化设置';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.id = 'bili-opt-close';
    closeBtn.textContent = '\u00d7';
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    TABS.forEach((t, i) => {
      const tab = document.createElement('div');
      tab.className = 'tab' + (i === 0 ? ' active' : '');
      tab.dataset.tab = t.key;
      tab.textContent = t.name;
      tabs.appendChild(tab);
    });

    // Tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    const config = getConfig();
    TABS.forEach((t, i) => {
      const page = document.createElement('div');
      page.className = 'tab-page' + (i === 0 ? ' active' : '');
      page.dataset.page = t.key;
      buildSettingItems(t.key, config, page);
      tabContent.appendChild(page);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'panel-footer';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-reset';
    resetBtn.id = 'bili-opt-reset';
    resetBtn.textContent = '重置为默认';
    footer.appendChild(resetBtn);

    panel.appendChild(header);
    panel.appendChild(tabs);
    panel.appendChild(tabContent);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    shadow.appendChild(overlay);

    document.body.appendChild(panelHost);
    bindEvents(shadow);
    log('配置面板已打开');
  }

  function closePanel() {
    if (panelHost) {
      panelHost.remove();
      panelHost = null;
      log('配置面板已关闭');
    }
  }

  function buildSettingItems(page, config, container) {
    const pageDefaults = defaults[page];
    if (!pageDefaults) {
      const p = document.createElement('p');
      p.style.color = '#777';
      p.textContent = '暂无配置项';
      container.appendChild(p);
      return;
    }

    const pageConfig = config[page] || {};
    for (const [key, def] of Object.entries(pageDefaults)) {
      const item = document.createElement('div');
      item.className = 'setting-item';

      const info = document.createElement('div');
      info.className = 'setting-info';
      const name = document.createElement('div');
      name.className = 'setting-name';
      name.textContent = def.name;
      const desc = document.createElement('div');
      desc.className = 'setting-desc';
      desc.textContent = def.desc;
      info.appendChild(name);
      info.appendChild(desc);

      const toggle = document.createElement('label');
      toggle.className = 'toggle';
      const input = document.createElement('input');
      input.type = 'checkbox';
      if (pageConfig[key]) input.checked = true;
      input.dataset.page = page;
      input.dataset.key = key;
      const slider = document.createElement('span');
      slider.className = 'toggle-slider';
      toggle.appendChild(input);
      toggle.appendChild(slider);

      item.appendChild(info);
      item.appendChild(toggle);
      container.appendChild(item);
    }
  }

  function bindEvents(shadow) {
    shadow.getElementById('bili-opt-close').addEventListener('click', closePanel);

    shadow.querySelector('.overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay')) closePanel();
    });

    shadow.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        shadow.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        shadow.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        const target = shadow.querySelector('.tab-page[data-page="' + tab.dataset.tab + '"]');
        if (target) target.classList.add('active');
      });
    });

    shadow.querySelectorAll('.toggle input').forEach((input) => {
      input.addEventListener('change', () => {
        const page = input.dataset.page;
        const key = input.dataset.key;
        setConfig(page, key, input.checked);
        Promise.resolve().then(function () { return purifier$1; }).then(({ purifier }) => {
          purifier.purify(page);
        });
      });
    });

    shadow.getElementById('bili-opt-reset').addEventListener('click', () => {
      if (confirm('确定重置所有设置为默认值？')) {
        resetConfig();
        closePanel();
        location.reload();
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  const ROUTES = [
    { key: 'home', pattern: /^https?:\/\/www\.bilibili\.com\/?$/, init: initHomePage },
    { key: 'video', pattern: /^https?:\/\/www\.bilibili\.com\/video\//, init: initVideoPage },
    { key: 'space', pattern: /^https?:\/\/space\.bilibili\.com\//, init: initSpacePage },
    { key: 'search', pattern: /^https?:\/\/search\.bilibili\.com\//, init: initSearchPage },
    { key: 'dynamic', pattern: /^https?:\/\/t\.bilibili\.com/, init: initDynamicPage },
  ];

  function detectPage() {
    const url = location.href;
    for (const route of ROUTES) {
      if (route.pattern.test(url)) return route;
    }
    return null;
  }

  async function main() {
    const config = getConfig();
    setDebug(config.general.debug);

    log('B站优化脚本启动 ' + location.href);

    const page = detectPage();
    if (!page) {
      log('当前页面不在优化范围内');
      return;
    }

    log('检测到页面类型: ' + page.key);
    page.init();
    observer.start();
    await purifier.purify(page.key);

    // 监听 SPA 路由变化
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        log('SPA 路由变化 ' + location.href);
        handleRouteChange();
      }
    });
    urlObserver.observe(document, { subtree: true, childList: true });

    GM_registerMenuCommand('B站优化设置', openPanel);

    log('初始化完成');
  }

  async function handleRouteChange() {
    observer.stop();
    const page = detectPage();
    if (page) {
      page.init();
      observer.start();
      await purifier.purify(page.key);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();
