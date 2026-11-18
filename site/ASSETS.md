# tapmelo 当前游戏图片

## 2026-10-13 字体与网页装饰

- Outfit Latin 可变字体（400–800），来源：https://fonts.google.com/specimen/Outfit 。32 KB WOFF2 文件保存在 `src/assets/fonts/outfit-latin.woff2`，构建复制到 `dist/assets/fonts/`，访客无需请求外部字体服务。
- SIL Open Font License 随字体存放于 `src/assets/fonts/OFL.txt`，原始许可证：https://github.com/google/fonts/blob/main/ofl/outfit/OFL.txt 。印地语字形使用系统天城文字体回退。
- 首页玻璃背景、三颗螺丝、五槽和叠层示意由 CSS 绘制，属于玩法装饰，不冒充可操作游戏。主预览继续使用下面记录的真实截图，并链接到游戏页。
- 品牌图标和分享图片继续沿用现有文件；分享图仍是上一版网页排版。

所有网站游戏图片均于 2026-10-09 从当前 Glass Twist: Screw Puzzle 玻璃游戏获取。

## 真实游戏截图

| 发布文件（`dist/assets/guides/`） | 内容 | 尺寸 |
| --- | --- | --- |
| `screw-sort-first-level.png` | 英语第一关开局；15 颗螺丝、两盒、五槽 | 390 × 844 |
| `screw-sort-tray-example.png` | 英语第一关点击一颗黄色螺丝后；一个黄色螺丝暂存 | 390 × 844 |
| `screw-sort-level-2.png` | 英语第二关开局；75 颗螺丝、15 层、6 色 | 390 × 844 |
| `screw-sort-first-level-hi.png` | 印地语第一关开局 | 390 × 844 |
| `screw-sort-tray-example-hi.png` | 印地语相同一次操作后的暂存状态 | 390 × 844 |
| `screw-sort-level-2-hi.png` | 印地语第二关开局 | 390 × 844 |

截取目标为 `#game`，视口 390 × 844。暂存示例查询当前暴露的黄色螺丝后正常点击，没有改写游戏状态或发放奖励。截图完成前等待收纳与玻璃动画；脚本校验暂存中恰好一个黄色螺丝。

重现：本机先运行站点构建及 4173 预览服务，使用 Playwright CLI 的 `run-code` 运行 `scripts/capture-screenshots.js`，工作目录为项目根目录。游戏只在本地主机与 `qa=1` 下开放只读诊断及等待动画接口。

## 首页与分享图

首页展示相应语言的第二关完整界面，使用网站 CSS 排版。`dist/assets/screw-sort-cover.png` 为同一预览组件以 1200 × 800 截取的分享图，包含真实游戏截图、游戏名与关卡信息。Glass Twist 游戏及攻略使用该分享图与实际尺寸。

站点导航、浏览器标签和安装图标使用提供的狐狸图片。浏览器使用多尺寸 `favicon.ico` 或 `assets/favicon-96.png`，iOS 使用 `apple-touch-icon.png`，两个语言版本的 manifest 共用 192px、512px 和留有裁切安全区的 512px 安装图标。教程图明确宽高、alt 与图注，按需懒加载；首页截图优先加载。图片由站点维护，不会被游戏同步脚本删除。

## 第二关独立攻略

新增 `screw-sort-level-2-opening.png`、`screw-sort-level-2-tray.png` 及对应 `-hi` 版本，均为 390 × 844 的 `#game` 真实截图。开局图复用 `screw-sort-level-2.png`。

`capture-level-2.js` 正常点击六颗蓝色螺丝（右侧花朵、左侧叶片、左上玻璃板），验证已装盒 6 颗、暂存为空、两个红盒；再点击三颗红色螺丝，验证已装盒 9 颗且新蓝盒出现。中段例从新开局按可见匹配优先的正常操作到达第 36 步，已装盒 30 颗，蓝盒 1/3、青盒 2/3，暂存红／绿／红共三颗，未卡关、未领奖励。只读取诊断状态，不改写状态。

分享图重新从新名称的首页组件截取：GLASS TWIST，真实第二关画面，以及玻璃／颜色分类的说明，不包含总关数宣传。

## 小动物班车网站更新

首页主推荐和 Clock Out! 分享图使用 `shuttle-cover.png`（1200 × 732），取自新版实际接人画面。截图时第三列班车已满员，候车区有 23 位乘客，游戏接送计数为 3。画面保留四列独立队列与各列后车预告。

`marble-opening.png`（374 × 829）用于第一关攻略，显示第三次放行后已接走 27 位乘客、候车区清空。实机动物与车辆使用游戏现有软陶素材，网站按游戏的奶油、浅桃色搭配。
