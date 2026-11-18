# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

tapmelo 优先服务用手机玩几分钟的休闲玩家。他们希望快速看懂各款游戏的区别，选到感兴趣的一款并马上开玩。桌面浏览器也可游玩。麻将练习和攻略支持想进一步学习的玩家。

## Product Purpose

tapmelo 是 Jelly 独立运营的休闲游戏站。当前产品目标是缩短从打开网站到找到游戏并开始玩的过程。遇到卡关或不熟悉规则时，玩家可以在站内查阅对应攻略。

## Positioning

游戏免费，在浏览器中打开即可玩，无需安装或创建账号。Clock Out! 和 Glass Twist 提供不同的颜色分类玩法，Mahjong 通过短练习和图解帮助玩家学习传统麻将。

## Operating Context

玩家可以从首页选择游戏，也可以直接打开游戏页或攻略。站内页面支持 13 种语言，英语为默认语言。自研游戏界面继续使用英语和印地语。游戏使用浏览器本地存储保留各自支持的进度和设置。Clock Out! 会保存解锁进度及音效设置，重新加载后当前未完成的一局需要重开。

## Evidence on Hand

- `site/src/game-catalog.mjs` 是游戏名称、入口和封面的共用目录。
- `site/src/assets/logos/` 和 `site/src/assets/previews/` 提供现有游戏封面和试玩片段。
- `site/src/info/about.html` 记录运营方和各游戏的实际能力。`site/README.md` 记录语言路由、本地构建和验证流程。

## Product Principles

1. 优先帮助手机玩家快速找到游戏并开始玩。
2. 保持免费、无需安装、无需账号的开玩流程。
3. 用每款游戏的实际玩法帮助玩家选择，提供与真实规则一致的攻略。
4. 游戏入口、玩法说明与攻略为各站内语言的玩家提供对应译本。
