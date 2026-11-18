# tapmelo 埋点规则

版本：direct-v1，2026-10-06。衡量 ID：`G-NYFN8XFXL3`。

## 当前运行方式

运营者选择默认直接统计：正式页面打开即初始化 GA4，没有同意弹窗和地域判断。隐私页如实告知，并提供本浏览器关闭／开启统计的入口。这与原投流手册 §8 的“基本同意模式”建议不同，不能把手册中“允许统计人群”的实施描述当作当前网站行为。

`screw-sort-game/js/analytics.js` 是唯一收集器源文件。同步脚本复制到独立游戏 `js/analytics.js` 和站点 `/assets/analytics.js`。普通页面及独立游戏各自初始化一份 Google tag；嵌入 iframe 不初始化 GA4，只通过同源消息向父页面报告状态。跳转页不统计。

配置 `send_page_view:false`，由代码每次页面加载发送一次 `page_view`，避免自动／手动重复。关闭标签的 Google signals 与广告个性化信号配置。未接真实广告 SDK，也不发送广告展示、奖励或收入事件；这些配置不是对 GA4 后台设置或全部法律适用性的保证。

## 统计范围

2026-10-07：印地语入口 `/hi/games/screw-sort/` 与英语入口采用相同的游戏页面测量规则，`page_type=embedded_game`；`/hi/` 首页仍为 `site`。页面网址用于区分语言版本，`game_language` 表示游戏当时实际使用的语言。两者可能不同，例如用户在游戏内切换语言。新页面没有新增 Google tag 或新的统计服务。

- 自定义的“页面测量周期”从本页收集器初始化至本页离开。刷新、跳到另一页、直接打开游戏都会产生新周期。iframe 加载重试不更换父页面周期；浏览器返回缓存恢复也不重复 `page_view`。
- `measurement_session_id` 是本页内存中的随机编号，**不是 GA4 会话 ID、访客 ID 或唯一人数**。`round_id` 每次真实开局新建，`event_id` 每次实际发送新建；自定义编号不写 Cookie／localStorage。GA4 自己的 Cookie 与标识是另外一层。
- 有效到站与有效游玩各在单次游戏页面测量周期内至多一次。其他信息页只发送页面浏览，不进入游戏有效到站分母。关卡和重开可有多次。
- 页面关闭、离开、网络中断不伪造 `game_end`，因此未结束的局不一定代表用户失败。
- 广告费用／点击数来自 Google Ads。GA4 会漏掉拦截、断网、关闭统计等访问，不能等同于所有广告点击或完整人数。

## 事件

| 事件 | 触发规则 | 次数与参数 |
| --- | --- | --- |
| `page_view` | 普通页面或独立游戏初始化 | 每真实页面加载一次；iframe 不单算 |
| `game_load_start` | 初次游戏页初始化，以及点击加载重试 | 每加载尝试一次，`load_id` |
| `game_loaded` | 游戏模块、棋盘和引擎真正就绪 | 每成功尝试一次，`load_id`、`load_time_ms`、关卡和语言 |
| `game_load_error` | 就绪前资源／初始化失败，或嵌入页等待 15 秒超时 | 每尝试一次，脱敏的固定 `error_code` |
| `game_ready_snapshot` | 某尝试已报失败，但随后迟到的就绪消息使界面恢复 | 每尝试至多一次；不加入正常加载成功数 |
| `valid_arrival` | 游戏界面可用且页面在前台累计达到 10 秒 | 每页面周期一次，`foreground_ready_ms` |
| `game_start` | 新棋盘已经建好，引擎进入实际游玩 | 每新局一次，`start_reason`、`round_id`、关卡和语言 |
| `effective_play` | 已达有效到站，且某局前台有效游玩累计 ≥30 秒、有 ≥2 次成功操作；或完成一局有实际操作的短局 | 每页面周期一次，`qualification=active_30s/short_win` |
| `game_jam` | 引擎实际进入卡关状态 | 每局至多一次；卡关可复活，所以不作为局结束 |
| `game_restart` | 用户在重开确认框或卡关弹窗中确认重开 | 旧局至多一次；仅打开确认框不记 |
| `game_end` | 实际通关，或确认重开／切关而放弃未结束的旧局 | 每局至多一次，`outcome=won/abandoned`、`end_reason=completed/restart/level_select` |

`start_reason` 为 `initial`、`restart`、`next_level` 或 `level_select`。暂停后继续和广告复活不新建局，不再次记 `game_start`。通关后的下一关使用新 `round_id`。双击开始、确认重开、下一关和选关，第二次失效意图不会再开新局。

成功操作指引擎实际接受的拆螺丝操作；点空白、被遮挡的螺丝、滚动、菜单、静音或暂停都不增加 `action_count`。每颗螺丝不单独发送 GA4 事件，只更新本页计数。

## 时长和去重

- 有效到站从游戏界面就绪且可见起累计，切后台不计；重试期间不可用的时间不计。
- 有效游玩从本局第一次成功操作开始，在每次成功操作后的 15 秒活动窗口内累计。窗口过后无操作的时间不计；暂停、弹窗、广告和后台也不计。恢复后需要新操作重新激活窗口。这是“持续交互”的工程近似，不代表能判断玩家是否一直注视屏幕。
- `active_play_ms` 只含上述时间；`round_elapsed_ms` 是从开局到结束的总历时，可包括停顿，两者不能混用。
- 短局先通关不足 10 秒时，保存本页内存中的通关候选；用户继续停留并达到有效到站后才发送有效游玩。随后进入下一关不丢失短局候选。
- `load_time_ms` 是收集器初始化／重试至收到真实就绪的观察时长。初次测量从本地收集器运行后开始，不包括收集器本身下载和之前的导航耗时；不是 Core Web Vitals 或完整网络加载时长。
- 父页面检查消息 `origin`、`source` 和固定 scope。收集器检查实例编号、递增序号、关卡和枚举值，并按加载尝试／局／页面分别去重；旧 iframe 的迟到消息不能算成新尝试。
- 应用不自动重试 GA4 事件。自定义 `event_id` 用于核对，不假设 GA4 自动按它去重。

## 参数和来源

共同参数：`measurement_session_id`、`event_id`、`measurement_model=direct`、`analytics_version`、`site_version`、`page_type`、`traffic_category`。游戏页另带 `game_id`、`game_version`；局事件带 `round_id`、`level_number`、`game_language`、`action_count`、`active_play_ms`。

`page_location`／`page_referrer` 清除 hash 和非白名单查询参数，只保留 UTM 及 Google Ads 官方归因参数。不把邮箱、完整存档、螺丝选择明细、异常堆栈或任意错误 URL 作为自定义参数。不把 `gclid` 等点击 ID另存为自定义事件参数。保留官方归因参数不等于禁用了供应商的所有数据处理。

广告最终网址应直接指向 `/games/screw-sort/`。手工来源例：

```text
https://tapmelo.com/games/screw-sort/?utm_source=google&utm_medium=cpc&utm_campaign=in_display_s2&utm_content=creative_a
```

生产 QA 使用 `utm_source=qa`，代码会加 `traffic_category=qa` 和 `debug_mode:true`。localhost／127.0.0.1／[::1] 只写入 `dataLayer`，不请求 Google tag，因此不会出现在 GA4 DebugView。局域网 IP 不自动视为本地 QA；真机测试加 `utm_source=qa`，并在报表中排除 QA。

## 本浏览器关闭统计

隐私页的关闭按钮写入 `localStorage['tapmelo.analytics.disabled']='1'` 并刷新。本页初始化先检查选择，关闭状态下不请求 Google tag、不建事件队列；游戏仍可玩。选择另存于游戏存档之外。开启写入 `0`；清除存储或换浏览器会恢复默认直接统计。不会删除已发送数据或已有 GA Cookie，也不会在其他已打开页面实时同步选择；这些页面应刷新。

## GA4 后台需要完成的设置

1. 代码上线后，用 `utm_source=qa` 的正式游戏页确认 Realtime／DebugView 中能看到上述事件。无需在 GA4 界面重新创建同名事件。
2. 为报告需要的参数创建事件范围自定义维度：`game_id`、`game_version`、`page_type`、`level_number`、`game_language`、`start_reason`、`outcome`、`end_reason`、`qualification`、`traffic_category`、`error_code`。按需要注册时长／操作数的自定义指标；先确认后台接受的单位。
3. **不注册** `measurement_session_id`、`round_id`、`event_id`、`load_id` 为自定义维度，以免高基数使报告难用。逐局精确去重若需 BigQuery 导出，应另确认开启和数据处理条件；普通 CSV 是汇总报表，不是完整逐事件日志。
4. 建议把 `effective_play` 标记为关键事件，先观察；不要自动作为 Google Ads 竞价优化目标。`page_view`、`game_start` 也不当作购买或收入。
5. GA4 和 Ads 时区统一；按资源实际界面检查数据保留期、数据共享、增强型衡量、Google signals 和广告用途设置。本站使用手动页面浏览；避免额外配置重复页面事件。报告排除 `traffic_category=qa`，初期不要开启不可回收的永久数据过滤。

事件配置官方依据：[设置事件](https://developers.google.com/analytics/devguides/collection/ga4/events)、[Google tag 配置](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)。

## 收藏与安装事件

共享收集器新增 `retention(name, fields)`，仅接受以下事件；参数仅保留 `source`（site／pause／win）、`action`（固定枚举）和已有的 `game_language`，继续使用统一 QA、事件编号和关闭统计机制。iframe 只上报给父页，不初始化第二份 Google tag。提醒计时完全独立于收集器，关闭统计也能使用收藏与安装功能。

| 事件 | 触发条件 |
| --- | --- |
| `save_prompt_view` | 累计有效游玩两分钟后的一次新通关显示提示，同一通关不重复 |
| `save_action` | 打开指引、复制游戏地址、点击原生安装按钮 |
| `save_dismiss` | 关闭／跳过／下一关、取消或安装异常，进入十分钟冷却 |
| `save_confirmed` | 用户选择“我已添加”，`action=self_report`，不表示安装成功 |
| `app_installed` | 顶层窗口收到浏览器 `appinstalled` 事件 |
| `app_launch` | 页面首次加载时在 standalone／相关独立显示模式启动；bfcache 不重复 |

安装事件 `userChoice=accepted` 只显示浏览器正在完成安装，不能代替 `appinstalled`；书签没有可验证的浏览器回调。安装成功、用户确认和独立模式启动分别看，不将三者相加当作成功安装人数。这些事件默认不设为关键事件；报告排除 `traffic_category=qa`。收藏转化可看提示后打开指引的比例与用户确认次数，真实安装用 `app_installed`；独立模式启动次数不能当作唯一回访人数。

## 报告口径

- 加载成功率：`game_loaded / game_load_start`，排除 QA；迟到恢复快照不作为正常加载成功。测量窗口末尾仍在加载的尝试需等结果或注明缺失。
- 页面有效游玩率：本页有效游玩次数 / 本页有效到站次数。因两者各页至多一次，可按一致的游戏页面／来源范围比较；名称应写“页面访问”，不要写“独立玩家人数”。
- 页面开始率：在有效到站页面集合中，至少开过一局的页面 / 有效到站页面。不能用 `game_start / valid_arrival`，因为一个页面可开多局；未实现逐页明细聚合时可看 GA4 会话口径并说明差异。
- 通关率：同一入组和观察窗口下 `game_end(outcome=won) / game_start`；放弃局、卡关、未结束局分别看。严格逐局统计需 `round_id` 明细，普通汇总有窗口边界和丢失问题。
- 开局通常早于第 10 秒的 `valid_arrival`，所以不要配置严格按 `valid_arrival → game_start` 时间顺序的漏斗。主行为顺序用 `page_view → game_loaded → game_start → effective_play`，有效到站作为另一个资格条件／集合。
- 全部媒体费用 / 可观测有效到站或游玩，只能标“全部费用／可观测页面访问”。不代表全量获客成本。当前没有真实变现收入数据，不能据此算 ROI。

## 验证记录

2026-10-06 兼容修复：共享收集器与游戏埋点均在 `crypto.randomUUID` 不可用或抛错时使用本页临时编号，避免初始化中断。统计编号不作安全用途，不持久化。相关单元测试 9 项通过；Chromium 与 WebKit 五种环境的加载、教学关通关和独立游玩检查通过，详见 `../screw-sort-game/TESTING.md`。未在实体 iPhone 微信内核上验证。

2026-10-06：`npm test` 39 项通过，其中 7 项新增统计测试覆盖默认直接初始化、无真实本地请求、iframe／关闭统计不建队列、短局延后资格、空闲／暂停／后台计时、bfcache、重复消息／卡关及错误脱敏／重试。

`tests/browser-analytics.js` 在 Chromium 390×844 中通过：首页一次页面浏览；嵌入父页单收集器；真实教学关 12 次操作通关；开始／下一关／重开双击去重；有效到站和短局有效游玩；隐私页关闭／开启统计及关闭后正常游戏；独立页统计；中断模块下载后的错误／重试；屏蔽统计文件仍可玩。零页面脚本异常、零 Google 请求。前后台与 bfcache 时长规则由可控时钟单元测试验证，未声称实体手机或所有浏览器验证。

这些是本地事件队列验证，不等于已收到生产 GA4 数据；未上线。GA4 自定义定义与后台报告需另外核对。
