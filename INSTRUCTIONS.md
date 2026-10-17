# ailiu.online 改版 · Claude Code 统一执行说明书（Single Source of Truth）

> **致：Claude Code（Opus 5.5）。** 版本 v1.0 · 2026-10-15 18:5x SGT · 编写：Grok Bot（代 liu liu）。
> **本文是 ailiu.online 改版唯一的事实来源（SSOT），取代所有零散更新。** 与旧文档冲突时一律以本文为准；本文内标注 **【SUPERSEDES】** 的条目明确推翻了旧文档的说法。
> **当前状态：仅文档。** 未建站、未改仓库、未部署、未付费、未调用 Higgsfield 生成。**在用户明确给出「第一阶段开工（phase-one go-ahead）」之前，你只能只读评审本文并回报问题。**

---

## 0. 如何使用本文（How to use this doc）

1. **先通读全文，再只读评审。** 第一次被调用时，你的任务是：只读（`Read` 工具，不 Edit/Write/Bash 改动）评审本文 + 仓库 `mongocyber/ailiu.online`，回报：①技术不可行点 ②与仓库规则（`AGENTS.md`/`CLAUDE.md`/`RULE_ACCOUNTABILITY`）冲突点 ③对 §12 开放项的建议。不要动手构建。
2. **优先级规则（冲突时从高到低）：** 用户在对话中的最新指令 → 本文 → 下列背景文档。背景文档只作参考与素材池，**不得**从中拾取已被本文推翻的设计：
   - `/workspace/deliverables/ailiu-online-redesign-plan-2026-10-15.md`（计划；其 §L 段与旧正文）
   - `/workspace/deliverables/ailiu-louis-avatar-video-option-2026-10-15.md`（Avatar 视频 vs 轮廓）
   - `/workspace/deliverables/ailiu-online-visual-directions-2026-10-15.md`（方向 A/B/C/D）
   - `/workspace/deliverables/ailiu-online-higgsfield-options-2026-10-15.md`（Higgsfield 能力与价格）
   - `/workspace/deliverables/ailiu-online-diagnosis-2026-10-15.md`（DNS/代码诊断）
   - `/workspace/deliverables/ailiu-x-references-visual-notes-2026-10-15.md`（X 参考站实测）
   - `/workspace/higgsfield-site-study/report.md`（higgsfield.ai 首页研究）
3. **术语：** DECIDED = 用户已锁定，不要再提方案；OPEN = 未定，按本文给出的「默认值」实现并保留开关，等用户拍板；ASSUMPTION = 本文的推断，需你核实。
4. **语言：** 本文中文正文 + 英文技术术语。你给用户的回报用中文；代码、注释、commit message 用英文。
5. **每个阶段结束都必须停下等用户在 Vercel Preview 上验收**（§11）。不得跨阶段连续执行。
6. 你的额度有限（Pro，历史上多次超时）：**把任务切小**，每次只做一个可验收的小块，先写计划再写代码。

### 0.1 本文推翻的旧说法一览（SUPERSEDES index）
| 旧说法（出处） | 现在 |
|---|---|
| 「七章同一卡片模板 / one template」（计划 DECIDED-4、§L7 `template` 字段、视觉方向 D、站点研究借鉴项 2） | **【SUPERSEDES】** 七章**各自独立设计的 treatment**（定制组件 + choreography），只共享动效语言、数据槽位、旁白钩子、导航高亮、媒体预算。见 §7 |
| 「Louis 滚离 Hero 后音频立即停止，章节不自动播」（计划 §L4/§L5、视觉方向 D） | **【SUPERSEDES，带开放问题】** 按用户最新指令：Louis 在首页随滚动**为每个章节讲 1–2 句**。如何与旧说法调和列为 OPEN-1（§4.6、§12） |
| 「默认静音，点击才开」（旧正文 §5.1、视觉方向 A/B/C 前提） | 声音**进入即尝试播放**，被拦才出点击兜底（§5） |
| 「首访入口屏 / 点击进入（KVS 式）」（视觉方向 D 一处、X 参考笔记 §7/综合建议 3） | **【SUPERSEDES】** 无入口屏、无点击门（§5） |
| WebGL / Three.js / GLB / 3D 线框 / Rive / `generate_3d`（多处） | **全部排除**。Aviso 的「3D 感」只用 CSS 3D transforms / 2.5D 分层 DOM（§7.3，需用户确认此解读） |
| 语音输入、语音指令、对话问答 L2/L3、`microphone=(self)`（旧正文 §5.2、§7） | **全部删除**。单向音频；`Permissions-Policy: microphone=()` 保持 |
| 「保留横向画廊」（旧正文 §4.1 B、诊断） | 纵向滚动，从零重做 |
| 「复用旧 7.4MB philosophy-bg.mp4」（旧正文 §0.3） | 不复用 |
| 「保留 ICP 备案展示」（诊断「保留」清单） | 移除 ICP 号与 `IcpLink` |
| 「桃桃屋放副刊/频道区、C 拼贴隔离」「野生路易斯 COMING SOON / 筹备中占位」「野生路易斯=家庭情景喜剧」 | 七章同权；野生路易斯是纯虚拟、自指、极简但真实的章节，**不是**预告 |
| 「随口英语只放二维码占位卡」 | 先展示小程序真实页面；二维码可选后加；无外链；标「开发中」 |
| 「云内部 5 个设计案例待确认能否公开」 | 可公开，但产品名（如 OBS）与内部数字泛化 |
| 「Midjourney 用户手动」 vs 「助手驱动浏览器」 | 不在第一阶段范围；若要用需用户另批（§9.5） |
| Higgsfield 视频片 ≤250KB、整页视频 ≤2MB（Higgsfield 选项文档） | 单条 **1–2MB 上限**（目标更小），全站媒体 **< ~15MB**，首屏 ≤500KB（§10） |

---

## 1. 目标与非目标（Goals & Non-goals）

### 1.1 目标
- 从零重做 ailiu.online：**纵向滚动**、**中英双语（zh/en）**的个人作品站，主体是七个同权项目章节。
- 首页有叙述者 **Louis**（AI 虚拟人设），hacker 风视觉效果，**单向**声音讲解。
- 视觉第一、文字第二：每章靠各自定制的视觉/动效 treatment 讲清楚「这是什么」，文案极简。
- 全站**一套**动效语言（tokens + preset 词汇 + reduced-motion），各章 treatment 在这套语言内定制。
- **数据驱动**：新增项目只加 manifest 条目 + 素材 + 一个遵守共享契约的 treatment 模块，不破坏旁白、转场、布局。
- 性能纪律：首屏 ≤500KB，全站媒体 < ~15MB，移动端可用。
- 双部署：**ailiu.online（Vercel）= 海外主站**；**mongocyber.github.io = 大陆备用**，两边都发布同一构建。

### 1.2 非目标（Non-goals）
- 不做任何实时 3D（WebGL、Three.js、GLB、3D 建模、Rive、Spline）。
- 不做麦克风、语音输入、语音指令、对话、LLM 后端、任何 Vercel Function。
- 不用 Higgsfield 的 `create_website`/`deploy_website`；Higgsfield 只是素材工厂。
- 不放流量、收益、用户数等任何指标；不编造数字。
- 不保留 ICP 备案号；不复用旧 7.4MB 背景视频；不保留横向画廊。
- 不在用户 phase-one go-ahead 之前构建、付费、部署、生成。

---

## 2. 已锁定决定（Locked decisions）

| # | 领域 | 决定（DECIDED） | 备注 |
|---|---|---|---|
| D1 | 滚动 | 纵向滚动 | 无横向选项 |
| D2 | 语言 | 中英双语，`/` = EN，`/zh/` = 中文（沿用现有路由） | hreflang + canonical |
| D3 | 部署 | ailiu.online on Vercel = 海外主站；mongocyber.github.io = 大陆备用，**两边都发布** | 见 §10.6 |
| D4 | 合规 | 移除 ICP 备案号 | 删除 `IcpLink` 及引用 |
| D5 | 范围 | 从零重做 | 旧代码只作参考 |
| D6 | Louis 角色 | 首页叙述者；hacker 风效果；**单向音频**；无麦克风/语音输入/对话 | |
| D7 | Louis 互动 | 鼠标互动偶尔触发短句；用户滚动时每个章节讲 1–2 句 | 与旧「离开 Hero 即停」冲突 → OPEN-1 |
| D8 | 章节 | 七个**同权**章节：Aviso、PrintPlay、蒸汽站、随口英语、小姨家、桃桃屋、野生路易斯 | 同等篇幅、同等突出度 |
| D9 | 章节呈现 | **【SUPERSEDES one template】** 每章独立设计 treatment（按项目性质定制视觉与动效） | 共享：动效语言、manifest 槽位、旁白/字幕钩子、导航高亮、媒体预算 |
| D10 | 全局风格 | **任何单一项目不得主导全站风格/观感**（底色、字体、全局动效、导航） | 定制只发生在章节内部 |
| D11 | 3D | 全部排除 | Aviso 的「3D 感」= CSS 3D/2.5D DOM（待用户确认解读） |
| D12 | Avatar 形态 | 虚拟轮廓 vs 写实：**由你（Opus）仅按最终视觉效果决定**；写实只能是预渲染视频/序列帧；允许混合 | Opus 先前只读评估推荐轮廓为主 + 至多 1 条处理过的「信号幽灵」片，可作为起点 |
| D13 | 视频层 | Higgsfield 花费上限 **$3**；先 estimate；**先只做 1 条测试片** | 状态机 idle/talk/react 切片 |
| D14 | 音频驱动 | 扫描线/辉光等由音频振幅（RMS）实时驱动 | Web Audio `AnalyserNode` |
| D15 | 声音 | 进入页面**不点击即播放**为主流程；仅自动播放被拦时出点击提示；常驻开关；每句有字幕；首次鼠标移动/滚动/按键即尝试启动 | 无入口屏 |
| D16 | 动效 | 一套统一动效系统：固定 preset 词汇、时长/缓动 tokens、reduced-motion 兜底、验收清单 | §6 |
| D17 | 数据 | 数据驱动项目 manifest（旁白片段、zh/en 字幕、treatment 模块、转场 preset、封面、校验脚本） | §8 |
| D18 | 文案 | 极简、服从视觉；固定文字槽位与字数上限；起点取旧站描述 | §7.1、§8.3 |
| D19 | 借鉴 Higgsfield 站 | 每项目一段短循环静音片，进入视口播放；导航随滚动高亮（IntersectionObserver）；全站媒体 < ~15MB，单片 1–2MB；首屏 ≤500KB | 「同一卡片模板」一条已被 D9 推翻 |
| D20 | Higgsfield | 只作素材工厂；首轮总上限 **$10**（视频层 ≤$3 含在内）；每次生成前 estimate；API key 未给、余额 $0 → **零生成** | |
| D21 | Louis 声音 | 用用户已有的 Higgsfield「Louis」声音 | 账号未确认：`list_voices` 只返回预设（OPEN） |
| D22 | AI 素材 | 允许使用 AI 生成素材 | 项目实物展示仍用真实截图/录屏 |
| D23 | 旧素材 | 旧 7.4MB 背景视频不复用；旧站 5 个「云内部」设计案例可公开，但**泛化产品名与内部数字** | |
| D24 | 仓库规则 | [R3]（`AGENTS.md` 约第 54 行：揭示/视差用 rAF + watchdog）与 CSS scroll-driven 动画冲突 → **需用户授权**或按「渐进增强」实现 | 自托管字体、新增依赖需用户批准 |
| D25 | 流程 | 仅文档；无 go-ahead 不构建/付费/部署/生成；分阶段；分支 + Vercel Preview；用户批准后才合并 | §11 |

---

## 3. 信息架构（Information architecture）

### 3.1 路由
```
/            EN 首页      /zh/          中文首页
/work/<key>  EN 项目页    /zh/work/<key> 中文项目页   （由 manifest 生成，七项）
/work/design-cases/<slug>  旧站设计案例（泛化后，次要集合）
/about  /zh/about           关于 + 能力 + 理念（取自旧站，压缩）
/contact /zh/contact
```
- 路由、sitemap、导航、hreflang、Louis 旁白队列**全部由 manifest 推导**。去掉 `vercel.json` 手写 rewrite，改用预渲染输出 `<route>/index.html` + `cleanUrls: true`（Opus 先前评审已确认 `src/seo.ts` 按 key 生成页面，可沿用其思路）。
- 首次访问**不强制跳转**语言；依据 `Accept-Language` 给一个轻提示「切换到中文 / Switch to English」。

### 3.2 首页结构（自上而下）
1. **Hero**：Louis 登场 + 一句站点开场白（字幕常显）+ 声音开关 + 滚动提示。
2. **七个同权章节**，顺序 = manifest `order`（默认：Aviso → PrintPlay → 蒸汽站 → 随口英语 → 小姨家 → 桃桃屋 → 野生路易斯；不暗示主次）。
3. **次要条目**（紧凑列表，不进七章、不配旁白）：Agent 工程体系（不放仓库链接）、supplier-link-analysis（仅脱敏假数据截图）、设计案例集合入口。
4. **能力 / 理念**（旧站提取、压缩）。
5. **联系** + 页脚（含 AI 生成标签，见 §7.10）。

### 3.3 全局 UI
- **章节导航**：固定的 01–07 编号目录（+ 项目名），IntersectionObserver 高亮当前章节；点击平滑滚动到章节（reduced-motion 下直接跳）。
- **声音开关**：右上角常驻（§5）。**语言切换**：右上角。
- **字幕条**：固定位置（桌面：Louis 迷你头像旁；移动端：底部安全区之上），不遮挡主体内容。
- **全局风格不随章节改变**：底色、字体、导航、开关、字幕条在七章间保持一致；项目识别色只出现在章节内部的小面积元素上（D10）。

### 3.4 视觉基线（OPEN 中的默认）
- 工作基线 = 视觉方向文档的 **方向 D「Louis 叙述者」**：编辑部排版骨架（纸 `#F3EFE6` / 墨 `#1A180F` / 强调 `#2D2BD4` / 状态荧光 `#D4FF3A` 极小面积）+ 局部深色「终端窗」承载 Louis 与 hacker 效果。
- 你可以在 P1 交付 **2 张静态 style frame**：①方向 D（纸底 + 终端窗）②深色变体（近黑底，Riddle/Atomic 式）。由用户选，**选定前不写全局主题**。
- 字体 ≤3 个家族、自托管 woff2、按字符子集（中文必须子集化或用系统字体栈 `PingFang SC / Microsoft YaHei / Noto Sans SC`）。**自托管新字体 = 新增资源，需用户批准**（D24）。

---

## 4. Louis 叙述者规格（Narrator spec）

### 4.1 人设
- Louis 是**虚构的 AI 虚拟人设**，是这个站的「作者/讲解员」，也是野生路易斯章节的主角（自指）。
- 肖像：**默认不使用任何真人脸**。写实路线只能是**虚构的 AI 生成角色**；是否基于用户本人脸 = OPEN-2，不由你决定。
- 声线：用户在 Higgsfield 已有的「Louis」声音（D21）。未核实前，开发用**占位音频**（静音片或系统 TTS 仅限本地开发，不入库、不上线）。

### 4.2 形态（D12，由你按最终视觉效果决定）
| 方案 | 实现 | 规则 |
|---|---|---|
| A 虚拟轮廓（procedural outline） | SVG/Canvas 描边剪影 + 扫描线 + 色差切片 + 切片位移；嘴部区域用声波条/voice bar 代替口型 | 实时响应光标与振幅；体积 30–90KB |
| B 写实（虚构角色） | **只能**预渲染视频/序列帧（Higgsfield）；纯黑底 + `mix-blend-mode: screen`，不做 WebM alpha | 口型对不上音频 → 把嘴藏起来（背光剪影/面罩/只露轮廓） |
| 混合（允许） | A 作底座与兜底 + B 作可选纹理层（如 10–20% 不透明度、单色阈值化、边缘检测的「信号幽灵」） | 视频失败/省流量/reduced-motion → 纯 A |
- **决策规则**：只有当写实/混合在**最终视觉效果**上明显更好，且满足 $3 上限、移动端、恐怖谷三项时才采用；否则纯轮廓。用 1 条测试片证明（§9.3）。
- **接口固定**（便于以后换形态而不动页面）：`mount(el) / setState('idle'|'talk'|'react') / setLevel(rms0to1) / dock(true|false) / destroy()`。

### 4.3 片段状态机（若用视频层）
- `idle`：循环待机（默认）。`talk`：可省略——idle 片 + 振幅驱动覆盖层即可表现说话（推荐省掉以减体积）。`react`：一次性短反应，由鼠标/点击触发，播完回 idle。
- 所有片段从同一张中性首帧开始、同一张结束；两个 `<video>` 层 150–250ms 交叉淡入；预加载下一片；只在边界切换。
- **覆盖层**（与片段无关、始终实时）：`MediaElementAudioSourceNode → AnalyserNode`，每帧算 RMS → 写入 CSS 变量 `--louis-level`（0–1，带平滑 attack 40ms / release 180ms）→ 驱动扫描线不透明度、辉光强度、色差偏移、横向切片抖动。

### 4.4 旁白内容
- **开场白**（Hero）：1–2 句，≤8 秒/句。
- **章节句**：每章 1–2 句（来自 manifest `narration`），总长 ≤10 秒/章。
- **鼠标触发短句**（全局池，`louis.lines.json`）：5–10 句，每句 ≤4 秒，俏皮/hacker 口吻，不传达关键信息。
- **文案作者**：OPEN-3（建议你起草 zh/en，用户审批后才去生成音频）。
- 音频：opus（Ogg/WebM），24–32kbps 单声道，约 10–30KB/句；Safari 兜底 AAC（m4a）。

### 4.5 播放规则（适用于 D7 最新指令）
1. **一次只播一句**，不叠播；句间冷却 ≥1.2s。
2. **章节句触发**：章节可见面积 ≥55% 且停留 ≥450ms 才触发（防快速滚动刷屏）；**每次会话每章自动只讲一次**；回滚到已讲过的章节不自动重讲（可点 Louis 头像重听）。
3. **快速滚动**：队列只保留「当前章节」最新一句，过时的丢弃；正在播放的句子若用户已滚过两章以上，淡出 200ms 后切到当前章节。
4. **鼠标短句**：仅在音频已解锁后启用；冷却 ≥20s；每会话 ≤3 句；不打断开场与章节句；触屏 = 轻点 Louis 头像触发。
5. **Hero 之后的在场形态**：Louis 缩为角落迷你头像（dock），**仍随章节句说话**（覆盖层振幅驱动保持，帧率可降到 30fps）；字幕条贴在头像旁。
6. **停止条件**：离开首页（路由切到 `/work/*` 等）、标签页隐藏（`visibilitychange`）、用户关闭声音开关 → 立即淡出（300ms）并清空队列。项目详情页**没有**旁白（Louis 只是首页叙述者）。
7. 切换语言：停止当前句，不重播开场；之后的句子用新语言音频与字幕。
8. 字幕**与音频解耦**：声音被拦、关闭或未加载时，字幕仍按同一触发规则显示（按字数估算时长：zh ≈ 4.5 字/秒，en ≈ 15 字符/秒，最短 1.8s）。

### 4.6 与旧说法的调和（OPEN-1，必须保留开关）
- 旧文档：「滚离 Hero，Louis 音频立即停止，章节不自动讲，仅点击迷你头像播放章节句」。
- 用户最新指令：「首页叙述者，用户滚动时为每个章节讲 1–2 句」。
- **按最新指令实现为默认**，同时保留构建期/运行期开关 `NARRATION_SCOPE = "home-all-sections" | "hero-only"`：`hero-only` 时退化为旧行为（离开 Hero 停止，章节句仅点击头像触发）。可能的理解：用户早先说的「离开首页就停」指离开 **首页路由**，而非离开 Hero——本文默认按此理解（见 4.5-6），**请用户确认**。

### 4.7 hacker 风效果清单（全部受 §6 tokens 约束）
扫描线、RGB 色差分离、横向切片位移（`glitch-cut`）、终端字符雨（**仅 Hero**）、等宽状态读数（只写真实信息：`LIVE` / `开发中 In development` / `AI-generated`）、光标靠近头像时的轮廓抖动。闪烁频率 **≤3Hz**，单次 glitch ≤160ms，避免光敏风险。

---

## 5. 声音规格（Sound spec）

### 5.1 主流程（D15）
1. 页面加载即**尝试有声播放**：创建 `AudioContext` → `resume()`，并 `audio.play()` Hero 开场白；Louis 视觉与字幕同时静音启动（静音动画/视频始终允许）。
2. 同时在 `pointermove`、`scroll`、`wheel`、`keydown`、`pointerdown`、`touchend` 上挂**一次性解锁监听**：每个事件都调用一次 `resume()`/`play()`。成功即移除全部监听，**不弹任何东西**。
3. 若开场已过，解锁后**不从头补播开场**，而是讲「当前所在章节」的句子（时间轴对齐，不积压）。
4. **诚实说明（必须写进代码注释与验收说明）**：按 HTML 规范，只有 `keydown`、`mousedown/pointerdown`、`pointerup`、`touchend`、`click` 等是「用户激活」事件；**`scroll`、`mousemove` 通常不算**。所以多数首访者会在第一次点击/按键/触摸时才出声，或看到兜底提示。Chrome 的 Media Engagement Index 可能让回访用户直接放行，无法保证。这是浏览器限制，不得用 hack 规避。

### 5.2 兜底提示（只在被拦时出现）
- 条件：`play()` 抛 `NotAllowedError`，或 `AudioContext.state === "suspended"` 持续 >600ms。
- 表现：Louis 头像旁一个脉冲小浮标「🔊 点一下开声音 / Tap for sound」，不遮挡内容，不是全屏门；点击后立即播当前句。被放行时**永不出现**。
- 浮标出现期间字幕照常走。

### 5.3 常驻开关
- 右上角，`<button aria-pressed>`，键盘可达，状态可见（图标 + 文字 `声音 开/关` / `Sound on/off`）。
- 默认 = 开；用户选择存 `localStorage`（`ailiu.sound`）；关 = 立即停止全部音频（旁白、鼠标短句、UI 音效）并暂停 analyser。
- 用户上次选「关」：不自动尝试播放，只显示字幕。

### 5.4 降级
- `prefers-reduced-motion: reduce`、`navigator.connection.saveData`：**不自动播放**，开关显示为开但需点击一次（浮标出现）；无 glitch 闪烁；字幕静态显示。
- 音频加载失败：静默降级为纯字幕，不报错给用户。

### 5.5 其他声音
- UI 音效：Web Audio 代码合成（≤100ms sine/square 提示音），零素材；与开关联动；每次交互最多一次。
- 配乐/氛围循环：**第一阶段不做**（Suno 无官方 API，需用户手动生成交付；另议）。
- 视频片段一律去音轨（`-an`）。
- 不用麦克风：`Permissions-Policy: microphone=()` 保持；CSP 加 `media-src 'self' blob:`。
- 无障碍：字幕区域**不要**用 `aria-live` 重复朗读（与音频冲突）；提供「显示全部旁白文字」的可展开文本（读屏可读）。

---

## 6. 统一动效系统（Motion system）

> 全站只有一套动效语言。章节 treatment 可以定制**编排（choreography）**，但只能使用下面的 tokens 与 preset 词汇；不得引入词汇表外的缓动、时长或「一次性」全局效果。

### 6.1 Tokens（CSS 变量，`src/motion/tokens.css`）
| 类别 | token | 值（实测后可微调，但改 token 不改用法） |
|---|---|---|
| 时长 | `--dur-instant / fast / base / slow / hero` | 80 / 160 / 360 / 640 / 1100 ms |
| 缓动 | `--ease-out` | `cubic-bezier(.16,1,.3,1)`（进入） |
| | `--ease-in` | `cubic-bezier(.7,0,.84,0)`（退出） |
| | `--ease-inout` | `cubic-bezier(.65,0,.35,1)`（位移/切换） |
| | `--ease-linear` | `linear`（仅滚动绑定 scrub） |
| 错峰 | `--stagger` | 60ms，单组 ≤6 个 |
| 位移 | `--dist-s / m / l` | 12 / 32 / 80 px |
| 深度（2.5D） | `--persp` / `--z-s / m / l` | 1200px / 20 / 60 / 140 px |
| 旋转上限 | `--tilt-max` | 18deg（任何 rotateX/Y 不超过） |
| glitch | `--glitch-dur` / `--glitch-max-hz` | 80–160ms / 3Hz |

### 6.2 Preset 词汇（注册表 `src/motion/presets.ts`，manifest 只能引用这些键）
| 键 | 用途 | 定义 |
|---|---|---|
| `reveal-up` | 文字、卡片默认进入 | opacity 0→1 + translateY `--dist-m`→0，`--dur-base`，`--ease-out` |
| `mask-wipe` | 大图、设备框 | `clip-path: inset(100% 0 0 0)`→`inset(0)`，`--dur-slow` |
| `glitch-cut` | **章节交界的标志转场**（全站统一） | 80–160ms 切片位移 + 色差闪切；只用于章节交界与 Louis，不用于正文 |
| `fade-through` | 退出、降级、reduced-motion 统一替身 | 纯淡入淡出，`--dur-fast` |
| `depth-rise` | 2.5D 物件进入（Aviso 窗口、PrintPlay 纸张） | `perspective(--persp)` 下 rotateX ≤`--tilt-max` → 0 + translateZ `--z-l`→0，`--dur-slow` |
| `stack-fan` | 一组物件展开/错位（纸张、屏幕、视频墙） | 逐项 translate/rotate 错峰展开，`--stagger`，≤6 项 |
| `scrub` | 滚动绑定的连续变化（仪表读数、窗口旋转） | 仅 `--ease-linear`，绑定章节内 scroll progress 0–1 |
| `ticker` | 数字/文字滚动计数 | 逐字切换，`--dur-fast`/字 |
- 新增 preset 必须改本文（经用户批准），不能在章节组件里私写。

### 6.3 章节转场语法（所有 treatment 共享）
`enter`：交界 `glitch-cut`（全局统一）→ 章节内容按 treatment 的 choreography（只用上表 preset）→ `dwell`：驻留态（可有 `scrub`）→ `exit`：`fade-through` 或 enter 反向。
- 进入区间 `animation-range: entry 10% entry 60%`；退出 `exit 20% exit 70%`；任何元素的动画区间不得超过一屏高度；章节内 scrub 区间 ≤ 章节高度（章节可 sticky，最长 **200vh**）。
- Louis 章节句在 `enter` 完成后（dwell 开始）触发，与 §4.5-2 一致。

### 6.4 实现路线与 [R3]
- 默认实现（不违反 R3）：IntersectionObserver + rAF（含 watchdog：rAF 连续 >2s 未触发或掉帧严重时降级为静态终态）。
- CSS `animation-timeline: view()/scroll()` **只作为 `@supports` 渐进增强**，且**必须先得到用户对 R3 的授权或确认「渐进增强」解读**；未授权前不写。
- 不引入 GSAP/Lenis/framer-motion 等新依赖（新增依赖需用户批准）；若你认为必要，写理由与体积，等批准。
- 只动画 `transform`、`opacity`、`clip-path`、`filter`（少量）；不动画 layout 属性。

### 6.5 reduced-motion 兜底
`prefers-reduced-motion: reduce` 时：所有 preset → `fade-through`；无 glitch、无视差、无 2.5D 旋转、无 scrub（直接显示终态）；循环视频改为 poster；字符雨关闭；Louis 静态轮廓 + 字幕。

### 6.6 动效验收清单
1. 代码中只出现注册表内的 preset；`rg "@keyframes" src/sections` 结果只能是引用注册表生成的 keyframes（校验脚本检查）。
2. 七章交界都是同一个 `glitch-cut`。
3. 所有时长/缓动来自 tokens（lint：禁止在 sections 内写字面量 `cubic-bezier`/`ms` 动画时长）。
4. reduced-motion 全站走查通过。
5. 中端安卓（如 Pixel 6a 级）与 iPhone 12 级抽检：滚动 ≥55fps，无长任务 >50ms 连续出现。
6. 切换语言不重播转场；回滚不重复 glitch 爆闪。
7. 闪烁 ≤3Hz（人工 + 录屏逐帧抽查）。

---

## 7. 章节：共享契约 + 七个定制 treatment

> **【SUPERSEDES】计划 DECIDED-4「七章同一卡片模板」、§L7 `template` 字段、视觉方向 D「七章同模板」、站点研究借鉴项 2「统一模板」。** 用户 2026-10-15 最新决定：**不用一个相同模板**。每章根据项目性质单独设计呈现与动效（treatment）。
> **仍然共享**：§6 动效语言（tokens/缓动/preset 词汇/reduced-motion）、manifest 驱动的数据与文字槽位、旁白/字幕钩子、导航高亮、媒体预算、章节交界 `glitch-cut`。
> **仍然禁止**：任何单个项目主导**全站**风格/观感（D10）。定制只发生在章节内部的舞台（stage）里。

### 7.1 共享契约（Section contract，每个 treatment 必须实现）
每个 treatment 模块位于 `src/sections/<treatmentId>/`，导出：
```ts
export interface SectionTreatment {
  id: string;                 // e.g. "aviso-browser-depth"
  choreographyId: string;     // e.g. "aviso.browser-depth.v1"（注册于 src/motion/choreographies.ts）
  enter: PresetKey;           // 只能取 §6.2 注册表；章节交界 glitch-cut 由外壳统一加
  exit: PresetKey;
  stageHeightVh: number;      // 章节舞台高度，100–200
  Component: (p: SectionProps) => JSX.Element;
  StaticFallback: (p: SectionProps) => JSX.Element; // 预渲染/无 JS/reduced-motion/低端机
}
interface SectionProps {
  project: ProjectEntry; lang: "zh" | "en";
  progress: number;           // 0–1 章节内滚动进度（外壳计算，treatment 只读）
  reducedMotion: boolean; lowPower: boolean;
  onNarrationCue: () => void; // treatment 在 dwell 开始时调用一次 → Louis 讲本章句子
}
```
外壳组件 `SectionShell` 统一负责：锚点 id、导航高亮、`glitch-cut` 交界、`progress` 计算、视口内才挂载媒体、字幕/旁白钩子、`lang`、固定文字槽渲染位置约定。
**每章必须渲染的固定文字槽（fixed slots）**：
| 槽位 | zh 上限 | en 上限 | 说明 |
|---|---|---|---|
| `index` | — | — | `01`–`07`，由 order 推导 |
| `title` | 8 字 | 24 字符 | 项目名，不翻译专有名（Aviso、PrintPlay） |
| `tagline` | 18 字 | 60 字符 | 一句话说清是什么 |
| `blurb` | 60 字 | 160 字符 | 可选，最多 2 行可见（`line-clamp`） |
| `status` | 4 字 | 16 字符 | 等宽读数：`上线 LIVE` / `开发中 In development` / `AI 生成 AI-generated` |
| `cta` | 6 字 | 20 字符 | 可选链接文字 |
| `narration.subtitle` | 40 字 | 110 字符 | 每句；每章 ≤2 句 |
文字槽的**位置、字号、最大宽度**在七章间可以随 treatment 变化，但必须都存在、都可被读屏读到、且文案变长不改布局（固定高度 + `line-clamp`）。

### 7.2 双语文案规则（Bilingual copy rules）
1. **起点**：取 ailiu.online `src/content.ts` 与旧站 mongocyber.github.io 的项目描述，**压缩**后落槽；没有旧描述的项目（PrintPlay、蒸汽站、随口英语、桃桃屋、野生路易斯）从线上页面/仓库 README 提炼，由你起草、用户审批。
2. **视觉优先**：首页每章只露上述槽位；背景、做法、技术栈放 `/work/<key>` 详情页。
3. **两种语言各自自然**，不逐字直译；同一槽位意思一致、长度各守上限。
4. **专有名词**：产品名保留原文（Aviso、PrintPlay、Louis）；中文名对应：蒸汽站 ↔ Steam Vent Calc（en 标题，以 steamventcalc.com 品牌为准）、随口英语 ↔ Suikou English、小姨家 ↔ Xiaoyi's Home、桃桃屋 ↔ TaoTao House、野生路易斯 ↔ Wild Louis。
5. **排版**：中文用全角标点；中英混排时英文词两侧加空格（如「Chrome 划词 AI 助手」）；英文用 sentence case，tagline 不加句号。
6. **不放数字指标**（流量、收益、用户数、内部数字）；设计案例中的内部产品名（如 OBS）与数字一律泛化（「某云平台的对象存储服务」「多个业务团队」）。
7. **语气**：章节文案 = 克制、作者口吻；Louis 旁白 = 第一人称、轻 hacker 口吻、每句一个信息点，不重复屏幕上的 tagline 原文。
8. **字幕断行**：zh 每行 ≤20 字、≤2 行；en 每行 ≤42 字符、≤2 行；按语义断，不拆专有名。
9. **状态标签**：只写真实状态；随口英语固定为「开发中 / In development」；野生路易斯与 AI 素材固定为「AI 生成 / AI-generated」。
10. 缺译：迁移期**警告**（不阻塞构建）并输出缺译清单；上线前（P4）必须为零。

### 7.3 Aviso（Chrome 扩展：划词 AI 助手）— treatment `aviso-browser-depth`
- **性质**：浏览器里的工具 → 让浏览器窗口本身当舞台。
- **呈现**：一个用 **DOM 分层**搭成的「立体感」浏览器窗口（标签栏 / 地址栏 / 网页内容 / 划词高亮 / Aviso 弹出面板，各为一层），内容贴真实截图（现有 `public/aviso/` 5 张 → webp）。
- **3D 解读（需用户确认）**：用户例子说「scroll effects reveal a 3D-like browser window」。**本文解读为 CSS 3D transforms / 2.5D 分层 DOM**（`perspective`、`rotateX/Y`、`translateZ`、视差），**不是** WebGL/Three.js/3D 建模——3D 仍排除。→ OPEN-4，请用户确认。
- **Choreography `aviso.browser-depth.v1`**（stage 200vh，sticky）：
  1. 进入：窗口 `depth-rise`（从 rotateX 18° / rotateY −12°、translateZ −140px 立起到正面）。
  2. scrub 0.25–0.55：图层沿 Z 轴拉开（网页 0 / 高亮 +20px / 面板 +60px），像「拆开看结构」，标注 3 个关键功能点（`ticker` 逐个出现，文字取自真实功能，≤3 个）。
  3. scrub 0.55–0.85：图层合拢，窗口内播放「选中文字 → 面板弹出」的短循环录屏（静音，进入视口才播）。
  4. dwell：触发 `onNarrationCue`；退出 `fade-through`。
- **素材**：5 张现有截图（webp，各 ≤150KB）；1 段真实录屏 5–6s（≤1.2MB，WebM VP9 + MP4 兜底）；窗口 chrome 用 CSS 画，不用图。
- **预算份额**：媒体 ≤1.8MB；Higgsfield $0。
- **移动端/降级**：不旋转、不拉 Z；平面窗口 `mask-wipe` 进入 + 录屏 poster（点按播放）；reduced-motion 为静态窗口截图。
- **链接**：aviso-nine.vercel.app（线上已验证 200）；不放仓库链接（开源计划未定）。

### 7.4 PrintPlay（可打印词卡/活动页）— treatment `printplay-paper-stack`
- **性质**：产出物是纸 → 纸的物理感。
- **呈现**：桌面上一叠可打印页（真实 PDF 页面渲染成 webp），一台抽象「打印口」线条。
- **Choreography `printplay.paper-stack.v1`**（stage 180vh）：
  1. 进入：纸从打印口 `mask-wipe` 自上而下「打印出来」。
  2. scrub：纸堆 `stack-fan` 扇形展开成 4–6 张（词卡、活动页、冬季专题），最上面一张做对折展开（两半 `rotateX` ≤18°，2.5D）。
  3. 悬停/轻点某张：该张 translateZ 提起 + 轻微阴影（`--dur-fast`）。
  4. dwell 触发旁白；退出：纸堆收回 `fade-through`。
- **素材**：4–6 张 PDF 页面图（各 ≤120KB）；可选 1 段线上站操作录屏 ≤1MB（若视觉已足够可不做）；纸纹可用 CSS/SVG 噪点，不用视频。
- **预算份额**：媒体 ≤1.5MB；Higgsfield $0（可选 1 张纸纹图 ≤$0.1）。
- **移动端**：纵向小堆叠，`reveal-up` 逐张出现，无对折。
- **链接**：printplay.asia。不放 GSC/AdSense 数据。

### 7.5 蒸汽站（steamventcalc.com：带出处的公式库 + 计算器）— treatment `steam-gauge-pipes`
- **性质**：工程计算、可追溯 → 「活的」仪表与管路。
- **呈现**：SVG 单管蒸汽系统示意（锅炉 → 管路 → 散热器 → 排气阀），一只压力/流量仪表，一个小计算面板。
- **Choreography `steam.gauge-pipes.v1`**（stage 180vh）：
  1. 进入：管路线条描边生长（`stroke-dashoffset`，`scrub`）。
  2. scrub：管内「蒸汽」虚线流动；仪表指针随进度 `scrub` 转动；读数 `ticker` 计数。
  3. 交互（桌面/移动均可）：一个滑块（如管长或散热器 EDR），读数实时变化——**数值必须来自用户公开库 `steam-hydronic-formulas` 的真实计算并标「示例 / Demo」与出处**；若不批准引入该库作依赖，则改为构建期预计算的 3–5 个档位静态表（同样来自该库）——两种方式都需用户批准（新依赖/新脚本）。**禁止编造数值。**
  4. dwell 触发旁白；退出 `fade-through`。
- **素材**：纯 SVG/CSS（≤40KB）+ 1–2 张真实计算器截图（≤150KB）；可选 1 段线上站录屏 ≤1MB。
- **预算份额**：媒体 ≤1.2MB；Higgsfield $0。
- **移动端**：保留描边与指针（轻量），滑块保留；去掉流动粒子。
- **链接**：steamventcalc.com、公开仓库 steam-hydronic-formulas。不放流量数据。

### 7.6 随口英语 Suikou English（亲子英语场景卡微信小程序，未上线）— treatment `suikou-phone-flow`
- **性质**：手机小程序 → 手机框里的真实界面。
- **呈现**：CSS 画的手机框（非图片），框内是**小程序真实页面**（截图或 `suikou-english-prototype` 静态原型截图），等宽状态读数「开发中 / In development」。
- **Choreography `suikou.phone-flow.v1`**（stage 180vh）：
  1. 进入：手机 `depth-rise`（轻微倾斜立起）。
  2. scrub：框内 3–5 屏横向滑过（场景卡 → 卡片翻面 → 跟读），每屏切换 `--dur-base`；场景卡翻面用 rotateY（2.5D，≤18°）。
  3. dwell 触发旁白；退出 `fade-through`。
- **规则**：**无外链**；二维码 = 可选槽 `qr`，缺省时布局正常（不留空洞）；以后加二维码只改 manifest。
- **素材**：3–5 张界面截图（各 ≤100KB，竖屏 2x）；可选原型录屏 ≤1MB。**缺：真实小程序截图（OPEN）** → 先用原型截图。
- **预算份额**：媒体 ≤1.2MB；Higgsfield $0。
- **移动端**：手机框占满宽度，屏幕改为手动左右滑（scroll-snap x），不绑定纵向 scrub。

### 7.7 小姨家 Xiaoyi's Home（性质待定，需要源材料）— treatment `xiaoyi-*`（候选）
- **现状**：仓库里只有 `public/xiaoyi/` 5 张 PNG（cover、detail-cover、main-visual、menu-materials、packaging），看起来是品牌/包装/菜单视觉设计；没有代码仓库。项目真实性质（为谁做、什么业务、角色）**未知 → OPEN，需要用户提供源文件与背景**。
- **候选 treatment（用户选一个；默认 A）**：
  - **A `xiaoyi-brand-book`（默认）**：品牌手册翻页——2.5D 翻页（rotateY 绕书脊，≤18° 的视觉暗示 + `mask-wipe`），依次 Logo → 主视觉 → 包装 → 菜单。只用现有 5 张图即可做。
  - **B `xiaoyi-package-layers`**：包装「拆解」——包装盒/贴纸/菜单作为分层 DOM 沿 Z 轴分离（视差），适合包装是主角的情况；需要分层素材（PSD/AI 源文件）。
  - **C `xiaoyi-menu-board`**：若小姨家是真实的餐饮/家庭小店，做成菜单板：菜品 `ticker` 轮换、菜单物料 `stack-fan`；需要菜单原文与照片。
- **Choreography（A）`xiaoyi.brand-book.v1`**（stage 160vh）：进入 `depth-rise` → scrub 翻 4 页 → dwell 旁白 → `fade-through`。
- **素材**：现有 5 张转 webp（各 ≤200KB）；B/C 需源文件。可选：用 ffmpeg 对设计图做 Ken Burns 慢推循环 ≤1MB（非 AI）。
- **预算份额**：媒体 ≤1.5MB；Higgsfield $0。
- **移动端**：单页纵向 `reveal-up`，不翻页。

### 7.8 桃桃屋 TaoTao House（儿歌频道：YouTube + 抖音）— treatment `taotao-video-wall`
- **性质**：视频频道 → 视频墙。
- **呈现**：3×2（桌面）/ 2×2（移动）视频墙，每格一段频道自有视频的短循环（静音）或封面；平台按钮。童趣只出现在格子里的素材内容中，**不改全站底色/字体**（D10）。
- **Choreography `taotao.video-wall.v1`**（stage 140vh）：
  1. 进入：格子 `stack-fan` 从叠在一起错峰铺开成墙。
  2. 同时**最多 2 格在播**（最靠近视口中心的 2 格），其余显示 poster——控制解码与流量。
  3. 悬停/轻点格子：该格放大 translateZ `--z-s`，开始播放（静音）。
  4. dwell 旁白；退出 `fade-through`。
- **链接**：
  - YouTube：**候选 `https://www.youtube.com/@TaoTaoHouse`**（频道 ID `UCDP1wm7QeHpVvju4RFI1GpQ`，页面标题「TaoTao House 桃桃屋」，2026-10-15 箱子 curl 取得）——**需用户确认是不是自己的频道**再上线。
  - 抖音：**未找到**，需用户提供主页链接（OPEN）。
- **素材**：4–6 段 3–4s 循环（各 ≤300KB，480p），来自用户自己的频道视频（需用户提供原片或确认可从频道截取）；封面 webp 各 ≤60KB。
- **预算份额**：媒体 ≤1.8MB；Higgsfield $0。
- **移动端**：2×2，只播 1 格；saveData/reduced-motion 全部 poster。
- 不放播放量/粉丝数。

### 7.9 野生路易斯 Wild Louis（纯虚拟、全 AI 生成、自指）— treatment `wild-louis-meta-layer`
- **定义**：**这个站本身就是 Louis 的作品**。本章是 Louis 的自我介绍 + 这个站的「幕后/元层」。**旧「家庭情景喜剧」定位作废。** 内容极简但真实，随时间增长；**不是** coming-soon 预告，不写「即将上线 / 筹备中」。
- **呈现（meta layer）**：进入本章时，**整个视口的「源代码层」被揭开**——页面的网格线、本章节自己的 manifest JSON 片段、motion tokens 实时值、`--louis-level` 读数、AI 素材生成日志（prompt 摘要 / 模型 / 日期 / 花费），像在看这个站的「X 光」。Louis（大尺寸）用第一人称 1–2 句介绍自己与本站。
- **Choreography `wildlouis.meta-layer.v1`**（stage 160vh）：
  1. 进入：交界 `glitch-cut` 后，叠加层用 `mask-wipe` 揭开「源码层」（等宽字体、低对比度）。
  2. scrub：manifest 片段 `ticker` 逐行打出；网格线描边；Louis 轮廓从迷你头像放大回章节中央（`depth-rise`）。
  3. dwell：Louis 讲本章句子（音频振幅驱动整层扫描线——本章是振幅驱动最明显的地方）。
  4. 「制作日志 / Build log」列表：manifest `log[]` 驱动，**每新增一条（新素材、新章节、新功能）自动出现**，这就是「随时间增长」的机制。
  5. 退出：源码层 `fade-through` 收起，Louis 回到迷你头像。
- **规则**：manifest `type: "virtual"`、`aiGenerated: true`、必须有 `disclosure`；章节内可见「AI 生成 / AI-generated」标签；**页脚也有全站 AI 生成说明**（措辞 OPEN）。链接可选（`links: []` 合法）；用户已有的「野生路易斯」社媒账号是否链接 = OPEN（其旧内容定位已作废，建议先不链）。
- **素材**：Louis 头像本身（复用 §4，不额外计）；1 张 AI 生成「人设设定图」(≤150KB)；可选 1 段 AI 生成循环 ≤1MB（计入 $3 视频层或 $10 总额，先 estimate）；其余全是代码生成（读取真实 manifest，零素材）。
- **预算份额**：媒体 ≤1.3MB；Higgsfield ≤$1.5（含设定图与可选循环）。
- **移动端**：源码层只显示 8–12 行、静态网格；无整页 X 光叠加，只在章节内显示。

### 7.10 页脚 AI 标签
- 全站页脚一行（措辞 OPEN，默认）：「本站部分图像、视频与 Louis 的声音由 AI 生成。/ Some images, video and Louis's voice on this site are AI-generated.」
- 野生路易斯章节与每个 `aiGenerated: true` 素材附近有小标签；可被读屏读出。

---

## 8. Manifest 规格（Project manifest）

### 8.1 文件
- `content/projects.manifest.json`（单一事实源；用 JSON 便于脚本校验，TypeScript 类型由 `content/manifest.schema.ts` 生成/声明）。
- `content/louis.lines.json`：开场白、鼠标短句池。
- `src/sections/registry.ts`：treatment 注册表；`src/motion/presets.ts`、`src/motion/choreographies.ts`：preset 与 choreography 注册表。

### 8.2 示例（节选三项）
```json
{
  "version": 1,
  "narrationScope": "home-all-sections",
  "projects": [
    {
      "key": "aviso",
      "order": 10,
      "type": "product",
      "status": "live",
      "title":   { "zh": "Aviso", "en": "Aviso" },
      "tagline": { "zh": "Chrome 划词 AI 助手", "en": "Select any text, ask AI in place" },
      "blurb":   { "zh": "（P1 从 content.ts 旧描述压缩后填写）", "en": "(fill in P1 from content.ts)" },
      "statusLabel": { "zh": "上线", "en": "LIVE" },
      "treatment": { "id": "aviso-browser-depth", "choreographyId": "aviso.browser-depth.v1" },
      "transition": { "enter": "depth-rise", "exit": "fade-through" },
      "accent": "#6F8A5B",
      "cover": { "src": "/media/aviso/cover.webp", "w": 1600, "h": 1000, "bytes": 0,
                 "alt": { "zh": "Aviso 在网页上划词后弹出的 AI 面板", "en": "Aviso AI panel after selecting text on a web page" } },
      "loop":  { "webm": "/media/aviso/loop.webm", "mp4": "/media/aviso/loop.mp4",
                 "poster": "/media/aviso/loop-poster.webp", "maxBytes": 1200000, "source": "screen-recording" },
      "assets": [ { "src": "/media/aviso/shot-1.webp", "role": "layer-page" },
                  { "src": "/media/aviso/shot-2.webp", "role": "layer-panel" } ],
      "narration": [
        { "id": "aviso-1",
          "clip": { "zh": "/audio/zh/aviso-1.opus", "en": "/audio/en/aviso-1.opus" },
          "durMs": { "zh": 5200, "en": 4800 },
          "subtitle": { "zh": "（待 Louis 文案审批）", "en": "(pending approval)" } }
      ],
      "links": [ { "label": { "zh": "打开", "en": "Open" }, "href": "https://aviso-nine.vercel.app" } ],
      "qr": null,
      "aiGenerated": false,
      "disclosure": null,
      "mobileFallback": "flat-window"
    },
    {
      "key": "suikou-english",
      "order": 40,
      "type": "product",
      "status": "in-development",
      "title":   { "zh": "随口英语", "en": "Suikou English" },
      "tagline": { "zh": "亲子英语场景卡小程序", "en": "Scene cards for everyday family English" },
      "blurb":   null,
      "statusLabel": { "zh": "开发中", "en": "In development" },
      "treatment": { "id": "suikou-phone-flow", "choreographyId": "suikou.phone-flow.v1" },
      "transition": { "enter": "depth-rise", "exit": "fade-through" },
      "cover": { "src": "/media/suikou/screen-1.webp", "w": 750, "h": 1624, "bytes": 0,
                 "alt": { "zh": "随口英语场景卡页面", "en": "Suikou English scene card screen" } },
      "loop": null,
      "assets": [ { "src": "/media/suikou/screen-1.webp", "role": "phone-screen" } ],
      "narration": [ { "id": "suikou-1", "clip": { "zh": "/audio/zh/suikou-1.opus", "en": "/audio/en/suikou-1.opus" },
                       "durMs": { "zh": 5000, "en": 4600 }, "subtitle": { "zh": "…", "en": "…" } } ],
      "links": [],
      "qr": null,
      "aiGenerated": false,
      "disclosure": null,
      "mobileFallback": "swipe-screens"
    },
    {
      "key": "wild-louis",
      "order": 70,
      "type": "virtual",
      "status": "self",
      "title":   { "zh": "野生路易斯", "en": "Wild Louis" },
      "tagline": { "zh": "这个站，是我做的", "en": "I made this site" },
      "blurb":   null,
      "statusLabel": { "zh": "AI 生成", "en": "AI-generated" },
      "treatment": { "id": "wild-louis-meta-layer", "choreographyId": "wildlouis.meta-layer.v1" },
      "transition": { "enter": "mask-wipe", "exit": "fade-through" },
      "cover": { "src": "/media/wild-louis/persona.webp", "w": 1200, "h": 1200, "bytes": 0,
                 "alt": { "zh": "Louis 的 AI 生成人设轮廓", "en": "AI-generated outline of Louis" } },
      "loop": null,
      "narration": [ { "id": "wild-louis-1", "clip": { "zh": "/audio/zh/wild-louis-1.opus", "en": "/audio/en/wild-louis-1.opus" },
                       "durMs": { "zh": 6000, "en": 5600 }, "subtitle": { "zh": "…", "en": "…" } } ],
      "log": [ { "date": "2026-10-15", "zh": "写下这份说明书", "en": "Wrote the build spec",
                 "model": null, "costUsd": 0 } ],
      "links": [],
      "qr": null,
      "aiGenerated": true,
      "disclosure": { "zh": "本章内容全部由 AI 生成。", "en": "Everything in this section is AI-generated." },
      "mobileFallback": "static-source-snippet"
    }
  ]
}
```
（tagline 示例仅为占位方向，最终文案以用户审批为准。）

### 8.3 字段规则
| 字段 | 必填 | 规则 |
|---|---|---|
| `key` | 是 | kebab-case，唯一；决定路由 `/work/<key>` |
| `order` | 是 | 唯一整数，步长 10 便于插入 |
| `type` | 是 | `product` / `design` / `channel` / `virtual` / `secondary`（secondary 不进七章、无旁白） |
| `status` + `statusLabel` | 是 | `live` / `beta` / `in-development` / `self`；标签只写真实状态 |
| `title`/`tagline` | 是 | zh/en 都要（迁移期缺译=警告）；长度见 §7.1 |
| `blurb` | 否 | null 合法 |
| `treatment.id` / `choreographyId` | 是 | 必须存在于注册表 |
| `transition.enter/exit` | 是 | 必须是 §6.2 preset 键 |
| `cover` | 是 | 文件存在；≤200KB；有 zh/en alt；作为 StaticFallback 与 OG 备用 |
| `loop` | 否 | 若有：webm+mp4+poster 都在；单文件 ≤`maxBytes`（硬上限 2,000,000）；`source` 标注 `screen-recording` / `channel-clip` / `ai-generated` / `ffmpeg-kenburns` |
| `narration[]` | 是（七章） | 1–2 条；每条 zh/en clip + subtitle + durMs；单句 ≤8s、单文件 ≤40KB；每章合计 ≤10s |
| `links[]` / `qr` / `log[]` | 否 | 空/null 合法，布局不得塌 |
| `accent` | 否 | 只用于章节内小面积元素；校验脚本禁止它被写进全局 CSS 变量 |
| `aiGenerated` / `disclosure` | 是 | `aiGenerated: true` ⇒ `disclosure` 必填 |
| `mobileFallback` | 是 | treatment 声明的降级方式名 |

### 8.4 校验脚本 `scripts/validate-manifest.ts`（`npm run validate`，CI 与 build 前置）
1. Schema 校验（字段、类型、枚举）；`key`/`order` 唯一。
2. 每个项目的 `treatment.id`、`choreographyId` 在注册表中存在；`transition` 只用注册表 preset。
3. **契约检查**：对每个注册的 treatment，确认导出 `enter`、`exit`、`Component`、`StaticFallback`、`stageHeightVh ∈ [100,200]`，且组件源码中调用了 `onNarrationCue`（静态 grep + 单元测试渲染检查）、渲染了全部固定文字槽（测试用 `data-slot` 属性断言 `index/title/tagline/status` 存在）。
4. zh/en 槽位齐全（迁移期警告、P4 失败）；字数上限（超 0–20% 警告、>20% 失败）。
5. 文件存在与体积：cover ≤200KB；loop ≤maxBytes ≤2MB；音频 ≤40KB/句、≤8s（用 `ffprobe` 读时长）。
6. **全站媒体总量 < 15MB**（`public/media` + `public/audio` 合计）；首屏资源 ≤500KB（读构建产物 + Hero 引用的资源）。
7. 旁白：七章每章 1–2 句；Hero 开场 ≤2 句；`louis.lines.json` 每句 ≤4s。
8. `aiGenerated ⇒ disclosure`；页脚 AI 说明字符串存在（zh/en）。
9. `sections/**` 内不得出现字面量缓动/时长、未注册 `@keyframes`、`three`/`webgl`/`getContext('webgl')` 字样（禁止 3D）。
10. 路由、sitemap、导航、旁白队列都从同一 manifest 生成（脚本对比生成物）。

### 8.5 新增一个项目的步骤
① 放素材到 `public/media/<key>/`、`public/audio/{zh,en}/` ② 在 manifest 加条目 ③ 选已有 treatment，或新建一个实现 §7.1 契约的 treatment（**新 treatment 需用户批准设计**）④ `npm run validate` ⑤ Preview 验收。旁白队列、导航、路由、sitemap 自动更新；不改外壳、动效 tokens 或 Louis 逻辑。
- 项目数 >9 时：首页只放 manifest 中 `featured: true` 的章节，其余进入 `/work` 索引；不改转场与旁白规则。

---

## 9. 素材与预算（Assets & budget）

### 9.1 素材来源原则
| 素材 | 来源 | AI 可否 |
|---|---|---|
| 项目实物展示（截图、录屏、PDF 页、界面） | 真实产品：线上站截图/录屏、仓库现有图、用户提供 | **不可**用 AI 图冒充 |
| 桃桃屋视频格 | 用户自己频道的视频 | 不可 |
| Louis 头像、声音、野生路易斯章节、纹理/底纹 | Higgsfield（或代码生成） | 可（D22），需标注 |
| UI 音效、扫描线、网格、字符雨、管路、纸纹 | 代码（CSS/SVG/Canvas/Web Audio） | — |
- 旧 7.4MB `philosophy-bg.mp4` **不复用**。旧站 PNG（约 24MB + 各案例 11–13MB）**不得原样入库**，只转 webp/avif 后挑选使用。

### 9.2 媒体体积预算（全站 < ~15MB；首屏 ≤500KB 不含懒加载媒体）
| 项 | 上限 | 说明 |
|---|---|---|
| Aviso | 1.8MB | 录屏 ≤1.2MB + 截图 |
| PrintPlay | 1.5MB | 纸张图为主 |
| 蒸汽站 | 1.2MB | SVG 为主 |
| 随口英语 | 1.2MB | 界面截图 |
| 小姨家 | 1.5MB | 设计图 |
| 桃桃屋 | 1.8MB | 4–6 段小循环 |
| 野生路易斯 | 1.3MB | 设定图 + 可选循环 |
| Louis（代码 + 可选视频层） | 1.5MB | 轮廓代码 ≤90KB；视频层 ≤1.2MB |
| 旁白音频（zh+en 全部） | 1.3MB | 约 48 句 × ~25KB |
| 其他（OG 图、设计案例图、能力页） | 1.5MB | |
| **合计** | **≈14.6MB** | 单条循环片硬上限 2MB，目标 ≤1.2MB |
- 编码参考：`ffmpeg -i in.mp4 -an -vf "scale=960:-2,fps=24" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 out.webm`；`ffmpeg -i in.mp4 -an -vf "scale=960:-2,fps=24" -c:v libx264 -crf 28 -preset slow -movflags +faststart out.mp4`；poster `-frames:v 1 poster.webp`。音频：`ffmpeg -i in.wav -ac 1 -c:a libopus -b:a 28k out.opus`。

### 9.3 Higgsfield 预算（首轮总上限 $10；视频层 ≤$3 含在内）
**现状：API key 未给、余额 $0 → 什么都没生成，什么都不能生成。** 价格各页面不一致，一律以账号内 `estimate` 为准（以下为估计）。
| 用途 | 上限 | 做法 |
|---|---|---|
| Louis 视频层（含野生路易斯可选循环） | **$3** | 先 estimate → **只做 1 条 480p 测试片**（估计 $0.2–0.7）→ 用户看过、确认能明显提升最终视觉后，才做其余（总计约 3–4 条以内） |
| Louis 旁白 TTS（用户已有的 Louis 声音） | ≤$3 | 先 estimate 单句成本 × 句数；文案获批后一次批量；不生成新声音 |
| 野生路易斯设定图 | ≤$1 | 1–3 张迭代 |
| 纹理/底纹（可选） | ≤$0.5 | 多数用代码实现 |
| 预留 | ≥$2.5 | 重试 |
- **每一次生成前**：调 estimate → 把「模型/参数/张数或秒数/估价」报给用户 → 用户同意 → 才生成。
- 产出约 7 天过期：**生成后立刻下载入库**，并在 `assets/LEDGER.md` 记录 prompt、模型、日期、实际花费；野生路易斯章节 `log[]` 同步一条。
- 建议用户关闭 Auto top-up。
- 不用 Higgsfield 的建站/部署、`generate_3d`。

### 9.4 Louis 声音
- 用户说 Louis 声音在其 Higgsfield 账号里；只读 `list_voices` 只返回 100 个预设、`voice_type=element` 为 0 → **账号/工作区未确认**（OPEN）。确认前不生成、不替换为别的声音。

### 9.5 其他工具
- Midjourney：第一阶段不用；若用户要用，需另行批准（由用户登录、人机验证由用户点）。
- Suno：第一阶段不用（无官方 API）。

---

## 10. 技术约束与性能（Tech constraints & performance）

### 10.1 栈
- 仓库 `mongocyber/ailiu.online`（私有）：沿用 React 19 + Vite 8 + TypeScript 6、构建期预渲染（`src/seo.ts` 思路）、`@vercel/analytics`。**代码从零写在新分支**，旧组件只参考。
- **新增任何 npm 依赖、自托管新字体、改仓库规则（含 R3）都需用户批准。** 默认零新增运行时依赖。

### 10.2 安全头（`vercel.json`）
- 保留严格 CSP；新增 `media-src 'self' blob:`；`img-src 'self' data:`；不放开第三方 CDN（大陆备用也不能依赖外域）。
- `Permissions-Policy: microphone=(), camera=()` 保持。
- 删除 ICP 展示与 `IcpLink` 全部引用。

### 10.3 性能预算
- 首屏 ≤500KB：HTML+CSS+JS（gzip）≤150KB；首图/poster ≤300KB；字体 ≤60KB（子集 woff2）。
- Louis Canvas、音频、全部视频、treatment 的重资源**懒加载**（进入视口前 1 屏预取）。
- 视频：`muted playsinline loop preload="none"`，IntersectionObserver 进入视口才 `play()`、离开 `pause()`；同时播放的视频全站 ≤2 个。
- Core Web Vitals（4G 移动端实测）：LCP <2.5s、CLS <0.1、INP <200ms。用 Lighthouse/WebPageTest 实测，不凭估算宣称。
- 页面隐藏时暂停所有 rAF、视频、analyser。

### 10.4 移动端与低端设备
- `@media (hover: none)`：无悬停短句、无自定义光标；Louis 15–30fps 或静态。
- `saveData` / `deviceMemory ≤4` / 低电量：所有 treatment 用 `StaticFallback` 或 `mobileFallback`，视频只显示 poster。
- 每个 treatment 必须在 375×667 视口下可用、文字不溢出。

### 10.5 无障碍
- 字幕始终可用；全部控件键盘可达、焦点可见；对比度 ≥ WCAG AA；`lang` 随语言切换；AI 标签可被读屏读；闪烁 ≤3Hz；reduced-motion 全站兜底（§6.5）；装饰性 Canvas `aria-hidden`；每章 StaticFallback 的语义 HTML 进入预渲染（SEO 与读屏都读它）。

### 10.6 双部署
- **ailiu.online（Vercel）**：主站。注意诊断结果：域名 DNS 当前指向火山引擎 `14.103.220.193`（备案 IP），不是 Vercel → **用户需在火山 DNS 控制台把 apex A 改为 Vercel 给出的值、`www` CNAME 改为 `cname.vercel-dns.com`**（用户操作，你不能改 DNS）。临时可用 `ailiuonline.vercel.app`。
- **mongocyber.github.io**：大陆备用，发布同一构建（`VITE_TARGET=ghpages`：去掉 `@vercel/analytics`、无 `/_vercel` 依赖、所有资源同源、无 Google Fonts/外部 CDN）。
  - 旧站内容是唯一素材源：**覆盖前先打 tag/建 `legacy` 分支归档**，不删仓库（需用户批准发布方式：GitHub Actions 部署 or `gh-pages` 分支）。
  - canonical：两边都指向 ailiu.online 对应页（默认）；github.io 是否 `noindex` = OPEN。
  - 安全头：GitHub Pages 不支持自定义响应头 → 用 `<meta http-equiv="Content-Security-Policy">` 尽量对齐。

---

## 11. 分阶段与验收（Phases & acceptance）

> **所有阶段的总闸门：用户明确说「第一阶段开工 / phase-one go-ahead」之前，只允许 P0。** 之后每个阶段开始前也要用户点头；每个阶段在分支 `redesign/v2-<phase>` 上做，推 Vercel Preview（Preview 需 Vercel 登录或用户开分享链接），用户验收后才合并 main。不得 force-push、不得跳过仓库规则的 Issue/review 门禁。

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| **P0 只读评审**（现在允许） | 只读评审本文 + 仓库；回报不可行点、规则冲突、对 OPEN 的建议；估算各阶段工时 | 一份中文回报；零文件改动 |
| **P1 骨架**（需 phase-one go-ahead） | 分支；去 ICP；CSP；manifest + schema + `validate` 脚本；路由/sitemap/导航由 manifest 生成；`SectionShell` + 七章 `StaticFallback`（真实截图 + 固定文字槽）；双语；图片管线（webp/avif + srcset）；2 张 style frame（方向 D / 深色变体）供选 | `npm run build && npm run validate` 通过；七章在 375px 与 1440px 下可读；Lighthouse 移动端 Performance ≥90、A11y ≥95；首屏 ≤500KB；无 ICP 字样；无新依赖（或已获批） |
| **P2 动效系统 + 七个 treatment** | tokens、preset 与 choreography 注册表；七个 treatment 按 §7 实现；导航高亮；视口播放循环片；reduced-motion | §6.6 清单全过；每章有桌面与移动两段录屏给用户看；Aviso 的 2.5D 解读已获用户确认；小姨家 treatment 已由用户选定 |
| **P3 Louis + 声音** | Avatar（形态由你按视觉决定，先纯轮廓）；振幅驱动覆盖层；旁白队列（§4.5）；自动播放尝试 + 兜底浮标 + 常驻开关 + 字幕；鼠标短句；`NARRATION_SCOPE` 开关；**占位音频** | 在 Chrome/Safari/Firefox（桌面）+ iOS Safari + Android Chrome 上：被拦时浮标出现、首次点击即出声、放行时不出现浮标；无叠播；快速滚动无积压；关开关立即静音；字幕全覆盖 |
| **P3b 素材生成**（需：key + 充值 + 每次 estimate 获批） | Louis 测试视频片 1 条 → 用户判定；TTS 批量（文案已批）；野生路易斯设定图 | 花费 ≤ 预算表；`LEDGER.md` 完整；产出已入库；媒体总量 <15MB |
| **P4 打磨与上线** | 真机走查、无障碍、SEO（hreflang/OG/JSON-LD/llms.txt/sitemap 更新）、缺译清零、github.io 备用构建、上线清单 | 校验零警告；两个站点都可访问；用户书面同意后合并 main 并发布；Vercel Instant Rollback 路径已演练 |

---

## 12. 开放项（Open items，需用户决定或提供）

1. **OPEN-1 Louis 旁白范围**：最新指令「首页每章随滚动讲 1–2 句」与旧说法「离开（Hero/首页）即停」如何调和？默认：首页全部章节都讲，离开首页路由才停；保留 `NARRATION_SCOPE` 开关。请确认。
2. **OPEN-2 肖像**：Louis 是虚构人设，还是基于用户本人的脸？（默认虚构；用本人脸需用户明确书面同意）
3. **OPEN-3 Louis 台词作者**：建议 Claude Code 起草 zh/en（开场、七章、鼠标短句），用户审批后才生成音频。
4. **OPEN-4 Aviso「3D 感」解读**：确认 = CSS 3D transforms / 2.5D 分层 DOM，不是 WebGL/3D 建模。
5. **OPEN-5 小姨家性质**：是什么项目（为谁、做了什么、你的角色）？选 treatment A/B/C；提供源文件（PSD/AI/Figma）或更高清图。
6. **用户签字（sign-offs）**：视觉基线（方向 D vs 深色变体）；[R3] 改为允许 CSS scroll-driven 或接受「渐进增强」解读；自托管字体与任何新依赖；蒸汽站引入 `steam-hydronic-formulas` 做实时示例（或预计算表）；每阶段 Preview 验收与合并。
7. **缺失素材**：随口英语真实小程序截图（否则用原型截图）；小姨家源文件与背景；桃桃屋短片原片/授权截取 + **YouTube 候选 `@TaoTaoHouse` 是否是你的** + **抖音主页链接**；野生路易斯是否链接已有社媒账号（建议先不链）。
8. **登录/权限**：Vercel 团队 `jonyliu-projects`（当前连接器看不到 ailiu.online 项目）；**火山 DNS 改指向 Vercel**（用户操作）；GitHub Pages 发布方式；Preview 分享链接。
9. **Higgsfield**：创建 API key + 充值（余额 $0）；建议关 Auto top-up；首轮 $10 / 视频层 $3 上限确认。
10. **Louis 声音账号**：Louis 声音在哪个 Higgsfield 账号/工作区、叫什么名字。
11. **phase-one go-ahead**：用户明确开工指令（P1）。
12. **页脚 AI 标签措辞**：默认见 §7.10，请确认或改写。
13. 其他沿用项：github.io 是否 `noindex`；邮箱是否继续明文；旧站「Clients 评价」能否公开；4 张硬件概念卡是否算作品。

---

## 13. 禁止清单（Do-not list）

1. **不要**在用户 phase-one go-ahead 之前构建、改仓库、提交、部署、付费、调用 Higgsfield 生成（estimate 也要在用户要求后才调）。
2. **不要**用 WebGL、Three.js、GLB、`generate_3d`、Rive、Spline 或任何实时 3D；「3D 感」只用 CSS transforms。
3. **不要**请求麦克风、做语音输入/指令/对话、加后端或 LLM 调用；`microphone=()` 不改。
4. **不要**做入口屏或点击门；兜底提示只在自动播放被拦时出现。
5. **不要**用 hack 绕过浏览器自动播放策略（如伪造事件、隐藏 iframe 技巧）。
6. **不要**让任何单个项目改变全站底色、字体、导航或全局动效；不要在章节内写词汇表外的缓动/时长/keyframes。
7. **不要**把七章做成同一张卡片模板（已被推翻）；也**不要**让某一章明显比其他章更长/更大（同权）。
8. **不要**编造数字、状态、链接或功能；不放流量/收益/用户数；不使用未经确认的频道链接上线。
9. **不要**用 AI 图冒充项目截图；不要使用真人脸（含用户本人）除非用户书面同意。
10. **不要**复用旧 7.4MB 背景视频；不要把旧站原尺寸 PNG 入库。
11. **不要**保留 ICP 号；不要出现内部产品名（如 OBS）与内部数字。
12. **不要**新增依赖、自托管新字体、修改 [R3] 或其他仓库规则而不经批准；不要 force-push、`--no-verify`、改写已推送历史。
13. **不要**合并 main 或改 DNS/域名；DNS 由用户操作。
14. **不要**使用 Higgsfield 建站/部署；不要生成新声音；不要超过 $10 / 视频层 $3；每次生成前不 estimate 不得生成；产出不得留在 Higgsfield 过期。
15. **不要**依赖外部 CDN、Google Fonts 或第三方域名（大陆备用站必须同源可用）。
16. **不要**用 Fable 或其他模型代替 Opus 执行本任务。
