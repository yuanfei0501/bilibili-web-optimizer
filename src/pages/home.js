import { purifier } from '../core/purifier.js';

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

const rules = [
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

export function initHomePage() {
  purifier.register('home', rules);
}
