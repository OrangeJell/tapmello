# Mahjong Tutor v0.4

H5 教学游戏，英语＋印地语。源码仍在独立目录，构建时接入 tapmelo 网站；没有实战或人机对战。

## 本地运行

Node.js 18+，无运行时依赖，不需要安装包：

```sh
cd /Users/chenliangyu/project_cly/gogoGame/mahjong-tutor
npm start
```

打开 [本地游戏](http://127.0.0.1:4198/)。ES modules 需要 HTTP 服务，不支持直接双击 HTML。其他端口可用 `PORT=4200 npm start`。

## 内容

| 等级 | 内容 |
| --- | --- |
| 初级 | 认牌、对子／刻子／顺子、基本胡牌，12 题 |
| 中级 | 吃碰杠、听牌，8 题 |
| 高级 | 七对、十三幺、碰碰胡、清一色、混一色与组合辨识，8 题；最后是七步引导局 |

三个等级均可直接进入。首页另有随机听牌练习和文章入口。教程首次涉及新牌型时，在牌桌内先展示条件与示例；以后可随时查看牌型说明。确认、错误反馈和下一题均在桌内，没有答题二次确认。

七篇图文教程位于游戏内：认识麻将牌与基本组合、基本胡牌与听牌、吃碰杠及回合流程、常见进阶牌型、如何整理手牌、五种常见听牌、吃碰杠怎么选。教程和文章共用 `catalog.js` 牌型资料及 SVG 牌面。

语言、牌名开关、34 种牌谱、本版规则与重置记录集中在设置中。首次默认显示牌名，旧设置继续保留。手机手牌在 375px 使用最多两排，在 320px 使用三排。

## 阅读与练习

七篇文章按零基础读者重写，解释术语、操作顺序和常见误解，提供英印双语及牌例。每篇带页内目录；点击目录只滚动到相应段落，不改变路由或学习记录。牌型条件与示例牌继续使用共享目录。

人机牌桌已按最新要求移除，旧 `#battle/...` 地址回到首页。三级教程、随机听牌、七步教学引导局和学习进度保留。

## 规则与接口

使用 34 种、每种四张，共 136 张牌，无花牌、不计番。约定按本轮产品方案实现，不宣称兼容完整国标或某一地方规则。

- 基本胡牌：四组面子＋一对将；公开杠按实际四张校验。
- 七对：门清的七种不同对子，四张相同牌不算两对。
- 十三幺：十三种幺九字牌各一张，再加其中任意一张；必须门清。
- 碰碰胡：四组刻子或杠子＋一对将。
- 清一色：有效胡牌全部来自一种数牌花色，无字牌。
- 混一色：有效胡牌同时包含一种数牌花色与字牌。
- 兼容牌型同时标记，例如七对＋清一色；不赋予番数。

`analyzeHand(hand, exposed)` 保留原基础判定。`analyzePatterns(hand, exposed, profile)` 返回 `{structures:[{type,groups}], tags}`，无效时返回 `null`。`winningTilesFor(hand, exposed, profile)` 返回全部合法听口。`profile` 为 `basic` 或 `extended`；初中级、引导局和随机练习显式使用基础规则，高级练习使用扩展规则。

## 进度与兼容

`mahjong-tutor.v2` 按稳定题目 ID 保存完成状态、各等级当前位置、引导局步骤、已查看牌型与偏好。普通题刷新保留题号，清空当前选择。

首次读取时自动迁移 `mahjong-tutor.v1` 的已完成章节、当前题之前的已完成题、语言、牌名与引导局步骤。旧引导局完成状态只对应 `guided-round`，不会完成新增高级题。旧 `#lesson/1` 至 `#lesson/6` 跳转到新等级及对应练习。

损坏存档安全回退；存储禁用时仍可在当前页面内学习。重置只清空学习进度，保留语言和牌名设置；旧 v1 存档不会重新激活。

## 文件与验证

| 文件 | 职责 |
| --- | --- |
| `js/app.js` | 路由、页面、交互与暂停定时器 |
| `js/curriculum.js` / `js/lessons.js` | 三等级目录、稳定题目 ID、原有双语题库 |
| `js/catalog.js` / `js/articles.js` | 共享牌型资料、七篇双语长文 |
| `js/tutorial.js` | 答案校验与引导局状态 |
| `js/rules.js` | 基础／扩展胡牌、听口及动作判定 |
| `js/tiles.js` | 共用 SVG 牌面、牌背及双语牌名 |
| `js/storage.js` | 存档校验、迁移与回退 |

```sh
npm test
npm run check:site
```

浏览器验收脚本为 `tests/browser-v2-flow.js`、`tests/browser-reading.js`、`tests/browser-v2-compat.js`，可交给 Playwright CLI 的 `run-code`。当前脚本访问 4173 端口的 `/play/mahjong/`，须先构建并启动网站。在隔离测试会话中运行，脚本会重置该会话的游戏存档。先导航至 `/play/mahjong/?qa=en` 再运行 flow，可完整测试英文流程；默认测试印地语。

测试记录见 [docs/CHECKS.md](docs/CHECKS.md)。本版阅读截图为 `output/v3-*.png`（v2 文件为历史截图）；没有真实 iOS／Android 设备验收。

## 素材

牌面和图标为项目原生 SVG；Outfit 字体使用 SIL Open Font License，见 `assets/OFL.txt`。没有外部字体请求、广告、账号、支付、分析 SDK 或运行时第三方依赖。

## 网站集成（2026-10-30）

网站首页保留 Glass Twist 与 Mahjong 两个入口。`/games/mahjong/` 和 `/hi/games/mahjong/` 嵌入三级练习；七篇文章各有英印静态页面，位于 `/[hi/]guides/mahjong/{id}/`。教程中的文章入口进入对应网站文章，文章末尾可回到相应等级练习。

`js/interface-hi.json`、`js/articles-hi.json` 维护印地语翻译，以英文原文为键；`scripts/prepare-locales.mjs` 在站点构建时生成 `js/hi.js`。`js/locale-copy.js` 保存简体中文、法语、日语和韩语译文。已下线的语言偏好回退到英语，学习记录保留。4198 独立预览和 4173 网站预览各自使用浏览器存储。

网站同步使用白名单，测试与开发截图不进入发布目录。使用 `npm run check:site` 验证当前构建。
