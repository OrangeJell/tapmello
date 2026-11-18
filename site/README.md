# tapmelo 网站

手机优先的静态游戏站，正式地址为 https://tapmelo.com/，由 Jelly 个人运营。站内页面支持 13 种语言。自研游戏支持英语和印地语，从新增语言页面打开时使用英文界面。旧中文游戏偏好回退到英语，读取原有进度。

## 本地构建与预览

在项目根目录执行：

```sh
npm --prefix site ci
npm --prefix site run build
npm --prefix site run serve
```

首页：http://127.0.0.1:4173/ 。Marble Sort：http://127.0.0.1:4173/games/marble-sort/ 。Glass Twist：http://127.0.0.1:4173/games/screw-sort/ ，Mahjong：http://127.0.0.1:4173/games/mahjong/ 。印地语版本：http://127.0.0.1:4173/hi/games/screw-sort/ 。游戏使用 ES modules，必须通过 HTTP 访问。

游戏发现页在 `/games/`（全部游戏）、`/games/category/{id}/`（按分类）、`/tags/`（全部标签及游戏数）和 `/tags/{id}/`（按标签），语言版页面使用对应前缀，例如 `/hi`、`/zh-cn` 和 `/ja`。构建时共用 `src/discovery.mjs`：合作游戏读取 `src/playgama-games.json` 的 `metadata.genres` 和 `metadata.tags`，原创游戏使用该模块内的分类和标签。独立嵌入播放器不加载站点导航。

构建需要 Node.js 20.19 或更新版本。站内翻译从本地 JSON 读取，构建完成后可直接用静态文件服务预览。

## 语言资源与测试

- `src/languages.mjs` 管理 13 种站内语言。英语使用根路径，印地语沿用 `/hi/`，简体中文使用 `/zh-cn/`。切换语言时打开当前页面的对应译本。
- `src/translations/` 保存新增语言的站内文案。英语原文来自现有模板和内容库，印地语 JSON 补充四个站务页面。播放器继续读取各游戏的原有语言资源。
- 改动英文站内文案后，用 `node site/scripts/build.mjs --extract-locales` 列出待翻译的原文。用 `--extract-hi-info` 获取印地语站务页需要的原文。构建会指出缺失译文或占位符不一致的位置。

日常运行三款游戏的 `npm test`，并运行英文浏览器回归。浏览器检查使用 Google Chrome，需要先启动本地预览。

```sh
npm --prefix site run check:browser            # 英文完整回归
npm --prefix site run check:locale -- zh-CN,ja  # 按语言冒烟
npm --prefix site run check:locale             # 全部非英文语言冒烟
```

修改译文时只需运行受影响语言的冒烟。发布前或修改共用语言逻辑时运行全部非英文语言冒烟。每次 `npm run build` 都会检查所有站内语言的链接、声明、目录和 sitemap。

## 游戏详情页标准

以 Nuts Puzzle 英文详情页为样板。首页和游戏详情页共用精简页眉，左侧显示 tapmelo，右侧用地球图标切换语言。

- 桌面端左侧留窄边，主栏放播放器，右侧是双列游戏推荐。手机先显示玩家当前打开的游戏，双列推荐放在详情内容之后。推荐图标在悬停或键盘聚焦时显示游戏名，有短视频时播放预览。
- 玩家点击 Play 后才加载游戏。手机直接铺满可用屏幕，底部只显示小头像和标题。桌面可通过标题栏进入全屏。游戏内菜单默认贴在左上角，第一次点击浮出，第二次展开返回详情、首页和搜索。搜索从左侧打开，可查玩法和常见问题，关掉抽屉后继续同一局。
- 播放器下方是站内随机推荐。将来有广告填充时可用这个位置，空广告位不占空间。
- 正文顺序为游戏标题与统计、游戏一览、游戏介绍、玩法、常见问题。统计缺数据时显示暂无数据。介绍、玩法和问答使用每款游戏的实际规则，正文不放外链。

所有游戏详情页统一用 `src/standard-detail.mjs` 的 `renderStandardDetail(lang, game, content)` 生成正文。模板接收游戏 ID、标题、分类、封面及尺寸、iframe 地址，以及可选的横版封面和预览视频。每种语言的内容提供介绍段落、带小标题的操作步骤和问答，控件由模板翻译。游戏页样式和交互在 `src/assets/standard-detail.css` 和 `src/assets/standard-detail.js`。Nuts Puzzle 的记录在 Playgama JSON 里，可作为长文案的接入示例。

Playgama 游戏的数据只维护在 `src/playgama-games.json`。在数组末尾添加一条记录后运行构建即可生成详情页、首页图标和站内推荐候选。新增英语内容需补齐其他站内语言的词库。每条记录包含：

- `id`、`title`、`url` 和 `category.en/hi`。用导出的 slug 当 ID，保留游戏地址里的 `clid`。
- `width`、`height` 是图标尺寸；`media.icon`、`media.artwork`、`media.artworkWidth`、`media.artworkHeight` 分别指图标、横版图片和横版图片尺寸。`media.preview` 可设为 `null`。媒体地址支持 `/assets/` 或 HTTPS，`media.sources` 保留原始图像链接和视频 ID，便于以后更新。有视频时默认同时展示图片和视频。设置 `media.artworkAsPosterOnly: true` 时，图片只用作视频封面；没有视频时仍单独展示图片。
- `details.en` 和 `details.hi` 各自维护搜索摘要 `summary`、介绍标题 `aboutTitle`、介绍段落 `about`、玩法步骤 `steps` 和问答 `faq`。可选的 `searchTitle` 用于搜索结果标题，`title` 字符串数组用于把播放器标题分成两行。
- `metadata` 保留 Playgama 导出的 `mobileReady`、`gender`、`inGamePurchases`、`supportedLanguages`、`genres` 与 `tags`，由模板在简介卡片统一显示。游戏内语言单独列出。

合作游戏的站内语言版本进入 sitemap，各自有 canonical 和双向 hreflang。三个自研游戏的独立播放器保留 `noindex, follow`。

首页首屏渲染 24 个图标，接近列表底部时挂载下一批。也可点击“Load more games”，禁用 JavaScript 时仍可从静态图标进入其余游戏。自制游戏经 `src/game-stage.mjs` 接入共用模板，保留原本的加载、重试和攻略入口。

## 源码与发布文件

| 位置 | 职责 |
| --- | --- |
| `src/locales.mjs` | 英语、印地语首页、教程、策略、奖励说明、FAQ |
| `src/level-2-guide.mjs` | 第二关独立攻略的英语、印地语正文与页面 |
| `src/game.mjs` | 读取真实关卡、规则、关卡名称；提供统一截图路径与更新日期 |
| `src/render.mjs` | 共用页面模板、导航、页脚、元数据、结构化数据与关卡表 |
| `src/info/*.html` | About、Contact、Privacy、Terms 的正文 |
| `src/assets/styles.css` | 网站样式；已移除旧预留游戏页的无用样式 |
| `src/assets/home.css` | 首页专用布局、游戏入口、响应式与减少动态效果样式，仅首页加载 |
| `src/assets/fonts/` | 本地 Outfit 可变字体及 SIL Open Font License；构建复制到发布目录 |
| `scripts/build.mjs` | 同步游戏、生成静态页面及 sitemap |
| `scripts/sync-game.mjs` | 仅同步游戏与共用统计／收藏脚本 |
| `scripts/check.mjs` | 检查链接、锚点、ID、图片尺寸、JSON、关卡数据、sitemap、语言声明和发布目录 |
| `scripts/capture-screenshots.js` | Playwright CLI 截图函数，使用真实页面点击 |
| `scripts/capture-level-2.js` | 第二关六步开局、三步换色与中段暂存的真实操作截图 |
| `scripts/browser-check.js` | Playwright CLI 排版、语言、iframe、FAQ、旧存档和无 JS 检查函数 |
| `dist/` | 可直接上传到 Cloudflare Pages 的完整静态发布目录 |

修改网页时编辑 `src/`，然后运行完整构建。不要直接修改生成的页面和 `dist/assets/styles.css`。图片、品牌图标、manifest 和重定向规则当前直接维护于 `dist/`；统计和收藏脚本来自游戏共享源文件。

源游戏在 `../screw-sort-game/`，不要修改 `dist/play/screw-sort/` 副本。发布白名单统一位于 `../screw-sort-game/scripts/release-files.mjs`，缓存版本和同步使用同一份清单；测试、求解器、生成器、开发截图不进入发布目录。

## 当前版本（2026-10-09）

玻璃关卡从真实数据生成；第一关用于教学，第二关为花叶主题，后续逐步增加暂存规划与拆解顺序的难度。网页难度表从真实关卡生成。关卡按顺序推进，关卡号仅作显示，没有选关入口。

初始两盒、五个暂存槽，三颗同色装满一个盒子。最多四盒、七槽；暂存满后立即卡关，先加盒续局，四盒全部打开后可逐次加槽续局，四盒七槽都满时只能重开。融玻璃每局一次，玻璃消失而螺丝保留。当前没有清孔道具。

试玩奖励先显示说明，确认后直接发放，取消不改变状态，没有接入广告。存档在 `screw-sort.glass.v1` 保存完成记录和偏好，在 `.round` 保存当前关卡版本和操作历史，恢复已拆螺丝、物理状态及已领取奖励。进度不跨浏览器／设备同步；不兼容或损坏的局面安全回退。

此前首页直接介绍 Glass Twist: Screw Puzzle。2026-10-13 视觉更新采用浅灰绿、墨绿与暖橙色按钮、本地 Outfit 字体和玻璃造型背景，展示可点击的真实第二关截图；手机首屏提供开始按钮。玩法说明以三颗同色螺丝、五个暂存槽和玻璃层叠的 CSS 示意呈现。两种语言的教程各有开局、暂存示例和第二关三张图，详见 [ASSETS.md](ASSETS.md)。教程采用紧凑图文布局，包括四步玩法、四条策略、真实关卡表、三项奖励和九条原生 `details` FAQ，不依赖 JavaScript 显示。构建为网站样式、脚本和图片添加内容哈希，避免旧缓存混入新版页面。

## 页面与搜索信息

原有十个可索引页面：`/`、`/games/screw-sort/`、`/hi/`、`/hi/games/screw-sort/`、`/guides/glass-twist-level-2/`、`/hi/guides/glass-twist-level-2/`、`/about/`、`/contact/`、`/privacy/`、`/terms/`。每页有自身 canonical；两种语言的首页和游戏页有双向 `en`、`hi`、`x-default` hreflang。默认英语，不按地区自动跳转。

游戏页结构化数据包含 `WebPage`、免费游戏／Web 应用和面包屑，分享图尺寸与实际 PNG 一致。不加入虚构评分或评论。`/play/screw-sort/` 保持 `noindex, follow`；`/games/coming-soon/` 保留旧地址的 301 规则与本地后备跳转。

## 嵌入与统计

游戏页通过 `/play/screw-sort/?embed=1&lang=en` 或 `lang=hi` 加载同域游戏。参数选择语言，保留进度。`assets/game-embed.js` 管理加载状态、15 秒超时、重试、尺寸和有限滚动请求；来源、origin、消息类型及统计数据均经过校验。游戏开始时对齐视口。

GA4 衡量 ID 为 `G-NYFN8XFXL3`。共享入口 `../screw-sort-game/js/analytics.js`；嵌入游戏通过父页面统一统计，避免重复初始化。localhost／127.0.0.1 不加载 Google tag。隐私页提供本浏览器统计开关，当前按既有配置直接统计，无同意弹窗。详情见 [ANALYTICS.md](ANALYTICS.md)。

AdSense 网站验证仅保留 `ads.txt`，奖励行为采用上述试玩确认发放。详见 [ADSENSE.md](ADSENSE.md)。没有用户账号、支付或联系表单。

## 收藏与桌面入口

网站导航提供 Save tapmelo，支持安装事件时通过真实点击调起安装，否则显示收藏／添加主屏幕指引。英语和印地语 manifest 共用安装身份，对应语言游戏页为启动页。当前需要联网，没有离线缓存；iOS 主屏幕可能使用另一份本地进度。游戏暂停菜单不提供收藏入口；共享收藏模块仍由网站页面加载。

## 验证与发布

自动检查与浏览器检查结果见 [CHECKS.md](CHECKS.md)。截图脚本和浏览器脚本是 Playwright CLI `run-code` 函数，运行时工作目录应为项目根目录；默认使用 4173 端口。

每次发布前运行 `npm run build`，上传完整 `dist/` 到现有 Cloudflare Pages 项目。上线后验证 HTTPS、manifest、图标、canonical、语言关联、旧地址 301 与独立游戏 noindex。此次完成本地代码及发布目录更新，没有执行线上发布。

## 2026-10-09 搜索页面与游戏改名

游戏显示名称为 **Glass Twist: Screw Puzzle**；英语游戏页标题为 **Glass Twist – Free Online Screw Puzzle Game | tapmelo**。保留既有游戏 URL、存档键、统计 game_id 与嵌入消息命名空间。主页面介绍免费、无需下载、玻璃拆卸和颜色分类，不宣传总关数；关卡列表继续由真实目录生成。

独立第二关攻略为 `/guides/glass-twist-level-2/` 和 `/hi/guides/glass-twist-level-2/`，与首页、游戏页相互链接，并进入 sitemap。两种语言有独立 canonical、双向 hreflang 和 Article／面包屑数据。正文展示真实开局、六步后换色、三槽暂存的截图，讲解经浏览器实际操作验证的开局与换色顺序；不是整关逐步通关路线。

## 2026-10-30 双游戏首页与 Mahjong

首页按提供的参考图重排：暖白底、真实 Glass Twist 游戏截图、墨绿麻将插画、两列游戏入口，手机端改为单列。语言选择仅 English / हिन्दी。保留原有玻璃游戏 URL、进度、攻略和功能。

新增 `/games/mahjong/`、`/hi/games/mahjong/` 和七篇文章各自的英印版本，共 26 个可索引页面。文章 ID：`tiles`、`winning`、`calls`、`advanced`、`organize-hand`、`waiting-shapes`、`claim-choices`。文章在 `/[hi/]guides/mahjong/{id}/`，无 JavaScript 也可阅读和使用目录。`/play/mahjong/` 为不索引的独立练习播放器。

- `src/mahjong.mjs`：网站练习入口、静态文章和麻将封面，牌面与牌型内容共用游戏资源。
- `src/assets/mahjong-embed.js`：同域嵌入、加载失败和重试、自动高度、语言切换及当前练习恢复。
- `scripts/sync-mahjong.mjs`：同步 16 个发布文件、生成缓存版本；不包含测试及开发资料。
- `../mahjong-tutor/js/interface-hi.json`、`articles-hi.json`：界面和文章印地语翻译；构建先自动生成 `hi.js`。
- `scripts/browser-mahjong.js`：四种宽度、两种语言、七篇文章、站内往返、无 JS 阅读验证。

游戏保持三级教程、随机听牌和七步引导局，不包含人机实战。旧中文偏好回退到英语，现有题目进度与牌名设置保留。传统牌面汉字是麻将图案的一部分，仍按参考图保留。测试记录与截图见 `REDESIGN-CHECKS.md`。本轮只更新本地源码及发布目录，没有上传线上。


## 2026-11-04 弹珠游戏与攻略

首页新增第三个游戏 Marble Sort，桌面三列、手机单列，保留既有玻璃与麻将入口。新增 `/games/marble-sort/`、`/hi/games/marble-sort/`，游戏内界面、提示、帮助、颜色标签和结算均支持英语／印地语。`/play/marble-sort/` 为带 `noindex, follow` 的独立播放器。

四篇原创攻略各有英印两版，路径为 `/[hi/]guides/marble-sort/{id}/`：

- `getting-started`：九球出料、三球装盒、收纳预告和本地进度。
- `belt-space`：27 格容量、满载等待与真正堵塞、撤回和扩容。
- `mystery-packs`：问号揭晓、6＋3 双色料盒、后期颜色数量。
- `level-1-opening`：依据真实关卡生成 2→2→2→2→4 路线，并经浏览器操作验证前三次出料后 24 球等待、三格通道收白球、五次出料完成第一阶段。不是整关通关路线。

新增文件：`src/marble.mjs`（页面／攻略／SVG 封面）、`src/assets/marble-embed.js`（加载重试、同源消息、高度适配、离屏暂停）、`scripts/sync-marble.mjs`（十个文件的发布白名单和内容哈希）、`scripts/browser-marble.js`（浏览器回归）。构建生成 36 个可索引页面，检查同步验证游戏数、四篇攻略、语言、链接和发布清单。About 与 Privacy 已补充弹珠游戏和真实存储行为。

独立游戏源文件仍在 `../marble-sort-game/`，请不要编辑 `dist/play/marble-sort/`。只保存最高解锁关和音效偏好，不保存未完成棋盘；撤回、扩容均每局一次，不需要广告或支付。

本次更新本地源码和完整 `dist/`，未执行 Cloudflare Pages 线上发布。验证记录见 `MARBLE-CHECKS.md`。

## 2026-11-06 首页视觉整理

首页采用奶油白、墨绿和浅鼠尾草绿；保留本地 Outfit 字体，英语主标题搭配系统衬线斜体，印地语使用原有字体回退。Clock Out! 为主推入口，Glass Twist 和 Mahjong 改成紧凑图文布局；保留真实封面、原有 URL 和双语导航。手机上先展示游戏说明和开始按钮，再展示封面。

本轮修复主推区与全站配色不一致、次级入口浏览距离过长、手机主导航隐藏、语言选择缺少展开提示等问题。首页样式移至 `src/assets/home.css`，删除共用样式中重复的旧首页规则；无新依赖，无游戏逻辑或存档变更。

验证：构建成功；40 个 HTML 文件、1257 个站内链接通过检查；120 项浏览器检查覆盖英语和印地语、320/360/390/600/768/1024/1440px、三款嵌入游戏、键盘跳转、语言切换、无 JavaScript 导航和减少动态效果。截图位于 `../output/playwright/redesign-{en,hi}-{390,768,1440}.png`。仅更新本地源码与 `dist/`，未发布线上。

## 当前共用详情页流程与维护边界

本节更新上文早期详情页与嵌入说明：沿用现有明亮配色，只扩展预览与开始游戏流程。`src/game-stage.mjs` 统一生成详情页，`src/assets/game-player.js` 管理视频预览、开始和退出，`src/assets/arcade.css` 管理布局。预览视频使用目录 `src/game-catalog.mjs` 中的游戏 ID，对应 `/assets/previews/{id}.mp4`；封面对应 `/assets/logos/{id}.png`。

短边不超过 600 CSS 像素的触屏设备先展示视频预览和开始按钮，点击后加载游戏并进入固定视口。桌面打开详情页立即加载游戏，页首完整显示游戏面板，下方保留推荐游戏、介绍、攻略与问答。两种布局均隐藏顶部导航。底栏保留游戏身份、全屏和帮助，左上角品牌菜单提供返回、主页和搜索。原生全屏仅由底栏按钮请求，浏览器不支持时使用固定视口。帮助与搜索共用抽屉，沿用游戏已有的玩法、文章和问答。

根目录尚无 `DESIGN.md`／`PRODUCT.md`，上文部分历史布局描述已与现状漂移；本次仅记录共用流程，不补建或改写设计系统文件，也不替换既有视觉方向。维护以当前模板、播放器和样式实现及本节为准。
