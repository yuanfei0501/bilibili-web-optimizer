// ==UserScript==
// @name         B站优化
// @name:en      Bilibili Optimizer
// @namespace    https://github.com/yuanfei0501/bilibili-web-optimizer
// @version      0.2.0
// @description  净化 B站 web 端页面体验 - 隐藏广告、推广、简化界面，可視化配置
// @description:en  Clean up Bilibili web experience - hide ads, promotions, simplify UI with visual config
// @author       yuanfei0501
// @icon         https://www.bilibili.com/favicon.ico
// @match        *://www.bilibili.com/*
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
      hideBannerAd: { value: true, name: '隐藏轮播广告', desc: '仅隐藏首页轮播广告' },
      hideTaggedContent: { value: true, name: '隐藏带标签广告', desc: '隐藏首页中番剧、直播、推广等带标签的广告内容' },
    },
    video: {
      hidePlayerAd: { value: true, name: '隐藏播放器广告', desc: '移除播放器内广告/弹窗' },
      hideRecommendAd: { value: true, name: '精简右侧推荐', desc: '过滤推荐中的广告视频' },
      hideActivityBanner: { value: true, name: '隐藏活动横幅', desc: '移除下方活动横幅' },
      hideCommentTopic: { value: false, name: '简化评论区', desc: '隐藏评论区顶部活动/话题引导' },
      enlargeMiniPlayer: { value: true, name: '小窗播放器放大', desc: '滚动时固定的小窗播放器放大，宽度与推荐列表一致' },
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

  // 仅隐藏轮播广告 + 修复 grid 布局
  const bannerCss = `
  .recommended-swipe,
  .recommended-swipe[data-loc-id] {
    display: none !important;
  }

  .container.is-version8 > .feed-card,
  .container.is-version8 > .floor-single-card,
  .container.is-version8 > .bili-video-card,
  .container.is-version8 > .bili-feed-card,
  .container.is-version8 > .load-more-anchor {
    grid-column: auto !important;
    grid-row: auto !important;
    margin-top: 0 !important;
  }
`;

  // 隐藏带标签的广告内容：推广、直播、番剧、侧边栏活动浮窗
  const taggedContentCss = `
  /* 推广/广告卡 */
  .feed-card:has(.bili-video-card__info--ad),
  .bili-video-card:has(.bili-video-card__info--ad),
  .feed-card:has([class*="sponsor"]),
  .floor-single-card:has([class*="ad"]),
  .recommend-list__item:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  /* 直播推荐 */
  .feed-card:has(.bili-video-card__info--live),
  .bili-live-card,
  [class*="live-recommend"],
  .feed-card:has([data-report="live"]) {
    display: none !important;
  }

  /* 番剧推荐 */
  .feed-card:has(.bili-video-card__info--bangumi),
  [class*="bangumi-recommend"],
  .feed-card:has([data-report="bangumi"]) {
    display: none !important;
  }

  /* 侧边栏活动浮窗 */
  .activity-m,
  .bili-dyn-sidebar,
  .sidebar-wrap .side-bar__item[data-module="activity"] {
    display: none !important;
  }
`;

  const rules$2 = [
    {
      key: 'hideBannerAd',
      type: 'css',
      css: bannerCss,
      styleId: 'bili-opt-home-banner',
    },
    {
      key: 'hideTaggedContent',
      type: 'css',
      css: taggedContentCss,
      styleId: 'bili-opt-home-tagged',
    },
  ];

  function initHomePage() {
    purifier.register('home', rules$2);
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

  const miniPlayerCss = `
  .bpx-player-container[data-screen="mini"] {
    width: 411px !important;
    height: 231px !important;
    bottom: 16px !important;
  }
  .bpx-player-container[data-screen="mini"] .bpx-player-video-area,
  .bpx-player-container[data-screen="mini"] .bpx-player-mini-warp {
    width: 411px !important;
    height: 231px !important;
  }
`;

  const rules$1 = [
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
    {
      key: 'enlargeMiniPlayer',
      type: 'css',
      css: miniPlayerCss,
      styleId: 'bili-opt-video-mini-player',
    },
  ];

  function initVideoPage() {
    purifier.register('video', rules$1);
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
    background: transparent;
    z-index: 2147483647;
    display: flex;
    justify-content: flex-start;
    transition: opacity 0.3s ease;
  }

  .overlay.peeking {
    opacity: 0.03;
  }

  .panel {
    width: 340px;
    max-width: 90vw;
    height: 100vh;
    background: #fff;
    color: #333;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 16px;
    font-weight: 600;
    color: #222;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .eye-btn, .panel-close {
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .eye-btn:hover, .panel-close:hover { background: rgba(0, 0, 0, 0.06); color: #333; }
  .eye-btn svg { width: 18px; height: 18px; }

  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    overflow-x: auto;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    padding: 10px 16px;
    font-size: 13px;
    color: #888;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .tab:hover { color: #333; }
  .tab.active { color: #00a1d6; border-bottom-color: #00a1d6; }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.08); border-radius: 2px; }

  .tab-page { display: none; }
  .tab-page.active { display: block; }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }
  .setting-item:last-child { border-bottom: none; }

  .setting-info { flex: 1; margin-right: 12px; }
  .setting-name { font-size: 14px; color: #333; margin-bottom: 2px; }
  .setting-desc { font-size: 12px; color: #999; }

  .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #ddd; border-radius: 24px; transition: 0.3s;
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
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
  .btn-reset {
    width: 100%; padding: 10px;
    background: rgba(0, 0, 0, 0.04); color: #fb7299;
    border: none; border-radius: 8px;
    font-size: 14px; cursor: pointer;
    transition: background 0.2s;
  }
  .btn-reset:hover { background: rgba(0, 0, 0, 0.08); }
`;

  const TABS = [
    { key: 'general', name: '通用' },
    { key: 'home', name: '首页' },
    { key: 'video', name: '播放页' },
    { key: 'dynamic', name: '动态' },
  ];

  let panelHost = null;

  function createEyeSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z');
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '3');
    svg.appendChild(path);
    svg.appendChild(circle);
    return svg;
  }

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
    const actions = document.createElement('div');
    actions.className = 'header-actions';
    // 小眼睛按钮 - 悬停隐藏面板以便查看页面效果
    const eyeBtn = document.createElement('button');
    eyeBtn.className = 'eye-btn';
    eyeBtn.title = '悬停查看页面效果';
    eyeBtn.appendChild(createEyeSvg());
    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.id = 'bili-opt-close';
    closeBtn.textContent = '\u00d7';
    actions.appendChild(eyeBtn);
    actions.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(actions);

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
    bindEvents(shadow, overlay, eyeBtn);
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

  function bindEvents(shadow, overlay, eyeBtn) {
    shadow.getElementById('bili-opt-close').addEventListener('click', closePanel);

    shadow.querySelector('.overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay')) closePanel();
    });

    // 小眼睛 peek 功能：悬停时面板变透明，方便查看页面效果
    eyeBtn.addEventListener('mouseenter', () => {
      overlay.classList.add('peeking');
    });
    eyeBtn.addEventListener('mouseleave', () => {
      overlay.classList.remove('peeking');
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
    { key: 'dynamic', pattern: /^https?:\/\/t\.bilibili\.com/, init: initDynamicPage },
  ];

  function detectPage() {
    const url = location.href;
    for (const route of ROUTES) {
      if (route.pattern.test(url)) return route;
    }
    return null;
  }

  function createGearSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z');
    svg.appendChild(path);
    return svg;
  }

  function injectFloatingButton() {
    const host = document.createElement('div');
    host.id = 'bili-opt-float-btn';
    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
    .float-btn {
      position: fixed;
      bottom: 80px;
      left: 16px;
      width: 40px;
      height: 40px;
      background: #fb7299;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(251, 114, 153, 0.4);
      transition: all 0.3s;
      z-index: 99999;
    }
    .float-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 16px rgba(251, 114, 153, 0.6);
    }
    .float-btn svg {
      width: 20px;
      height: 20px;
      fill: #fff;
    }
  `;

    const btn = document.createElement('div');
    btn.className = 'float-btn';
    btn.title = 'B站优化设置';
    btn.appendChild(createGearSvg());
    btn.addEventListener('click', openPanel);

    shadow.appendChild(style);
    shadow.appendChild(btn);
    document.body.appendChild(host);
    log('浮动设置按钮已注入');
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

    injectFloatingButton();

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
