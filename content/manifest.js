/* Project manifest — single source for nav, fixed text slots, narration queue.
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers.
   r7: each project carries a `draft` block (copy, status, links from CONTENT-DRAFT.md, unconfirmed);
   the page renders `draft` over the base fields and tags it 草稿 / Draft.
   r8: order is Aviso, PrintPlay, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (07); copy tightened; `work` = ailiu's professional design work.
   r10: Design Work is chapter 03 (key "work", order 30): Aviso, PrintPlay, Design Work, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (08).
   r12: all copy is ailiu speaking in the first person; no chapter counts, one self-introduction (the hero title).
   Its slots come from the project entry; the capabilities / cases / background below stay in `work`.
   Link states: ok = real link · confirm = known but awaiting the owner's OK (not linked) · tbd = does not exist yet · text = shown as text. */
window.MANIFEST = {
  version: 1,
  narrationScope: "home-all-sections",
  // r12: page title + meta description (index.html carries the English pair for crawlers; app.js swaps on language)
  meta: {
    zh: { title: "ailiu.online · 做软件和 AI 工具的体验设计", description: "软件 UX 体验设计，眼下主要做 AI 工具：我工作里的设计案例，和业余做的东西。" },
    en: { title: "ailiu.online · UX designer for software and AI tools", description: "UX design for software, these days mostly AI tools: my design work, and the things I build on the side." }
  },
  persona: {
    draft: true,
    // r12: every line on the site is ailiu speaking (first person); Louis is just the face on the page.
    // The one self-introduction is the hero title; nothing else re-introduces.
    line: {
      zh: "下面是我做过的东西：工作里的设计案例，也有业余做的小产品、儿歌频道和品牌。页面上的 Louis 是我的形象，由 AI 生成。",
      en: "Below is what I’ve made: design work from my day job, and things I build on the side, from small products to a kids’ song channel and a brand. Louis, the face on this page, is me, drawn by AI."
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
          zh: "往下滚，我一件件讲：做了什么，结果怎样。",
          en: "Scroll down and I’ll go through them one by one: what I made, and how it went."
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
      tagline: { zh: "在任意网页划词，原地问 AI", en: "Select text on any page, ask AI in place" },
      blurb: {
        zh: "Chrome 扩展：在任意网页划选文字，原地提问，不用离开当前页面。",
        en: "A Chrome extension: highlight text on any page and ask about it without leaving the tab."
      },
      statusLabel: { zh: "开发中", en: "In development" },
      treatment: { id: "aviso-browser-depth", choreographyId: "aviso.browser-depth.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 200,
      accent: "#8FB573",
      narration: [{ id: "aviso-1", subtitle: {
        zh: "Aviso 是我做的浏览器扩展：划一段字，答案就出现在旁边。",
        en: "Aviso is my browser extension: highlight a passage and the answer appears beside it." } }],
      links: [{ label: { zh: "打开 Aviso", en: "Open Aviso" }, href: "https://aviso-nine.vercel.app" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "我做的 Chrome 扩展。划词或右键，AI 就在原页面里解释、翻译、润色、总结，也能说明图片；用的是你自己的模型 API Key。",
          en: "A Chrome extension I built. Select text or right-click, and AI explains, translates, polishes or summarizes it right on the page, or describes an image, using your own model API key."
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
      tagline: { zh: "打印出来就能玩的英文词卡", en: "English word cards you print and play" },
      blurb: {
        zh: "选个主题，打印出来，在桌上玩：给小朋友的英文词卡和练习页。",
        en: "Pick a theme, print it, play at the table: English cards and worksheets for small kids."
      },
      statusLabel: { zh: "上线", en: "LIVE" },
      treatment: { id: "printplay-paper-stack", choreographyId: "printplay.paper-stack.v1" },
      transition: { enter: "mask-wipe", exit: "fade-through" },
      stageHeightVh: 180,
      accent: "#E0573B",
      narration: [{ id: "printplay-1", subtitle: {
        zh: "PrintPlay 的终点是纸：每一页都是为了从打印机里出来。",
        en: "PrintPlay ends on paper: every page is made to come out of a printer." } }],
      links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "我做的可打印英文词卡网站，用在课堂比划猜词和家庭游戏。选主题和年龄段，预览后直接打印或下载 PDF，不用注册。",
          en: "My site for printable English word cards, used for classroom charades and family guessing games. Pick a theme and an age range, preview, then print or download a PDF. No sign-up."
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
        zh: "我的本职：B 端与 AI 产品的体验设计。案例来自某云平台的内部产品，名称和数据已隐去。",
        en: "My day job: UX for B2B and AI products. The cases come from a cloud platform’s internal tools, with names and figures left out."
      },
      statusLabel: { zh: "本行 · 案例已脱敏", en: "Day job · anonymized" },
      treatment: { id: "work-case-console", choreographyId: "work.case-console.v1" },
      transition: { enter: "reveal-up", exit: "fade-through" },
      stageHeightVh: 230,
      accent: "#96E8FF",
      narration: [{ id: "work-1", subtitle: {
        zh: "这一章是我的本职：B 端和 AI 产品设计，每个案例讲问题、做法和结果。",
        en: "My day job: B2B and AI product design. Each case: the problem, the move, the result." } }],
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
          zh: "我做的单管蒸汽采暖在线计算器：排气阀选型、散热器排气、室外温度补偿曲线、注入混水。每条公式都注明公开来源；结果只是估算，不能代替专业设计。",
          en: "My online calculators for one-pipe steam heat: main and radiator vent sizing, outdoor reset curves, injection mixing. Every formula cites a public source; results are estimates, not a substitute for professional design."
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
          zh: "我在做的微信小程序。把刷牙、吃饭、出门这些日常场景做成卡片，家长随口就能带孩子说英语。首版面向 3–5 岁，还没上线。",
          en: "A WeChat mini program I’m building. Everyday moments like brushing teeth or heading out become cards a parent can use to slip into English. The first version is for ages 3–5 and isn’t out yet."
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
      tagline: { zh: "给小朋友的中英双语原创儿歌", en: "Original bilingual songs for little kids" },
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
          zh: "我做的中英双语儿歌频道，给 2–4 岁的孩子。刷牙、洗手、吃饭、睡觉都编成能跟着唱的歌，每首教三个英文词。在 YouTube 和抖音更新。",
          en: "My Chinese–English song channel for ages 2–4. Brushing teeth, washing hands, mealtime and bedtime each become a sing-along, and each song teaches three English words. On YouTube and Douyin."
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
        zh: "这一章是本站的源码层和制作日志。",
        en: "This chapter is the site’s source layer and build log."
      },
      statusLabel: { zh: "AI 生成", en: "AI-generated" },
      treatment: { id: "wild-louis-meta-layer", choreographyId: "wildlouis.meta-layer.v1" },
      transition: { enter: "mask-wipe", exit: "fade-through" },
      stageHeightVh: 160,
      accent: "#B9A6FF",
      narration: [{ id: "wild-louis-1", subtitle: {
        zh: "这是这个站的骨架。每做一件新东西，日志就多一行。",
        en: "This is the scaffolding of this site. Every new thing adds a line to the log." } }],
      log: [
        { date: "2026-10-15", zh: "写下这份说明书", en: "Wrote the build spec", model: null, costUsd: 0 },
        { date: "2026-10-17", zh: "做出第二版静态样片（无 AI 素材）", en: "Built preview v2, a static sample with no AI assets", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "写清 Louis 的身份，接入内容草稿和联系方式", en: "Spelled out who Louis is; wired in draft copy and contacts", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "统一左对齐，调整章节顺序，加入「设计作品」", en: "Aligned every left edge, reordered chapters, added Design Work", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "「设计作品」成为第 03 章", en: "Made Design Work chapter 03", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "修好手机上不显示的头像，重写首页文案", en: "Fixed the portrait on phones; rewrote the home page copy", model: null, costUsd: 0 }
      ],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        tagline: { zh: "这个网站本身，和它的制作日志", en: "This site itself, and how it gets built" },
        blurb: {
          zh: "野生路易斯就是 ailiu.online 这个网站。我和 AI 一起搭它，Louis 的形象和这一章都由 AI 生成；这里能看到它实时的源码和制作日志。",
          en: "Wild Louis is ailiu.online itself. I build it together with AI; Louis’s image and this chapter are AI-generated. Here you can read its live source and build log."
        },
        statusLabel: { zh: "进行中 · 持续生长", en: "Ongoing · still growing" },
        statusClass: "is-ai",
        note: {
          zh: "其他章节是我的设计和项目，这一章讲网站自己是怎么做出来的。",
          en: "The other chapters are my design work and projects; this one is about how the site itself gets made."
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
        zh: "最后一章，小姨家：一本还没印完的品牌册，我还在补它的每一页。",
        en: "Last chapter: Aunt’s Home, a brand book still at the printer. I’m still collecting its pages." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        title: { zh: "小姨家", en: "Aunt’s Home" },
        blurb: {
          zh: "一个从零做起的餐饮品牌，围绕「像回家吃饭」的感觉做成一整套：命名、标志、色彩与字体、菜单、包装和空间导视。",
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
