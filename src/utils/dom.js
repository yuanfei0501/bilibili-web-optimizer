/**
 * 等待指定选择器的元素出现
 */
export function waitForElement(selector, timeout = 10000) {
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
export function removeElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => el.remove());
  return elements.length;
}

/**
 * 注入 CSS 样式
 */
export function injectStyle(css, id) {
  if (id && document.getElementById(id)) return;
  const style = document.createElement('style');
  if (id) style.id = id;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

/**
 * 移除已注入的样式
 */
export function removeStyle(id) {
  document.getElementById(id)?.remove();
}
