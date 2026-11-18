# 双游戏首页与 Mahjong 集成验收

日期：2026-10-30。测试对象为本地构建的 `site/dist/`，预览端口 4173。本轮没有线上部署。

## 完成内容

- 依照用户参考图重做首页：暖白底、两列游戏、真实 Glass Twist 截图、共用 SVG 牌面生成的 Mahjong 封面、描边按钮和简洁页脚。375px 及以下改为单列。
- Mahjong 三级练习、随机听牌与七篇文章接入网站。没有实战或人机牌桌。
- 语言选择只保留 English / हिन्दी。翻译资产合计 414 条，题库、牌型、文章与界面静态文案的翻译覆盖检查通过。传统麻将牌面字样保留。
- 七篇文章各有英印静态页面，共增加 16 个可索引页面；构建后的 sitemap 共 26 页。文章与练习共用同一份牌型、示例及反例。
- 原有中文存档偏好回退英语，题目进度、牌名设置仍保留。不同端口的本地存储不互通，不把 4198 预览记录当作 4173 网站记录。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `node site/scripts/build.mjs` | 成功；自动生成 Hindi 模块，白名单同步两款游戏，生成 26 个静态页面 |
| `node site/scripts/check.mjs` | 29 个 HTML、887 个本地链接、图片与分享图尺寸、JSON-LD、语言关联、sitemap 通过 |
| `npm --prefix mahjong-tutor test` | 19 / 19 通过，包括牌型、完整听口、翻译覆盖、存档迁移及原有中文偏好回退 |
| `browser-v2-flow.js` | 英语与印地语各完成 28 道练习、七步引导局，保存全部 29 项进度；错误反馈、提示、单次确认、标签开关与刷新恢复通过 |
| `browser-v2-compat.js` | 六个旧章节链接、v1 迁移、重置、损坏存档、禁用存储、随机练习及全部听口通过 |
| `site/scripts/browser-mahjong.js` | 320、375、768、1440px × 英印首页、麻将入口、七篇文章，共 72 个布局组合无横向溢出；文章目录、共享牌面通过 |
| 网站集成交互 | 嵌入设置切换语言后，父页面和练习切换到对应语言，保持当前题目和完成记录；相关牌型→文章→对应等级练习往返通过 |
| 无 JavaScript | 14 篇英印文章可完整阅读，目录锚点可用 |
| 加载与重试 | 阻断麻将请求后显示超时错误；解除阻断后点击重试恢复；忽略非游戏 iframe 发来的高度消息 |
| `site/scripts/browser-check.js` | 原有 10 个页面 × 320、390、1280px 通过；Glass Twist 开始、拆螺丝、暂停、语言切换、中文偏好迁移、无 JS 指南及 FAQ 通过 |

完整流程和回归测试没有捕获到 JavaScript 页面异常。加载失败测试主动阻断网络，属于预期失败场景。

浏览器验证使用 Chromium 和模拟视口，尚未进行真实 iOS / Android 设备测试。印地语已有完整内容与排版验证，未进行母语编辑人工审校。

## 截图

截图存于项目根目录 `output/playwright/`，不进入发布目录。

- `tapmelo-home-desktop.png`：1360px 英语首页，与参考图核对。
- `tapmelo-home-mobile.png`：375px 英语首页。
- `tapmelo-home-hi-mobile.png`：375px 印地语首页。
- `tapmelo-mahjong-desktop.png`：1440px 麻将入口与文章列表。
- `tapmelo-mahjong-mobile.png`：375px 麻将入口。
- `tapmelo-exercise-mobile.png`：375px 牌桌内的题目、提示与确认按钮。
- `tapmelo-article-hi-mobile.png`：375px 印地语文章与目录。

本次重设计时，发布目录是 `site/dist/`。当前部署和验证流程见 [站点维护文档](README.md)。
