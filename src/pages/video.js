import { purifier } from '../core/purifier.js';
import { removeElements } from '../utils/dom.js';
import { log } from '../utils/logger.js';

const videoCss = `
  /* 推荐列表中的广告卡 */
  .video-card-ad-small,
  .video-card-ad-small-inner,
  .slide-ad-exp {
    display: none !important;
  }

  /* 右下角横幅广告 */
  .right-bottom-banner,
  .ad-floor-exp {
    display: none !important;
  }

  /* 播放器左侧/右侧条形广告 */
  .strip-ad,
  .left-banner {
    display: none !important;
  }

  /* 播放器内推广弹窗 */
  .bpx-player-promote-wrap,
  .bpx-player-toast-wrap,
  .bili-player-video-toast-item {
    display: none !important;
  }
`;

const commentCss = `
  .bb-comment .comment-header,
  .bili-comment .comment-header,
  .comment-topbar,
  [class*="comment-topic"],
  [class*="comment-activity"] {
    display: none !important;
  }
`;

const miniPlayerCss = `
  .bpx-player-container[data-screen="mini"] {
    width: 411px !important;
    height: 231px !important;
    bottom: 16px !important;
    transform: translateX(-10px) !important;
  }
  .bpx-player-container[data-screen="mini"] .bpx-player-video-area,
  .bpx-player-container[data-screen="mini"] .bpx-player-mini-warp {
    width: 411px !important;
    height: 231px !important;
  }
`;

const rules = [
  {
    key: 'hidePlayerAd',
    type: 'css',
    css: videoCss,
    styleId: 'bili-opt-video-player',
  },
  {
    key: 'hideRecommendAd',
    type: 'css',
    css: '',
    styleId: 'bili-opt-video-recommend',
    handler() {
      const count = removeElements('.recommend-list__item:has(.bili-video-card__info--ad)');
      if (count > 0) log('播放页移除了 ' + count + ' 个推荐广告');
    },
  },
  {
    key: 'hideActivityBanner',
    type: 'css',
    css: '',
    styleId: 'bili-opt-video-activity',
  },
  {
    key: 'hideCommentTopic',
    type: 'css',
    css: commentCss,
    styleId: 'bili-opt-video-comment',
  },
  {
    key: 'enlargeMiniPlayer',
    type: 'css',
    css: miniPlayerCss,
    styleId: 'bili-opt-video-mini-player',
  },
];

export function initVideoPage() {
  purifier.register('video', rules);
}
