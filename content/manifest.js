/* Project manifest — single source for nav, fixed text slots, narration queue.
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers.
   r7: each project carries a `draft` block (copy, status, links from CONTENT-DRAFT.md, unconfirmed);
   the page renders `draft` over the base fields and tags it 草稿 / Draft.
   r8: order is Aviso, PrintPlay, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (07); copy tightened; `work` = ailiu's professional design work.
   r10: Design Work is chapter 03 (key "work", order 30): Aviso, PrintPlay, Design Work, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (08).
   Its slots come from the project entry; the capabilities / cases / background below stay in `work`.
   Link states: ok = real link · confirm = known but awaiting the owner's OK (not linked) · tbd = does not exist yet · text = shown as text. */
window.MANIFEST = {
  version: 1,
  narrationScope: "home-all-sections",
  persona: {
    draft: true,
    // r7 decision: Louis = ailiu's digital double AND the site's virtual character. Not in conflict.
    line: {
      zh: "Louis 是 ailiu 的数字分身，也是这个站里的虚拟角色。这里的作品都出自 ailiu；第 07 章「野生路易斯」是 Louis 自己做的，就是这个网站。Louis 的形象和声音由 AI 生成。",
      en: "Louis is ailiu's digital double and the character who lives on this site. Everything here is ailiu's work; chapter 07, Wild Louis, is Louis's own: this website. Louis's image and voice are AI-generated."
    }
  },
  contact: [
    // r7 decision: only these two. Real links.
    { id: "email", label: { zh: "邮箱", en: "Email" }, text: "louisliu@mail.grokbot.com", href: "mailto:louisliu@mail.grokbot.com" },
    { id: "x", label: { zh: "X", en: "X" }, text: "@liuliu8765", href: "https://x.com/liuliu8765" }
  ],
  hero: {
    narration: [
      {
        id: "hero-1",
        subtitle: {
          zh: "你好，我是 Louis，ailiu 的数字分身。往下滚，我带你把这八章看一遍。",
          en: "Hi, I'm Louis, ailiu's digital double. Scroll down and I'll walk you through all eight chapters."
        }
      }
    ]
  },
  /* r8: ailiu's professional design work, condensed from the old site (mongocyber.github.io).
     Generalised: no employer / cloud product / client names, no internal figures, no testimonials,
     no years or "projects shipped" counts. Hardware cases on the old site had titles only → omitted. */
  work: {
    /* r11: condensed for the one-screen console — capabilities are title + tags, each case is a summary plus
       one line each for problem / key move / outcome. The longer r8 texts are in git history (r10). */
    capabilities: [
      { id: "ai", title: { zh: "AI 产品与 Agent 体验", en: "AI product & agent experience" },
        tags: { zh: ["Agent 工作流", "工具调用", "可控执行"], en: ["Agent workflow", "Tool-calling UX", "Controllable runs"] } },
      { id: "platform", title: { zh: "复杂平台与工作流", en: "Complex platforms & workflows" },
        tags: { zh: ["角色与权限", "任务流", "状态体系"], en: ["Roles & permissions", "Task flows", "State systems"] } },
      { id: "data", title: { zh: "数据平台与分析产品", en: "Data platforms & analytics" },
        tags: { zh: ["数据资产", "数据标注", "自助分析"], en: ["Data assets", "Annotation", "Self-service BI"] } },
      { id: "ia", title: { zh: "信息架构与系统抽象", en: "Information architecture" },
        tags: { zh: ["对象建模", "系统思考"], en: ["Object modeling", "Systems thinking"] } }
    ],
    cases: [
      { id: "agent", title: "Agent Builder", domain: { zh: "AI Agent · 编排", en: "AI agent · orchestration" },
        summary: { zh: "某云平台内部的 Agent 编排平台：模型、工具、知识源和任务节点，在一张画布上搭建、调试、复用。",
                   en: "An internal agent orchestration platform at a cloud provider: models, tools, knowledge and task nodes, built, debugged and reused on one canvas." },
        problem: { zh: "对象多、路径散，运行过程说不清。", en: "Too many objects, scattered paths, runs nobody could explain." },
        move: { zh: "画布即工作区；节点状态贯穿配置与运行，出错直接跳回对应配置。", en: "The canvas is the workspace; node states run from setup to execution, and an error jumps back to its settings." },
        result: { zh: "搭 Agent 收拢成一条连续路径，模板和节点跨团队复用。", en: "Building an agent became one continuous path; templates and nodes are shared across teams." } },
      { id: "annotation", title: "Data Annotation Service", domain: { zh: "数据生产 · 标注", en: "Data production · annotation" },
        summary: { zh: "AI 数据生产平台：把散在文档、表格和聊天里的标注协作，变成能配置、分发、追踪、验收的系统。",
                   en: "A platform for producing AI training data: annotation that lived in docs, sheets and chat became a system you configure, assign, track and sign off." },
        problem: { zh: "规则分散，分发靠追问，结果没有验收。", en: "Scattered rules, hand-chased assignments, no formal review." },
        move: { zh: "以「标注任务」为核心对象：模板、数据集、进度和验收都写回同一个任务。", en: "The annotation task is the core object: template, dataset, progress and review all write back to it." },
        result: { zh: "状态清楚、结果可追踪，模板和工作台复用到更多场景。", en: "Clear states and traceable results; templates and workspaces carry over." } },
      { id: "platform", title: "Data Platform", domain: { zh: "数据平台 · 管理", en: "Data platform · management" },
        summary: { zh: "数据资产、市场、服务、权限和管理放进一套体验：找到、看懂、申请、用上数据。",
                   en: "Assets, market, services, permissions and admin in one experience: find data, understand it, request it, use it." },
        problem: { zh: "入口分散，权限进度不透明，管理和使用是两张皮。", en: "Scattered entry points, opaque permissions, admin cut off from use." },
        move: { zh: "先定义对象再定义页面；每个状态都回答「现在怎样、为什么、下一步」。", en: "Objects before pages; every state answers what, why and what next." },
        result: { zh: "从发现到使用连成一条路，数据卡片和权限状态沉淀为通用模式。", en: "Discovery to use became one path; data cards and permission states became shared patterns." } },
      { id: "analytics", title: "Self-Service Analytics", domain: { zh: "数据分析 · 自助", en: "Analytics · self-service" },
        summary: { zh: "业务同事自己选数据、配字段、出图表、搭看板并发布，不用等研发。",
                   en: "Business teams pick data, set fields, make charts and publish dashboards on their own." },
        problem: { zh: "字段看不懂，指标和筛选关系绕，从出图到发布断成几截。", en: "Opaque fields, tangled metrics and filters, a broken path from chart to dashboard." },
        move: { zh: "字段说明前置，常见任务走默认路径，实时预览把错误定位到具体配置。", en: "Field notes up front, a default path for common tasks, live preview with errors pinned to the setting." },
        result: { zh: "做报表的门槛降下来，配置、筛选和发布沉淀为通用模式。", en: "Reports got easier to make; setup, filters and publishing became shared patterns." } },
      { id: "support", title: "Support & Service Upgrade", domain: { zh: "客户支持 · AI 辅助", en: "Support · AI-assisted" },
        summary: { zh: "重做控制台的新建工单：用户只描述问题，AI 自动分类、先给解答，解决不了再转人工。",
                   en: "A new “new ticket” flow: describe the problem, AI fills in the categories and answers first, and a person steps in only when needed." },
        problem: { zh: "一上来就要在多层分类里选，页面助手不知道上下文。", en: "Layers of categories up front, and an assistant with no context." },
        move: { zh: "问题描述是唯一主输入；分类由 AI 填，侧栏随输入推荐工具和文档。", en: "The description is the one main input; AI fills the categories and the side panel suggests tools and docs." },
        result: { zh: "录入表变成分流入口，转人工的工单上下文更完整。", en: "A data-entry form became a triage point; handoffs arrive with full context." } }
    ],
    method: { zh: ["对象", "角色", "流程", "状态", "规则", "页面"], en: ["Objects", "Roles", "Flows", "States", "Rules", "Pages"] },
    methodNote: { zh: "先理清结构，再画页面", en: "Structure first, pages second" }
  },
  projects: [
    {
      key: "aviso", order: 10, type: "product", status: "in-development",
      title: { zh: "Aviso", en: "Aviso" },
      tagline: { zh: "在网页里划词，直接问 AI", en: "Select text on any page, ask AI right there" },
      blurb: {
        zh: "一个 Chrome 扩展：在任意网页上划选文字，原地提问，不用离开当前页面。",
        en: "A Chrome extension: highlight a passage on any page and ask about it without leaving the tab."
      },
      statusLabel: { zh: "开发中", en: "In development" },
      treatment: { id: "aviso-browser-depth", choreographyId: "aviso.browser-depth.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 200,
      accent: "#8FB573",
      narration: [{ id: "aviso-1", subtitle: {
        zh: "Aviso 住在浏览器里：划一段字，答案就出现在旁边。",
        en: "Aviso lives in your browser: highlight a passage and the answer shows up right beside it." } }],
      links: [{ label: { zh: "打开 Aviso", en: "Open Aviso" }, href: "https://aviso-nine.vercel.app" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "Chrome 扩展。在任意网页划词或右键，用你自己的模型 API Key 让 AI 解释、翻译、润色、总结，也能说明图片。",
          en: "A Chrome extension. Select text or right-click on any page, and AI explains, translates, polishes or summarizes it, or describes an image, using your own model API key."
        },
        statusLabel: { zh: "开发中 · 精简版待发布", en: "In development · lite build coming" },
        statusClass: "is-dev",
        note: { zh: "安装：下载 zip，解压，在 Chrome 里选「加载已解压的扩展程序」。", en: "To install: download the zip, unzip it, then choose “Load unpacked” in Chrome." },
        links: [
          { label: { zh: "下载 zip", en: "Download zip" }, href: null, state: "tbd" },
          { label: { zh: "官网", en: "Website" }, href: null, state: "confirm" }
        ]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "flat-window"
    },
    {
      key: "printplay", order: 20, type: "product", status: "live",
      title: { zh: "PrintPlay", en: "PrintPlay" },
      tagline: { zh: "能打印出来玩的英文词卡", en: "English word cards you print and play" },
      blurb: {
        zh: "选一个主题，打印出来，在桌上玩——给小朋友的词卡和练习页。",
        en: "Pick a theme, print it, play at the table: cards and worksheets for small kids."
      },
      statusLabel: { zh: "上线", en: "LIVE" },
      treatment: { id: "printplay-paper-stack", choreographyId: "printplay.paper-stack.v1" },
      transition: { enter: "mask-wipe", exit: "fade-through" },
      stageHeightVh: 180,
      accent: "#E0573B",
      narration: [{ id: "printplay-1", subtitle: {
        zh: "PrintPlay 的终点是纸：这里的一切，都是为了从打印机里出来。",
        en: "PrintPlay ends on paper. Everything here is made to come out of a printer." } }],
      links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "可打印的英文词卡，用在课堂比划猜词和家里的游戏。选主题和年龄段，预览一下，直接打印或下载 PDF，不用注册。",
          en: "Printable English word cards for classroom charades and family guessing games. Pick a theme and an age range, preview, then print or download a PDF. No sign-up."
        },
        statusLabel: { zh: "已上线", en: "Live" },
        links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia", state: "ok" }]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "vertical-stack"
    },
    {
      // r10: chapter 03. Not a product: ailiu's professional design work. Body = MANIFEST.work (capabilities, cases, background).
      key: "work", order: 30, type: "portfolio", status: "professional",
      title: { zh: "设计作品", en: "Design Work" },
      tagline: { zh: "把复杂系统做得好懂、好用", en: "Making complex systems easy to read and use" },
      blurb: {
        zh: "ailiu 的本行：B 端与 AI 产品体验设计。五个案例来自某云平台的内部产品，名称与数据已隐去。",
        en: "ailiu’s trade: B2B and AI product design. Five cases from a cloud platform’s internal products, names and figures left out."
      },
      statusLabel: { zh: "本行 · 案例已脱敏", en: "Day job · anonymized" },
      treatment: { id: "work-case-console", choreographyId: "work.case-console.v1" },
      transition: { enter: "reveal-up", exit: "fade-through" },
      stageHeightVh: 230,
      accent: "#96E8FF",
      narration: [{ id: "work-1", subtitle: {
        zh: "第 03 章换个方向：ailiu 的本行，B 端和 AI 产品设计。",
        en: "Chapter 03 shifts gear: ailiu’s day job, B2B and AI product design." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        statusClass: "is-work",
        links: []
      },
      aiGenerated: false, disclosure: null, mobileFallback: "static-stack"
    },
    {
      key: "steam", order: 40, type: "product", status: "live",
      title: { zh: "蒸汽站", en: "Steam Vent Calc" },
      tagline: { zh: "蒸汽采暖计算器，每条公式都有出处", en: "Steam-heat calculators, every formula cited" },
      blurb: {
        zh: "单管蒸汽系统的公式库与计算器，每个数都能追到出处。",
        en: "Formulas and calculators for one-pipe steam heat, every number traced to its source."
      },
      statusLabel: { zh: "上线", en: "LIVE" },
      treatment: { id: "steam-gauge-pipes", choreographyId: "steam.gauge-pipes.v1" },
      transition: { enter: "reveal-up", exit: "fade-through" },
      stageHeightVh: 180,
      accent: "#F2A93B",
      narration: [{ id: "steam-1", subtitle: {
        zh: "在蒸汽站，公式没有出处就不上线。",
        en: "On Steam Vent Calc, no formula goes live without a source." } }],
      links: [{ label: { zh: "steamventcalc.com", en: "steamventcalc.com" }, href: "https://steamventcalc.com" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "单管蒸汽采暖的在线计算器：排气阀选型、散热器排气、室外温度补偿曲线、注入混水，公式都注明公开来源。结果只是估算，不能代替专业设计。",
          en: "Online calculators for one-pipe steam heat: main and radiator vent sizing, outdoor reset curves, injection mixing, each formula citing a public source. Results are estimates, not a substitute for professional design."
        },
        statusLabel: { zh: "已上线 · 限量维护", en: "Live · light upkeep" },
        links: [
          { label: { zh: "steamventcalc.com", en: "steamventcalc.com" }, href: "https://steamventcalc.com", state: "ok" },
          { label: { zh: "公式库（MIT）", en: "Formula library (MIT)" }, href: null, state: "confirm" }
        ]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "static-diagram"
    },
    {
      key: "suikou", order: 50, type: "product", status: "in-development",
      title: { zh: "随口英语", en: "Suikou English" },
      tagline: { zh: "随口就能说的亲子英语", en: "Family English you can say on the spot" },
      blurb: {
        zh: "微信小程序：一张张生活场景卡，大人和孩子随口说出来。",
        en: "A WeChat mini program: everyday scene cards that parents and kids say out loud together."
      },
      statusLabel: { zh: "开发中", en: "In development" },
      treatment: { id: "suikou-phone-flow", choreographyId: "suikou.phone-flow.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 180,
      accent: "#7FB6F2",
      narration: [{ id: "suikou-1", subtitle: {
        zh: "随口英语还在做，你看到的是原型。",
        en: "Suikou English is still in the works. This is the prototype." } }],
      links: [], qr: null,
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "微信小程序。把刷牙、吃饭、出门这些日常场景做成卡片，家长随口就能带孩子说英语。首版面向 3–5 岁。",
          en: "A WeChat mini program that turns everyday moments, like brushing teeth or heading out, into cards a parent can use to slip into English. The first version is for ages 3–5."
        },
        statusLabel: { zh: "开发中", en: "In development" },
        statusClass: "is-dev",
        links: [{ label: { zh: "小程序码", en: "Mini-program QR" }, href: null, state: "tbd" }]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "swipe-screens"
    },
    {
      key: "taotao", order: 60, type: "channel", status: "live",
      title: { zh: "桃桃屋", en: "TaoTao House" },
      tagline: { zh: "中英双语原创儿歌", en: "Original bilingual songs for little kids" },
      blurb: {
        zh: "在 YouTube 与抖音更新的儿歌和短视频。",
        en: "Songs and short videos on YouTube and Douyin."
      },
      statusLabel: { zh: "上线", en: "LIVE" },
      treatment: { id: "taotao-video-wall", choreographyId: "taotao.video-wall.v1" },
      transition: { enter: "stack-fan", exit: "fade-through" },
      stageHeightVh: 140,
      accent: "#FF8FA3",
      narration: [{ id: "taotao-1", subtitle: {
        zh: "桃桃屋会唱歌。不过现在，声音得请你先自己想象。",
        en: "TaoTao House sings. For now, you'll have to imagine the sound." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "给 2–4 岁孩子的中英双语原创儿歌频道。刷牙、洗手、吃饭、睡觉，都编成能跟着唱的歌，每首教三个英文词。",
          en: "A Chinese–English song channel for ages 2–4. Brushing teeth, washing hands, mealtime and bedtime each become a song to sing along with, and each song teaches three English words."
        },
        statusLabel: { zh: "运营中", en: "Running" },
        links: [
          { label: { zh: "YouTube", en: "YouTube" }, href: "https://www.youtube.com/@TaoTaoHouse", state: "ok" },
          { label: { zh: "抖音号 TaoTaoHouse2026", en: "Douyin ID TaoTaoHouse2026" }, href: null, state: "text" },
          { label: { zh: "B 站", en: "Bilibili" }, href: null, state: "confirm" }
        ]
      },
      aiGenerated: true,
      disclosure: { zh: "内容为 AI 生成", en: "AI-generated content" },
      mobileFallback: "grid-2x2"
    },
    {
      key: "wild-louis", order: 70, type: "virtual", status: "self",
      title: { zh: "野生路易斯", en: "Wild Louis" },
      tagline: { zh: "这个站，是我做的", en: "I made this site" },
      blurb: {
        zh: "我是 ailiu 的数字分身，也是站里的虚拟角色。这一章是本站的源码层，也是我的制作日志。",
        en: "I'm ailiu's digital double and this site's virtual character. This chapter is the site's source layer, and my build log."
      },
      statusLabel: { zh: "AI 生成", en: "AI-generated" },
      treatment: { id: "wild-louis-meta-layer", choreographyId: "wildlouis.meta-layer.v1" },
      transition: { enter: "mask-wipe", exit: "fade-through" },
      stageHeightVh: 160,
      accent: "#B9A6FF",
      narration: [{ id: "wild-louis-1", subtitle: {
        zh: "这是我，也是这个站的骨架。我每做一件新东西，日志就多一行。",
        en: "This is me, and the scaffolding of this site. Every new thing I make adds a line to the log." } }],
      log: [
        { date: "2026-10-15", zh: "写下这份说明书", en: "Wrote the build spec", model: null, costUsd: 0 },
        { date: "2026-10-17", zh: "做出第二版静态样片（无 AI 素材）", en: "Built preview v2, a static sample with no AI assets", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "写清 Louis 的身份，接入内容草稿和联系方式", en: "Spelled out who Louis is; wired in draft copy and contacts", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "统一左对齐，调整章节顺序，加入「设计作品」", en: "Aligned every left edge, reordered chapters, added Design Work", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "「设计作品」成为第 03 章，全站改为八章", en: "Made Design Work chapter 03; the site now has eight chapters", model: null, costUsd: 0 }
      ],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        tagline: { zh: "这个站，就是我的作品", en: "This site is my own work" },
        blurb: {
          zh: "野生路易斯就是 ailiu.online 这个网站，是 Louis 自己的作品，会慢慢长出新内容。",
          en: "Wild Louis is this website: Louis’s own work, growing a little at a time."
        },
        statusLabel: { zh: "进行中 · 持续生长", en: "Ongoing · still growing" },
        statusClass: "is-ai",
        note: {
          zh: "Louis 是 ailiu 的数字分身，也是站里的虚拟角色，两者并不矛盾。其余七章都出自 ailiu，这一章是 Louis 亲手做的。",
          en: "Louis is ailiu’s digital double and this site’s character; the two don’t clash. The other seven chapters are ailiu’s. This one, Louis made."
        },
        socials: [
          { id: "channels", label: { zh: "视频号", en: "WeChat Channels" }, glyph: "视" },
          { id: "douyin", label: { zh: "抖音", en: "Douyin" }, glyph: "抖" },
          { id: "xhs", label: { zh: "小红书", en: "Xiaohongshu" }, glyph: "书" },
          { id: "kuaishou", label: { zh: "快手", en: "Kuaishou" }, glyph: "快" },
          { id: "mp", label: { zh: "公众号", en: "WeChat OA" }, glyph: "公" }
        ],
        links: []
      },
      aiGenerated: true,
      disclosure: { zh: "本章内容全部由 AI 生成。", en: "Everything in this section is AI-generated." },
      mobileFallback: "static-source-snippet"
    },
    {
      key: "xiaoyi", order: 80, type: "design", status: "pending",
      title: { zh: "小姨家", en: "Xiaoyi's Home" },
      tagline: { zh: "一个餐饮品牌，从名字到店里的指示牌", en: "A restaurant brand, from its name to its signage" },
      blurb: {
        zh: "一套视觉设计：标志、主视觉、包装、菜单。项目背景与源文件待补充。",
        en: "A visual identity: mark, key visual, packaging, menu. Background and source files to come."
      },
      statusLabel: { zh: "资料待补", en: "Details pending" },
      treatment: { id: "xiaoyi-brand-book", choreographyId: "xiaoyi.brand-book.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 160,
      accent: "#C98A5B",
      narration: [{ id: "xiaoyi-1", subtitle: {
        zh: "最后一章，小姨家：一本还没印完的品牌册，我还在收集它的每一页。",
        en: "Last chapter: Aunt’s Home, a brand book still at the printer. I’m still collecting its pages." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        title: { zh: "小姨家", en: "Aunt’s Home" },
        blurb: {
          zh: "从零做起的餐饮品牌，围绕「像回家吃饭」的感觉，做了一整套：命名、标志、色彩与字体、菜单、包装和空间导视。",
          en: "A restaurant brand built from scratch around the feeling of eating at home: naming, bilingual marks, color and type, menus, packaging and wayfinding, as one system."
        },
        statusLabel: { zh: "已结束 · 2024", en: "Ended · 2024" },
        statusClass: "is-pending",
        note: { zh: "角色：品牌 / 视觉设计。更多说明待补。", en: "Role: brand / visual design. More to come." },
        links: []
      },
      aiGenerated: false, disclosure: null, mobileFallback: "single-pages"
    }
  ]
};
