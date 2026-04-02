const defaults = {
  general: {
    debug: { value: false, name: '调试模式', desc: '在控制台输出详细日志' },
  },
  home: {
    hideBannerAd: { value: true, name: '隐藏横幅广告', desc: '移除顶部 banner 广告' },
    hideSponsor: { value: true, name: '隐藏推广内容', desc: '移除推广/sponsor 内容' },
    hideLiveRecommend: { value: false, name: '隐藏直播推荐', desc: '移除推荐中的直播模块' },
    hideBangumiRecommend: { value: false, name: '隐藏番剧推荐', desc: '移除推荐中的番剧模块' },
    hideSidebarPopup: { value: true, name: '隐藏侧边栏活动浮窗', desc: '移除右侧活动弹窗' },
  },
  video: {
    hidePlayerAd: { value: true, name: '隐藏播放器广告', desc: '移除播放器内广告/弹窗' },
    hideRecommendAd: { value: true, name: '精简右侧推荐', desc: '过滤推荐中的广告视频' },
    hideActivityBanner: { value: true, name: '隐藏活动横幅', desc: '移除下方活动横幅' },
    hideCommentTopic: { value: false, name: '简化评论区', desc: '隐藏评论区顶部活动/话题引导' },
  },
  space: {
    batchOperation: { value: true, name: '批量操作增强', desc: '收藏夹增加批量选择/删除' },
    markInvalid: { value: true, name: '标记失效视频', desc: '高亮显示已失效视频' },
    hideUnnecessaryModules: { value: false, name: '精简个人空间', desc: '隐藏不必要模块' },
  },
  search: {
    hideSearchAd: { value: true, name: '隐藏搜索广告', desc: '移除搜索结果中的广告' },
    filterLive: { value: false, name: '过滤直播结果', desc: '隐藏搜索中的直播类型' },
    filterBangumi: { value: false, name: '过滤番剧结果', desc: '隐藏搜索中的番剧类型' },
    filterUser: { value: false, name: '过滤用户结果', desc: '隐藏搜索中的用户类型' },
  },
};

export default defaults;
