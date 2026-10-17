/* Project manifest — single source for nav, fixed text slots, narration queue.
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers. */
window.MANIFEST = {
  version: 1,
  narrationScope: "home-all-sections",
  hero: {
    narration: [
      {
        id: "hero-1",
        subtitle: {
          zh: "你好，我是 Louis，这个站的讲解员。往下滚，我带你看七个作品。",
          en: "Hi, I'm Louis, the voice of this site. Scroll, and I'll walk you through seven projects."
        }
      }
    ]
  },
  projects: [
    {
      key: "aviso", order: 10, type: "product", status: "live",
      title: { zh: "Aviso", en: "Aviso" },
      tagline: { zh: "Chrome 划词 AI 助手", en: "Select any text, ask AI in place" },
      blurb: {
        zh: "一个 Chrome 扩展：在任意网页上划选文字，原地提问，不用离开当前页面。",
        en: "A Chrome extension: highlight a passage on any page and ask about it without leaving the tab."
      },
      statusLabel: { zh: "上线", en: "LIVE" },
      treatment: { id: "aviso-browser-depth", choreographyId: "aviso.browser-depth.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 200,
      accent: "#8FB573",
      narration: [{ id: "aviso-1", subtitle: {
        zh: "Aviso 住在浏览器里。划一段字，答案就出现在它旁边。",
        en: "Aviso lives in your browser. Highlight something, and the answer appears right beside it." } }],
      links: [{ label: { zh: "打开 Aviso", en: "Open Aviso" }, href: "https://aviso-nine.vercel.app" }],
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
      aiGenerated: false, disclosure: null, mobileFallback: "grid-2x2"
    },
    {
      key: "wild-louis", order: 70, type: "virtual", status: "self",
      title: { zh: "野生路易斯", en: "Wild Louis" },
      tagline: { zh: "这个站，是我做的", en: "I made this site" },
      blurb: {
        zh: "我是一个虚构的 AI 人设。这一章是本站的源码层，也是我的制作日志。",
        en: "I'm a fictional AI persona. This chapter is the site's source layer, and my build log."
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
        { date: "2026-10-17", zh: "做出第二版静态样片（无 AI 素材）", en: "Built preview v2, a static sample with no AI assets", model: null, costUsd: 0 }
      ],
      links: [],
      aiGenerated: true,
      disclosure: { zh: "本章内容全部由 AI 生成。", en: "Everything in this section is AI-generated." },
      mobileFallback: "static-source-snippet"
    }
  ]
};
