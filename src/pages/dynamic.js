import { purifier } from '../core/purifier.js';

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

export function initDynamicPage() {
  purifier.register('dynamic', rules);
}
