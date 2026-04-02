import { purifier } from '../core/purifier.js';
import { removeElements } from '../utils/dom.js';
import { log } from '../utils/logger.js';

const videoCss = `
  .bpx-player-toast-wrap,
  .bpx-player-ending-panel:has(.bpx-player-ending-related),
  .bili-player-video-toast-item,
  .bpx-player-promote-wrap {
    display: none !important;
  }

  .recommend-list__item:has(.bili-video-card__info--ad),
  .rec-list:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  .activity-banner-v2,
  .bili-video-page-activity,
  [class*="activity-banner"],
  [class*="operational"] {
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
];

export function initVideoPage() {
  purifier.register('video', rules);
}
