import { getConfig } from './config/store.js';
import { setDebug, log } from './utils/logger.js';
import { observer } from './core/observer.js';
import { purifier } from './core/purifier.js';
import { initHomePage } from './pages/home.js';
import { initVideoPage } from './pages/video.js';
import { initDynamicPage } from './pages/dynamic.js';
import { openPanel } from './panel/index.js';

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
