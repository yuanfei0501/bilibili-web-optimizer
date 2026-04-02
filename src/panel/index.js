import { panelCSS } from './style.js';
import defaults from '../config/default.js';
import { getConfig, setConfig, resetConfig } from '../config/store.js';
import { log } from '../utils/logger.js';

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

export function openPanel() {
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

export function closePanel() {
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
      import('../core/purifier.js').then(({ purifier }) => {
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
