/* Project manifest — single source for nav, fixed text slots, narration queue.
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers.
   r7: each project carries a `draft` block (copy, status, links from CONTENT-DRAFT.md, unconfirmed);
   the page renders `draft` over the base fields and tags it 草稿 / Draft.
   Link states: ok = real link · confirm = known but awaiting the owner's OK (not linked) · tbd = does not exist yet · text = shown as text. */
window.MANIFEST = {
  version: 1,
  narrationScope: "home-all-sections",
  persona: {
    draft: true,
    // r7 decision: Louis = ailiu's digital double AND the site's virtual character. Not in conflict.
    line: {
      zh: "Louis 是 ailiu 的数字分身，也是这个站里的虚拟角色。这里每件作品都是 ailiu 的，也就是 Louis 的；第 07 章「野生路易斯」是 Louis 自己的作品，就是这个网站本身。Louis 的形象和声音由 AI 生成。",
      en: "Louis is ailiu's digital double and this site's virtual character, one figure in two roles. Every piece here is ailiu's work, which makes it Louis's; chapter 07, Wild Louis, is Louis's own work: this website. Louis's image and voice are AI-generated."
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
          zh: "你好，我是 Louis，ailiu 的数字分身，也是这个站的讲解员。往下滚，我带你看七个作品。",
          en: "Hi, I'm Louis, ailiu's digital double and the voice of this site. Scroll, and I'll walk you through seven projects."
        }
      }
    ]
  },
  projects: [
    {
      key: "aviso", order: 10, type: "product", status: "in-development",
      title: { zh: "Aviso", en: "Aviso" },
      tagline: { zh: "Chrome 划词 AI 助手", en: "Select any text, ask AI in place" },
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
        zh: "Aviso 住在浏览器里。划一段字，答案就出现在它旁边。",
        en: "Aviso lives in your browser. Highlight something, and the answer appears right beside it." } }],
      links: [{ label: { zh: "打开 Aviso", en: "Open Aviso" }, href: "https://aviso-nine.vercel.app" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "Aviso 是一个 Chrome 浏览器扩展：在任意网页里划词、右键，就能用自己的模型 API Key 调用 AI 做解释、翻译、润色、总结和图片说明。",
          en: "Aviso is a Chrome extension that brings AI into any web page: select text or right-click to explain, translate, polish, or summarize, using your own model API key."
        },
        statusLabel: { zh: "开发中 · 精简版待发布", en: "In development · lite build soon" },
        statusClass: "is-dev",
        note: { zh: "安装：下载 zip → 解压 → Chrome「加载已解压的扩展程序」。", en: "Install: download the zip, unzip it, then “Load unpacked” in Chrome." },
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
      tagline: { zh: "可打印的词卡与活动页", en: "Printable word cards and activity sheets" },
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
        zh: "PrintPlay 的终点是纸。这里的一切，都为从打印机里出来而做。",
        en: "PrintPlay ends on paper. Everything here is made to come out of a printer." } }],
      links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "PrintPlay Cards 提供可打印的英文词卡，用于课堂比划猜词和家庭游戏：选主题和年龄段，预览后直接打印或下载 PDF，无需注册。",
          en: "PrintPlay Cards makes printable English word cards for classroom charades and family guessing games. Pick a theme and age band, then print or download a PDF. No sign-up."
        },
        statusLabel: { zh: "已上线", en: "Live" },
        links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia", state: "ok" }]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "vertical-stack"
    },
    {
      key: "steam", order: 30, type: "product", status: "live",
      title: { zh: "蒸汽站", en: "Steam Vent Calc" },
      tagline: { zh: "带出处的蒸汽采暖公式与计算器", en: "Steam heating formulas, each with its source" },
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
        zh: "在蒸汽站，每个公式都要带着出处才能上线。",
        en: "On Steam Vent Calc, no formula ships without its citation." } }],
      links: [{ label: { zh: "steamventcalc.com", en: "steamventcalc.com" }, href: "https://steamventcalc.com" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "蒸汽站是面向单管蒸汽供暖的在线计算器：排气阀选型、散热器排气、室外温度补偿曲线和注入混水，公式均标注公开来源。仅为估算，不能替代专业设计。",
          en: "Steam Vent Calc offers online calculators for one-pipe steam heating: main and radiator vent sizing, outdoor reset curves, and injection mixing, with every formula cited. Estimates only, not a substitute for professional design."
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
      key: "suikou", order: 40, type: "product", status: "in-development",
      title: { zh: "随口英语", en: "Suikou English" },
      tagline: { zh: "亲子英语场景卡小程序", en: "Scene cards for everyday family English" },
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
        zh: "随口英语还在开发中，你看到的是原型。",
        en: "Suikou English is still being built. What you see is the prototype." } }],
      links: [], qr: null,
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "随口英语是一款亲子英语场景卡微信小程序：把“刷牙、吃饭、出门”等日常场景做成卡片，家长随口就能带孩子说英语。首版面向 3–5 岁。",
          en: "Suikou English is a WeChat mini-program of parent-child English scenario cards: everyday moments like brushing teeth or getting dressed, turned into phrases a parent can use on the spot. First release targets ages 3–5."
        },
        statusLabel: { zh: "开发中", en: "In development" },
        statusClass: "is-dev",
        links: [{ label: { zh: "小程序码", en: "Mini-program QR" }, href: null, state: "tbd" }]
      },
      aiGenerated: false, disclosure: null, mobileFallback: "swipe-screens"
    },
    {
      key: "xiaoyi", order: 50, type: "design", status: "pending",
      title: { zh: "小姨家", en: "Xiaoyi's Home" },
      tagline: { zh: "品牌、菜单与包装视觉", en: "Brand, menu and packaging visuals" },
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
        zh: "小姨家是一本还没印完的册子，我还在收集它的每一页。",
        en: "Xiaoyi's Home is a book still at the printer. I'm collecting its pages." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        title: { zh: "小姨家", en: "Aunt’s Home" },
        blurb: {
          zh: "小姨家是一个从零到一做起来的餐饮品牌，围绕“像回家吃饭一样”的感觉，完成命名、标志、色彩字体、菜单包装和空间导视的一整套品牌系统。",
          en: "Aunt’s Home is a food-and-beverage brand built from zero to one around the feeling of home: naming, bilingual marks, color and type, menus, packaging, and space wayfinding as one system."
        },
        statusLabel: { zh: "已结束 · 2024", en: "Ended · 2024" },
        statusClass: "is-pending",
        note: { zh: "角色：品牌 / 视觉设计。更多说明待补。", en: "Role: brand / visual design. More to come." },
        links: []
      },
      aiGenerated: false, disclosure: null, mobileFallback: "single-pages"
    },
    {
      key: "taotao", order: 60, type: "channel", status: "live",
      title: { zh: "桃桃屋", en: "TaoTao House" },
      tagline: { zh: "给小朋友的儿歌频道", en: "A nursery-rhyme channel for little ones" },
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
        zh: "桃桃屋会唱歌。不过现在，声音请你先自己想象。",
        en: "TaoTao House sings. For now, you'll have to imagine the sound." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "桃桃屋是一个中英双语原创儿歌频道，陪 2–4 岁孩子把刷牙、洗手、吃饭、睡觉这些日常小事变成愿意跟着唱的游戏，一首歌教三个英文词。内容为 AI 生成。",
          en: "TaoTao House is a bilingual (Chinese-English) original kids’ song channel for ages 2–4, turning daily routines like brushing teeth, handwashing, and mealtime into songs kids want to join, with three English words per episode. Content is AI-generated."
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
        en: "This is me, and this is the scaffolding. Every new thing I make adds a line to the log." } }],
      log: [
        { date: "2026-10-15", zh: "写下这份说明书", en: "Wrote the build spec", model: null, costUsd: 0 },
        { date: "2026-10-17", zh: "做出第二版静态样片（无 AI 素材）", en: "Built preview v2, a static sample with no AI assets", model: null, costUsd: 0 },
        { date: "2026-10-18", zh: "写清 Louis 的身份，接入内容草稿和联系方式", en: "Spelled out who Louis is; wired in draft copy and contacts", model: null, costUsd: 0 }
      ],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        tagline: { zh: "这个站，就是我的作品", en: "This site is my own work" },
        blurb: {
          zh: "野生路易斯就是 ailiu.online 这个网站本身：Louis 自己的作品，全部由 AI 生成，会慢慢长出新的内容。",
          en: "Wild Louis is this very website: Louis’s own work, entirely AI-generated, growing a little over time."
        },
        statusLabel: { zh: "进行中 · 持续生长", en: "Ongoing · still growing" },
        statusClass: "is-ai",
        note: {
          zh: "Louis 既是 ailiu 的数字分身，也是站里的虚拟角色，两者不冲突：前六章是 ailiu 的作品，也就是 Louis 的作品；这一章是 Louis 亲手做的。",
          en: "Louis is both ailiu’s digital double and this site’s virtual character, and the two don’t conflict: chapters 01–06 are ailiu’s work, so they’re Louis’s too; this one is Louis’s own."
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
    }
  ]
};
