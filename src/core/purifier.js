import { injectStyle, removeStyle } from '../utils/dom.js';
import { getEnabledKeys } from '../config/store.js';
import { log } from '../utils/logger.js';

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

export const purifier = new PurifierEngine();
