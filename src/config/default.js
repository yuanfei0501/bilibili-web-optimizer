const defaults = {
  general: {
    debug: { value: false, name: '调试模式', desc: '在控制台输出详细日志' },
  },
  home: {
    hideBannerAd: { value: true, name: '隐藏轮播广告', desc: '仅隐藏首页轮播广告' },
    hideTaggedContent: { value: true, name: '隐藏带标签广告', desc: '隐藏首页中番剧、直播、推广等带标签的广告内容' },
  },
  video: {
    hidePlayerAd: { value: true, name: '隐藏播放器广告', desc: '移除播放器内广告/弹窗' },
    hideRecommendAd: { value: true, name: '精简右侧推荐', desc: '过滤推荐中的广告视频' },
    hideActivityBanner: { value: true, name: '隐藏活动横幅', desc: '移除下方活动横幅' },
    hideCommentTopic: { value: false, name: '简化评论区', desc: '隐藏评论区顶部活动/话题引导' },
    enlargeMiniPlayer: { value: true, name: '小窗播放器放大', desc: '滚动时固定的小窗播放器放大，宽度与推荐列表一致' },
  },
  dynamic: {
    widenContent: { value: true, name: '动态页加宽', desc: '加宽动态页主内容区域' },
  },
};

export default defaults;
