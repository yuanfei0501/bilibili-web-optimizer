import { getConfig } from './config/store.js';
import { setDebug, log } from './utils/logger.js';
import { observer } from './core/observer.js';
import { purifier } from './core/purifier.js';
import { initHomePage } from './pages/home.js';
import { initVideoPage } from './pages/video.js';
import { initSpacePage } from './pages/space.js';
import { initSearchPage } from './pages/search.js';
import { initDynamicPage } from './pages/dynamic.js';
import { openPanel } from './panel/index.js';

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
