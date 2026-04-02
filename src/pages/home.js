import { purifier } from '../core/purifier.js';
import { removeElements } from '../utils/dom.js';
import { log } from '../utils/logger.js';

const homeCss = `
  .bili-banner__ad,
  .header-banner__wrap,
  .bili-header__banner[data-report="banner"] {
    display: none !important;
  }

  .feed-card:has(.bili-video-card__info--ad),
  .bili-video-card:has(.bili-video-card__info--ad),
  .feed-card:has([class*="sponsor"]),
  .floor-single-card:has([class*="ad"]),
  .recommend-list__item:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  .activity-m,
  .bili-dyn-sidebar,
  .sidebar-wrap .side-bar__item[data-module="activity"] {
    display: none !important;
  }
`;

const liveCss = `
  .feed-card:has(.bili-video-card__info--live),
  .bili-live-card,
  [class*="live-recommend"],
  .feed-card:has([data-report="live"]) {
    display: none !important;
  }
`;

const bangumiCss = `
  .feed-card:has(.bili-video-card__info--bangumi),
  [class*="bangumi-recommend"],
  .feed-card:has([data-report="bangumi"]) {
    display: none !important;
  }
`;

const rules = [
  {
    key: 'hideBannerAd',
    type: 'css',
    css: homeCss,
    styleId: 'bili-opt-home-banner',
  },
  {
    key: 'hideSponsor',
    type: 'css',
    css: '',
    styleId: 'bili-opt-home-sponsor',
    handler() {
      const count = removeElements('.bili-video-card__info--ad');
      if (count > 0) log('首页移除了 ' + count + ' 个推广内容');
    },
  },
  {
    key: 'hideLiveRecommend',
    type: 'css',
    css: liveCss,
    styleId: 'bili-opt-home-live',
  },
  {
    key: 'hideBangumiRecommend',
    type: 'css',
    css: bangumiCss,
    styleId: 'bili-opt-home-bangumi',
  },
  {
    key: 'hideSidebarPopup',
    type: 'css',
    css: '',
    styleId: 'bili-opt-home-sidebar',
  },
];

export function initHomePage() {
  purifier.register('home', rules);
}
