# 网站更新验收

## 2026-10-13 Taste 网页视觉更新

- 更新首页布局、Outfit 本地字体、浅灰绿底色、暖橙按钮、语言切换和玩法示意；游戏、攻略与信息页同步共享视觉样式。首页截图链接到游戏页，原有 URL、游戏规则、存档键、统计与嵌入逻辑未改动。
- 构建成功；静态检查通过 12 个 HTML 文件、317 个本地链接／资源、图片尺寸、JSON-LD、关卡目录、sitemap 和发布语言检查。
- Chromium：10 个页面 × 320／390／1280px，共 30 组通过。无横向溢出、缺失图片或页面脚本异常；实际拆螺丝、暂停、英语／印地语切换、旧语言偏好回退与进度保留通过。关闭 JavaScript 后，攻略、关卡表及 FAQ 仍可阅读和操作。
- 首页补查英语／印地语 × 320／360／390／430／768／1024／1440px，共 14 组通过。品牌与导航、主按钮与玩法链接无重叠。所有手机宽度下，开始按钮底部位于 405–443px，低于测试首屏高度 667px。
- 收藏弹窗打开、Escape 关闭与焦点返回；键盘跳过导航；预览截图与玩法链接；减少动画偏好均通过。
- 最后微调攻略按钮间距与隐私页按钮样式后，补查两种语言攻略及隐私页 × 320／1440px，共 6 组通过，并再次构建与静态检查。
- 已目视复核桌面首页、390px 英语首页、320px 印地语首页、游戏开局、桌面攻略、手机 About 和隐私按钮。字体 WOFF2 与许可证均随构建发布，不依赖在线字体服务。
- 本次使用 Chromium 模拟尺寸检查，未进行实体手机／Safari 测试或整关通关；只更新本地源文件及 `dist/`，未发布线上。

日志：`../output/playwright/taste-browser-check.log`、`taste-interaction-check.log`、`taste-final-polish-check.log`。截图：`../output/playwright/taste-*.png`；`taste-before-*` 保留改造前页面。

## 2026-10-09 Glass Twist 改名与第二关攻略

- 英语游戏页标题为 `Glass Twist – Free Online Screw Puzzle Game | tapmelo`；网站、游戏开局界面、加载提示、信息页、manifest 描述、分享图与游戏结构化数据统一新名称。
- 游戏入口 URL 保持原样；存档键、统计标识、嵌入协议没有改名。首页与游戏页介绍不宣传总关数，实际关卡表仍来自当前目录。
- 新增英语、印地语第二关独立攻略；首页与游戏页链接到攻略，攻略返回游戏。独立 canonical、双向 hreflang、Article／面包屑数据及 sitemap 已生成。
- 实际浏览器操作验证六步蓝色开局及接下来的三步红色换盒；另从新局通过正常点击达到三槽暂存状态。截图未改写状态或发放奖励。
- 构建与静态检查通过：12 个 HTML 文件、306 个本地链接／资源、图片尺寸、JSON-LD、真实关卡数据和包含 10 个页面的 sitemap。
- Chromium 浏览器检查：10 个页面 × 320／390／1280px，共 30 个组合通过；图片正常、无横向溢出、无脚本错误。英语／印地语游戏加载与切换、FAQ 键盘操作、旧语言偏好和进度恢复通过。关闭 JavaScript 后，游戏说明、实际关卡表、FAQ 和两种语言的新攻略仍可阅读。
- 最终手机图文顺序复核：390px 英语与 320px 印地语攻略均先展示截图，再展示操作；无横向溢出。最终游戏页首屏与独立游戏开局名称已目视确认。
- 本次不涉及游戏规则／物理修改，未运行完整游戏测试套件或整关通关验证；未执行线上发布。

日志：`../screw-sort-game/output/glass-twist-browser-check.log`。视觉预览：`../screw-sort-game/output/playwright/glass-twist-*.png`。

## 2026-10-09 网站改版

本次调整首页、攻略与信息页的布局和文案，更新六张真实游戏截图、分享图，并为网站资源添加内容哈希。游戏规则和物理代码未改动。

- 构建成功；静态检查通过：10 个 HTML 文件、236 个本地链接及资源、图片尺寸、JSON-LD、关卡数据与 sitemap。
- 浏览器检查 9 个页面／尺寸组合：首页 1280、390px；印地语首页 320px；游戏页 390px；印地语游戏页 320px；About 1280px；Contact、Privacy、Terms 320px。无横向溢出，无页面脚本错误。
- 两种语言的游戏 iframe 都完成加载；FAQ 展开正常。390px 英语首页与 320px 印地语首页的开始按钮均在首屏内。
- 已查看桌面首页、手机首页、印地语首页、攻略、游戏入口、About 和分享图。截图位于 `../screw-sort-game/output/playwright/site-redesign-*.png`。

仅做网站构建与简单浏览器检查，未跑游戏回归或完整通关；未发布线上。

## 2026-10-08 历史验收

## 游戏规则与存档

`cd screw-sort-game && npm test`：72 项通过、0 失败。日志：`../screw-sort-game/output/tests-site-update.log`。

覆盖十关真实数量、默认两盒五槽的完整无道具通关路径、数量守恒、前两关独立求解、真实遮挡和物理支持、四盒七槽续局上限、清孔操作拒绝、融玻璃保留螺丝、存档重放和损坏数据回退。旧中文偏好回退英语，保留完成进度；移除旧“两关、第五盒、清孔救援”的测试假设。

最后的语言与存档专项复核：9 项通过。日志：`../screw-sort-game/output/tests-language-update.log`。

## 静态网站

`node site/scripts/build.mjs` 成功生成八个页面并同步游戏白名单。

`node site/scripts/check.mjs`：10 个 HTML 文件、244 个内部链接和资源检查通过。包括锚点、重复 ID、单一 H1、canonical、语言关联、JSON-LD、图片实际尺寸、十关表与真实关卡一致、八页 sitemap 和发布的 HTML／JS／CSS／SVG／manifest 无中文。

## 浏览器

Chromium，使用 Playwright CLI：

- 八个页面 × 320／390／1280px，共 24 组排版检查通过；无横向溢出，截图全部加载成功。
- 两种语言游戏页 iframe 进入 ready，页面参数选择正确语言。
- FAQ 支持鼠标与键盘；禁用 JavaScript 后，四步教程、十关表和原生 FAQ 仍可使用。
- 嵌入游戏实际拆卸螺丝、打开暂停菜单及英语／印地语切换正常，语言菜单只有这两项。
- 第一关实际点击 24 步完整通关，无脚本错误；第十关加载、十项选关菜单和真实拆卸操作通过。
- 旧中文偏好回退英语，已完成第一、二关的玩家在无当前局时进入第三关。
- 奖励取消不发放；暂存槽上限、四盒解锁、自动收纳、融玻璃及取消、卡关原地加盒续局、刷新恢复、触控操作通过。
- 独立游戏在 320×667、390×844（英语／印地语）、430×932、1280×800 检查通过；开局 25 颗可拆，触控目标至少 44px。

通关日志：`../screw-sort-game/output/site-first-level-check.log`；第十关日志：`../screw-sort-game/output/site-level-ten-check.log`。

网站日志：`../screw-sort-game/output/site-browser-check.log`；奖励日志：`../screw-sort-game/output/site-rewards-check.log`。图文布局已查看实际截图：`site-guide-390.png`、`site-guide-hi-390.png`、`site-levels-390.png`、`site-home-hi-390.png`，位于 `../screw-sort-game/output/playwright/`。

本次为本地构建与浏览器验证，未执行 Cloudflare Pages 发布、实体手机测试或 Google 收录检查。截图来源见 [ASSETS.md](ASSETS.md)。

## 2026-10-09 暂停界面与说明调整

- 暂停使用圆形 SVG 标记，突出 Continue game / Retry；取消休息文案、正常存档提示及全部选关入口。关卡号仅显示，通关后顺序进入下一关。
- 飞起的螺丝只保留圆形螺丝头，移除轴尖及相关动画；奖励按钮不再显示 AD 标记。
- 英语、印地语指南同步取消选关指引；广告状态简短说明为当前没有广告。
- 完整构建成功；静态检查通过 12 个 HTML 文件和 305 个内部链接。动画、统计专项单元检查 4 项通过。
- Chromium 检查 320×667、390×844（英语／印地语）、430×932、1280×800：暂停标记、两个主要按钮完整显示，无横向溢出。螺丝飞行暂停／恢复、重试清局、第一关通关及进入第二关、奖励取消与卡关原地加盒续局通过；印地语嵌入游戏暂停／恢复通过，无页面脚本错误。

日志：`../screw-sort-game/output/pause-ui-browser-check.log`。已查看暂停截图 `pause-en-320.png`、`pause-en-390.png`、`pause-hi-390.png`，位于 `../screw-sort-game/output/playwright/`。更新仅在本地完成，尚未线上发布。
