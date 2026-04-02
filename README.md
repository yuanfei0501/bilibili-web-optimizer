# B站优化

净化 B站页面体验的篡改猴脚本。

## 功能

- **首页净化**：隐藏横幅广告、推广内容、直播/番剧推荐、活动浮窗
- **播放页净化**：隐藏播放器广告、精简推荐栏、隐藏活动横幅、简化评论区
- **收藏增强**：批量操作、标记失效视频、精简个人空间
- **搜索净化**：隐藏广告、过滤直播/番剧/用户结果
- **可视化配置**：所有功能可独立开关，实时生效

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 构建：`npm install && npm run build`
3. 打开 `dist/bilibili-web-optimizer.user.js`，复制内容到 Tampermonkey 新脚本
4. 保存并访问 B站

## 开发

```bash
npm install
npm run dev    # watch 模式
npm run build  # 构建发布
```

## 配置

点击油猴菜单中的「B站优化设置」打开配置面板。

## License

MIT
