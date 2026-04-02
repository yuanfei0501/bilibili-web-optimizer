import { purifier } from '../core/purifier.js';
import { removeElements } from '../utils/dom.js';
import { log } from '../utils/logger.js';

const homeCss = `
  /* 顶部横幅广告 */
  .bili-header__banner,
  #bili-header-banner-img,
  .header-banner__inner,
  .animated-banner {
    display: none !important;
  }

  /* 推荐信息流中的轮播广告 */
  .recommended-swipe,
  .recommended-swipe[data-loc-id] {
    display: none !important;
  }

  /* 首页轮播广告（recommended-swipe） */
  .recommended-swipe,
  .recommended-swipe[data-loc-id],
  .carousel-item[href*="cm.bilibili.com"],
  .carousel-item:has(img.icon[src*="eva.png"]) {
    display: none !important;
  }

  /* 推荐信息流中的广告/推广 */
  .feed-card:has(.bili-video-card__info--ad),
  .bili-video-card:has(.bili-video-card__info--ad),
  .feed-card:has([class*="sponsor"]),
  .floor-single-card:has([class*="ad"]),
  .recommend-list__item:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  /* 侧边栏活动浮窗 */
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
