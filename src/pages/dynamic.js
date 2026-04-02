import { purifier } from '../core/purifier.js';

const dynamicCss = `
  /* 动态页主内容区加宽 */
  .bili-dyn-home--member > main {
    flex-grow: 1 !important;
    min-width: 0 !important;
  }
`;

const rules = [
  {
    key: 'hideBannerAd',
    type: 'css',
    css: dynamicCss,
    styleId: 'bili-opt-dynamic-width',
  },
];

export function initDynamicPage() {
  purifier.register('dynamic', rules);
}
