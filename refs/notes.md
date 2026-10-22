# X 设计参考：视觉实测笔记（2026-10-15）
方法：Playwright+Chromium 无头，1440x900，每站滚动取 5 帧（KVS 仅取入口页），截图在 `ailiu-x-references-shots/`；DOM 信息在同目录 `dom-info.json`。颜色为从截图/计算样式估计的近似值。滚动动效只记录实际看到或能从 DOM/脚本检出的内容，其余标"未验证"。

实际网址：Orwell = https://orwell.byholm.co ；KVS = https://www.kvs.services/ ；Atomic = https://atomic.black（由 CSS Winner 详情页取得）。

## 1. Nodeck（nodeck.online）
- 布局：整站是一套"幻灯片"，单屏满版，底部有 PREV/菜单/NEXT 按钮和"SLIDE 1/10"、"PRESENTER NOTES"。首屏巨型白色粗体字 NODECK 加黑色厚描边，配黄色便利贴和荧光笔。
- 配色：粉 #FF87AB、白、黑、荧光黄绿 #D8F500、便利贴黄 #E8D88A。
- 字体：DM Sans（正文）、BN Dime Display（标题）、IBM VGA（像素/终端点缀）。
- 动效/滚动：页面高度恰好 900，说明不是长页滚动，而是按钮/幻灯片切换；滚轮滚动后画面没变化。切换时的转场我这次没触发，未验证。无 GSAP/Lenis 全局对象，打包为单个 main JS。
- 亮点：用"拒绝 PPT"的概念做整站，幻灯片隐喻统一了导航、页码、备注。
- 对 ailiu.online：每个项目一"屏"、页码式导航（01/07）和一个统一的"切换"规则很适合七个平等板块；但它不是纵向滚动，可只借页码和按钮语言。

## 2. Per Appelgren（perappelgren.de）
- 布局：白底，极简。首屏是散落的摄影作品缩略图（约 10 张，大小错落、围绕中间"Per Appelgren"名字），左上 ARCHIVE、右上 CONTACT，其余无界面。
- 配色：白 #FFFFFF，文字深蓝灰 #213547，色彩全部来自照片。
- 字体：Neue Montreal（无衬线，中等粗细）。
- 动效/滚动：Next.js，2 个 canvas。滚轮 5 档截图中图片位置基本不动，底部有一张新图略微露出，说明可能是图片随滚动轻微位移/无限画布，具体机制未验证。
- 亮点：作品即界面，几乎没有文字；极度克制。
- 对 ailiu.online：说明"文字服务视觉"可以做到极致；七个项目可用同等大小的视觉缩略图，名字和标签极少。

## 3. Riddle Portfolio（riddle-portfolio.vercel.app，"Roman — AI automation engineer"）
- 布局：深色长页（约 10000px），顶部固定导航（what i do / work / stack / about / contact），右上有语言切换、本地时间"Cardiff · 11:15"和"available"绿点。首屏大标题"I connect your stack to AI agents that actually ship."，下方是中心发光 RR 加六个图标节点的轨道图。作品区"Four flagships"，每个项目一整屏，各自有主题色（Hermes 红、FlashHandy 绿），带编号 01–04、LIVE 标记、手机/浏览器样机、技术标签；最后是一行行小项目清单和巨大的联系标题。
- 配色：背景近黑 #0A0A0A，文字 #FAFAFA，主强调珊瑚红 #FF4D6D，辅助绿 #2FD6A0，各项目局部色晕。
- 字体：Geist（标题/正文，粗体大字，部分斜体强调）、JetBrains Mono（小标签、状态）。
- 动效/滚动：原生 JS（app.js、i18n.js），无 GSAP/Lenis；页面说明"滚动时页面换成各项目的颜色"，我在截图里确实看到背景色随项目从红渐变到绿，属于滚动驱动的色彩切换。其余未验证。内置中英/俄多语言。
- 亮点：个人 AI 工程师定位清晰，终端风小标签与大字对比好，有"实时状态"感。
- 对 ailiu.online：这是最接近的蓝本：每个项目一屏、按项目换主题色、统一模板（编号+状态+样机+标签）、多语言，正好对应"七个平等板块、同一模板"；Louis 的黑客风可借它的等宽小标签和状态条。

## 4. Studio Mirabelli（Framer 社区页）
- 说明：我看到的是 Framer 社区画廊的展示页（深色 #111 背景，含 cookie 提示），不是站点本身；未访问其真实站点，所以以下只来自缩略图和页面简介。
- 外观：浏览器样机里是左右分屏——左边是粉色羽毛外套模特的杂志大片（棕色皱纸背景），右边是淡蓝底、压花浮雕质感的衬线大字 STUDIO MIRABELLI，左上 WORK、右上 CONTACT。简介原文：纽约布景设计工作室，"印刷编辑感"转成数字"相反方向滚动的主页动画"，CMS 项目页有五种版式。
- 配色：蓝灰 #A9BFE3、玫粉 #D87A8A、牛皮纸棕 #8A6A4E。字体：高对比衬线（压花效果）；画廊页用 Walsheim/Inter。
- 动效：简介称"相反方向滚动"（左右两半向相反方向移动），我没能亲眼看到，未验证。
- 亮点：把杂志印刷感做进网页，质感强，制作方式是 Framer。
- 对 ailiu.online：左右反向滚动是"转场语言"的一个好例子；若想要编辑感（方向 A），可借压花衬线标题。

## 5. Atomic（atomic.black，CSS Winner SOTD 2026-04-14）
- 说明：CSS Winner 详情页本身是评分页，真实站点是 atomic.black，已另外截图。
- 布局：纯黑底，Inter 字体，小字号加大量留白；首屏大标题"Interfaces and digital brands that accelerate revenue"，左侧圆形播放按钮"WATCH SHOWREEL 00:39"，右侧"20+ 获奖 / 10+ 年"；下面是横向卡片轮播（UX/UI、平面、艺术指导，蓝/橙/灰），项目列表（大字，一行一个），中部有发光渐变圆环 + 闪电标志，页脚是一条青紫色多条波浪线和邮箱，右侧固定竖条"Honors"。
- 配色：黑 #000、白、蓝 #1F4FD8、橙 #FF5A1F、青 #19C8D8 到紫 #8A6FE0 的渐变。
- 动效：有 1 个 canvas（疑似波浪/圆环）；滚动时看到分段切换和卡片横滚，具体库未检出（Next.js 打包），未验证。
- 亮点：黑底上用少量高饱和渐变做"光"，圆环和波浪线本身就是抽象图形。
- 对 ailiu.online：圆环/波浪线这类抽象线条形态可直接做 Louis 的"轮廓化身"（声音波形随旁白起伏）。

## 6. What If Orwell Had A Website（orwell.byholm.co，GSAP SOTD 2026-07-21，HOLM Creative Studio）
- 布局：全黑开场，只有小号红色衬线字"WHAT IF GEORGE ORWELL HAD A WEBSITE"和一个巨大的白色 Bebas Neue 数字（"1984"逐字滚动成"84"），随后进入满屏深红色（#5E0F0F，带颗粒）场景，中间是倾斜的黑白拼贴插画卡片（举起的手），再到深色场景里隐约的"2+2=5"和人像。
- 配色：黑 #000、血红 #CC0000/#5E0F0F、白；Awwwards 标出 #1A1A1A 和 #CC0000。
- 字体：Bebas Neue（大数字）、红色小号衬线大写字距。
- 动效：实测页面里有 GSAP 3.12（含 DrawSVG、SplitText）和 Lenis 平滑滚动，3 个 canvas；官方注明还用了 ScrollTrigger 和 Three.js。滚动像"电影"，逐场景推进，转场是淡入淡出、整屏换色。
- 亮点：用单一红黑色系和颗粒质感营造强氛围，每屏一个主体，文字极少。
- 对 ailiu.online：每屏一个概念、整屏换色换景的叙事节奏，很适合"滚一屏讲一个项目"；GSAP+Lenis 是可行的统一动效基座。

## 7. KVS Studio（kvs.services，GSAP SOTD 2026-05-07，Awwwards SOTD）
- 说明：这个站很重（WebGL），整页截图常超时；我只取到入口页，滚动内部页面没看到。
- 实际所见：浅灰白色带颗粒的圆角"老电视/屏幕"边框，中央是用点阵组成的对称黑色图腾（像对称角、枝杈），下方橙色小标签"CLICK TO ENTER"和"(HEADPHONES RECOMMENDED)"，右侧红色 Awwwards 标签。
- 官方信息：ScrollTrigger、Observer、SplitText、Draggable，Three.js、WebGL、Vue。
- 配色：#EDEDED 灰白、黑、橙 #FF5A1F。
- 亮点：先点击进入再出声，既解决浏览器自动播放限制，又有仪式感；点阵+抽象图腾就是"轮廓化身"的好例。
- 对 ailiu.online：这就是"声音默认开启"的最佳做法——入口屏"点击进入（建议戴耳机）"，点击后 Louis 马上开口；Louis 可做成点阵/轮廓图形。内部页面表现未验证。

## 8. CSS Winner 的 Atomic 详情页
即第 5 项的评分页（粉红/白色目录样式，含评分 7.8、作者 Oleg Kulik，乌克兰），没有设计参考价值，只是确认了 Atomic 的真实网址与评分。

## 综合建议（给 ailiu.online）
1. 结构蓝本：Riddle（每项目一屏、同一模板、换主题色）+ Orwell（整屏换景的电影式节奏）。
2. Louis 轮廓形象：参考 KVS 的点阵图腾和 Atomic 的圆环/波浪线，做成抽象线条，随声音起伏。
3. 声音入口：参考 KVS 的"点击进入"屏，保证第一次点击就能出声，旁边常驻开关。
4. 文字极简：参考 Per Appelgren，作品为主，文字很少。
5. 技术底座：GSAP + ScrollTrigger + Lenis 是这些高分站的共同选择；Riddle 证明原生 JS 也能做。注意旧规则对动画方法的限制仍需你批准。
