import defaults from './default.js';
import { log, warn } from '../utils/logger.js';

const STORAGE_KEY = 'bili_optimizer_config';

export function getConfig() {
  let saved = {};
  try {
    const raw = GM_getValue(STORAGE_KEY, '{}');
    saved = JSON.parse(raw);
  } catch (e) {
    warn('配置读取失败，使用默认值', e);
  }
  return mergeWithDefaults(saved);
}

export function setConfig(page, key, value) {
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

export function resetConfig() {
  saveConfig(mergeWithDefaults({}));
  log('配置已重置为默认值');
}

export function getEnabledKeys(page) {
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
