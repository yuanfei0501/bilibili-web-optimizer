import { log } from '../utils/logger.js';

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

export const observer = new ObserverManager();
