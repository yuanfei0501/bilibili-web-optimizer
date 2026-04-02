import { purifier } from '../core/purifier.js';

const searchCss = `
  .video-list-item:has(.bili-video-card__info--ad),
  .search-result-list .video-list-item:has([class*="ad"]),
  [class*="search-ad"],
  .bili-video-card:has(.bili-video-card__info--ad) {
    display: none !important;
  }

  .video-list-item:has(.bili-live-card),
  .search-page-live,
  [data-type="live"] {
    display: none !important;
  }

  .video-list-item:has(.bili-bangumi-card),
  .search-page-bangumi,
  [data-type="bangumi"] {
    display: none !important;
  }

  .video-list-item:has(.bili-user-card),
  .search-page-user,
  [data-type="user"] {
    display: none !important;
  }
`;

const rules = [
  { key: 'hideSearchAd', type: 'css', css: searchCss, styleId: 'bili-opt-search-ad' },
  { key: 'filterLive', type: 'css', css: '', styleId: 'bili-opt-search-live' },
  { key: 'filterBangumi', type: 'css', css: '', styleId: 'bili-opt-search-bangumi' },
  { key: 'filterUser', type: 'css', css: '', styleId: 'bili-opt-search-user' },
];

export function initSearchPage() {
  purifier.register('search', rules);
}
