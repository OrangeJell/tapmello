# AdSense 注册与发布

发布商 ID：`pub-3446476038629323`。

## 当前实现

- 网站验证仅使用 `ads.txt`。构建时将它复制到 `dist/ads.txt`，发布后位于域名根目录。
- 账号审核状态以 AdSense 后台为准。
- About、Privacy、Terms 已更新为当前注册阶段的实际行为；隐私页保留现有 GA4 说明和统计关闭入口，并明确当前没有广告 Cookie。页面未声称已获批准或已展示广告。

## 发布与申请审核

1. 在项目根目录运行 `node site/scripts/build.mjs` 和 `node site/scripts/check.mjs`。
2. 向现有 Cloudflare Pages 项目上传完整 `site/dist/`。
3. 打开 `https://tapmelo.com/ads.txt`，确认是以下纯文本内容：

   ```text
   google.com, pub-3446476038629323, DIRECT, f08c47fec0942fa0
   ```

4. 回 AdSense 的网站设置选择 `ads.txt` 验证方式，再申请审核。

当前玻璃游戏的试玩奖励在说明弹窗确认后直接发放，取消不发放；没有显示真实广告。网页的奖励、隐私与条款说明已同步此行为。

## 展示广告前

根据实际广告设置更新隐私页，完成后台适用的隐私与同意配置，再接入广告脚本并选择自动广告或广告单元。普通 AdSense 展示广告与游戏的激励广告接口需要分别配置。

官方参考：[网站关联](https://support.google.com/adsense/answer/7584263?hl=zh-Hans)、[ads.txt 指南](https://support.google.com/adsense/answer/12171612?hl=zh-Hans)。
