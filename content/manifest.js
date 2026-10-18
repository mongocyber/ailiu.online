/* Project manifest — single source for nav, fixed text slots, narration queue.
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers.
   r7: each project carries a `draft` block (copy, status, links from CONTENT-DRAFT.md, unconfirmed);
   the page renders `draft` over the base fields and tags it 草稿 / Draft.
   r8: order is Aviso, PrintPlay, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (07); copy tightened; `work` = ailiu's professional design work.
   Link states: ok = real link · confirm = known but awaiting the owner's OK (not linked) · tbd = does not exist yet · text = shown as text. */
window.MANIFEST = {
  version: 1,
  narrationScope: "home-all-sections",
  persona: {
    draft: true,
    // r7 decision: Louis = ailiu's digital double AND the site's virtual character. Not in conflict.
    line: {
      zh: "Louis 是 ailiu 的数字分身，也是这个站里的虚拟角色。这里的作品都出自 ailiu；第 06 章「野生路易斯」是 Louis 自己做的，就是这个网站。Louis 的形象和声音由 AI 生成。",
      en: "Louis is ailiu's digital double and the character who lives on this site. Everything here is ailiu's work; chapter 06, Wild Louis, is Louis's own: this website. Louis's image and voice are AI-generated."
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
          zh: "你好，我是 Louis，ailiu 的数字分身。往下滚，我带你看七件作品。",
          en: "Hi, I'm Louis, ailiu's digital double. Scroll down and I'll show you seven projects."
        }
      }
    ]
  },
  /* r8: ailiu's professional design work, condensed from the old site (mongocyber.github.io).
     Generalised: no employer / cloud product / client names, no internal figures, no testimonials,
     no years or "projects shipped" counts. Hardware cases on the old site had titles only → omitted. */
  work: {
    narration: [{ id: "work-1", subtitle: {
      zh: "七章讲完了。接下来是 ailiu 的本行：B 端和 AI 产品设计。",
      en: "That’s the seven. Next is ailiu’s trade: B2B and AI product design." } }],
    lead: {
      zh: "ailiu 的本行是 B 端与 AI 产品体验设计：Agent、数据平台、复杂工作流。下面是四项核心能力和五个案例，都来自某云平台的内部产品；产品名、客户和内部数据都已隐去。",
      en: "ailiu’s trade is B2B and AI product experience design: agents, data platforms, complex workflows. Below are four core capabilities and five case studies, all from internal products at a cloud platform, with product names, clients and internal figures left out."
    },
    capabilities: [
      { id: "ai", title: { zh: "AI 产品与 Agent 体验设计", en: "AI product & agent experience" },
        text: { zh: "把模型、工具、知识源和任务节点，做成能配置、能调试、能迭代的 Agent 流程。让人看得见 AI 在做什么、为什么这么做、哪一步需要人来确认。",
                en: "Turning models, tools, knowledge sources and task nodes into agent workflows people can configure, debug and iterate, so they can see what the AI is doing, why, and where a human should step in." },
        tags: { zh: ["Agent 工作流", "工具调用", "可控执行"], en: ["Agent workflow", "Tool-calling UX", "Controllable runs"] } },
      { id: "platform", title: { zh: "复杂平台与工作流设计", en: "Complex platforms & workflows" },
        text: { zh: "把多角色、多对象、多状态的业务系统，拆成清楚的任务路径和工作台。关键是减轻认知负担：一进来就知道哪些任务、数据和操作跟自己有关。",
                en: "Breaking multi-role, multi-object, multi-state systems into clear task paths and workspaces. The point is lighter cognitive load: on arrival, people see the tasks, data and actions that concern them." },
        tags: { zh: ["角色与权限", "任务流", "状态体系"], en: ["Roles & permissions", "Task flows", "State systems"] } },
      { id: "data", title: { zh: "数据平台与分析产品设计", en: "Data platforms & analytics" },
        text: { zh: "连通数据的生产、管理、分析和使用，让业务用户从找到数据、看懂数据，一路走到用数据做判断。",
                en: "Connecting how data is produced, managed, analyzed and used, so business users can go from finding data to understanding it to deciding with it." },
        tags: { zh: ["数据资产", "数据标注", "自助分析"], en: ["Data assets", "Data annotation", "Self-service analytics"] } },
      { id: "ia", title: { zh: "信息架构与系统抽象", en: "Information architecture & system abstraction" },
        text: { zh: "从业务流程、对象、角色和规则里找出稳定的部分。先搭结构，再画页面，产品才能一直往下长。",
                en: "Finding what stays stable across processes, objects, roles and rules. Structure first, pages second, so the product can keep growing." },
        tags: { zh: ["信息架构", "对象建模", "系统思考"], en: ["Information architecture", "Object modeling", "Systems thinking"] } }
    ],
    cases: [
      { id: "agent", title: "Agent Builder", sub: { zh: "Agent 编排平台", en: "Agent orchestration platform" },
        domain: { zh: "AI Agent · 编排", en: "AI agent · orchestration" },
        summary: { zh: "某云平台内部的 Agent 编排平台：把模型、工具、知识源、任务节点和卡片配置，组织成能搭建、编排、调试、复用的一条完整流程。",
                   en: "An internal agent orchestration platform at a cloud provider. Models, tools, knowledge sources, task nodes and cards come together in one flow you can build, wire up, debug and reuse." },
        problem: { zh: "能跑的 Agent 不只是一段 Prompt。搭建者要拼流程，场景负责人要稳定交付，平台维护者要能定位异常。对象多、路径散，运行过程也说不清。",
                   en: "A working agent is more than a prompt. Builders assemble flows, scenario owners need dependable results, platform maintainers need to trace failures. Too many objects, scattered paths, and runs nobody could explain." },
        moves: { zh: ["画布作主工作区：节点卡片直接显示输入、输出、配置是否完整和异常，不用翻多页表单。",
                      "节点状态贯穿配置和运行：未配置、已配置、运行中、成功、失败、跳过、待确认。",
                      "配置面板用同一套主干（基础信息、输入、参数、输出、高级、试运行），不同节点只在必要处扩展。",
                      "调试留在搭建流程里：运行时节点按顺序点亮，出错处能跳回对应配置；日志先给业务能读懂的解释，技术细节可展开。"],
                 en: ["The canvas is the main workspace: each node card shows its inputs, outputs, whether it’s fully configured, and any errors, with no trips through form pages.",
                      "Node states run through both setup and execution: not set, set, running, done, failed, skipped, awaiting confirmation.",
                      "One configuration frame for every node (basics, inputs, parameters, outputs, advanced, test run); each node type only adds what it needs.",
                      "Debugging stays inside the build flow: nodes light up in order as it runs, and an error jumps you back to the right settings. Logs explain in plain language first, with technical detail one click away."] },
        result: { zh: "搭 Agent 从分散的配置收拢成一条连续路径；能不能用、哪里出错更容易判断；模板、节点和设计模式能在团队之间复用。",
                  en: "Building an agent went from scattered settings to one continuous path; it got easier to tell whether a flow works and where it breaks; templates, nodes and patterns are shared across teams." } },
      { id: "annotation", title: "Data Annotation Service", sub: { zh: "数据标注服务平台", en: "Data annotation platform" },
        domain: { zh: "数据生产 · 标注", en: "Data production · annotation" },
        summary: { zh: "面向 AI 数据生产的内部平台：把散在文档、表格和聊天里的标注协作，变成能配置、能分发、能追踪、能验收的生产系统。",
                   en: "An internal platform for producing AI training data. Annotation work that used to live in docs, spreadsheets and chat became a system you can configure, assign, track and sign off." },
        problem: { zh: "规则散在不同文档里，分发靠人追问，文本和图片的工作台都不顺手，结果也没有验收，数据用起来有风险。",
                   en: "Rules were spread across documents, assignments were chased by hand, the text and image workspaces were clumsy, and nothing was formally reviewed, so the data was risky to use." },
        moves: { zh: ["以「标注任务」为核心对象：模板定规则，数据集给样本，进度和验收都写回同一个任务。",
                      "发布前按步骤确认数据集、模板、人员、时间和质量要求，并提示风险。",
                      "文本工作台：样本居中，标签和提交集中在右侧，规则不离开当前页。图片工作台：大画布，框选、对象列表和标签联动。",
                      "状态不止「进行中 / 已完成」，还要说清分发、异常、退回、待验收、已验收。"],
                 en: ["The annotation task is the core object: a template sets the rules, a dataset supplies samples, and progress and review all write back to the same task.",
                      "Before publishing, a step-by-step check of dataset, template, people, deadline and quality bar, with risks flagged.",
                      "Text workspace: the sample in the middle, labels and submit on the right, rules always on the page. Image workspace: a large canvas where boxes, the object list and labels stay in sync.",
                      "States go beyond “in progress / done” to cover assigned, flagged, returned, awaiting review and accepted."] },
        result: { zh: "人工分发、手动回收，变成状态清楚、结果可追踪的平台流程；模板和工作台能复用到更多数据生产场景。",
                  en: "Hand-assigned, hand-collected work became a platform flow with clear states and traceable results; templates and workspaces carry over to other data production work." } },
      { id: "platform", title: "Data Platform", sub: { zh: "数据管理与使用一站式平台", en: "One-stop data management & use" },
        domain: { zh: "数据平台 · 管理", en: "Data platform · management" },
        summary: { zh: "把数据资产、数据市场、数据服务、权限状态、使用入口和平台管理放进一套体验，帮内部团队找到数据、看懂数据、申请并用上数据。",
                   en: "Data assets, a data market, data services, permissions, entry points and admin brought into one experience, so internal teams can find data, understand it, request it and put it to use." },
        problem: { zh: "入口分散，资产看不懂，权限走到哪一步不清楚，管理和使用是两张皮。",
                   en: "Too many entry points, assets that were hard to read, permission requests nobody could track, and management cut off from actual use." },
        moves: { zh: ["先定义对象，再定义页面：资产、市场、服务、使用、权限、平台管理。",
                      "状态必须连着操作：每个状态都要回答「现在怎样、为什么、下一步做什么」。",
                      "管理路径和使用路径分开：管理侧看字段、来源、负责人；使用侧先看场景、能不能用、从哪进。",
                      "用户、角色、审批流程收进平台配置，不散落在业务页面里。"],
                 en: ["Objects first, pages second: assets, market, services, consumption, permissions, admin.",
                      "Every state is tied to an action and answers: what’s the situation, why, and what do I do next.",
                      "Management and use are separate paths: admins see fields, sources and owners; users first see the use case, availability and the way in.",
                      "Users, roles and approval flows live in platform settings, not scattered across business pages."] },
        result: { zh: "发现、理解、申请、服务到使用连成一条路；资产详情、数据卡片、权限状态等沉淀为可复用的模式。",
                  en: "Discovery, understanding, requests, services and use became one path; asset details, data cards and permission states became reusable patterns." } },
      { id: "analytics", title: "Self-Service Analytics", sub: { zh: "自助分析工具", en: "Self-service analytics tool" },
        domain: { zh: "数据分析 · 自助", en: "Analytics · self-service" },
        summary: { zh: "让业务同事不靠研发和数据同学，自己选数据、配字段、出图表、搭看板、发布给团队。",
                   en: "Lets business teams pick data, set up fields, make charts, build dashboards and publish them, without waiting on engineers or data specialists." },
        problem: { zh: "不知道该选哪个数据源、字段是什么意思；指标、维度、筛选和图表的关系绕；从出图到发布看板，路径断成好几截，结果也难复用。",
                   en: "People didn’t know which source to pick or what a field meant; metrics, dimensions, filters and chart types tangled together; going from a chart to a published dashboard took several disconnected steps, and results were hard to reuse." },
        moves: { zh: ["字段解释前置：口径、维度说明、示例值和权限，在出图之前就看得到。",
                      "常见任务走默认路径，高级配置需要时再展开。",
                      "实时预览加配置校验，出错能定位到具体哪一项。",
                      "看板上每个筛选影响哪些图一目了然；草稿、预览、已发布分清楚，发布前确认谁能看到。"],
                 en: ["Field explanations come first: definitions, dimension notes, sample values and permissions are visible before you chart anything.",
                      "Common tasks follow a default path; advanced settings open only when needed.",
                      "Live preview plus validation, with errors pinned to the exact setting.",
                      "On a dashboard you can see which charts each filter touches; draft, preview and published are distinct, and you confirm who can see it before publishing."] },
        result: { zh: "做报表、搭看板的门槛降下来了；字段配置、图表配置、筛选、看板布局和发布管理沉淀为通用模式。",
                  en: "Reports and dashboards got much easier to make; field setup, chart setup, filters, layout and publishing became shared patterns." } },
      { id: "support", title: "Support & Service Upgrade", sub: { zh: "支持与服务升级", en: "AI-assisted support tickets" },
        domain: { zh: "客户支持 · AI 辅助", en: "Support · AI-assisted" },
        summary: { zh: "重做云控制台的新建工单：用户只管描述问题，系统自动填分类；提交前先给带上下文的 AI 解答和推荐，解决不了再转人工。",
                   en: "A redesign of “new support ticket” in a cloud console. You just describe the problem; the system fills in the categories, offers a context-aware AI answer and suggestions first, and hands off to a person only when needed." },
        problem: { zh: "原来的流程一上来就让用户在多层分类里选产品和问题类型；页面上的助手是个独立聊天窗，不知道用户在用什么服务、写了什么。",
                   en: "The old form opened with layers of product and issue categories to pick from, and the on-page assistant was a separate chat window that knew nothing about the services in use or what had been typed." },
        moves: { zh: ["问题描述是唯一主输入；产品分类和问题类型由 AI 自动填，用户确认或改一下就行。",
                      "描述区加「AI 解答」，可以接着追问，不用重复交代背景。",
                      "右侧随输入实时推荐排查工具、案例和文档。",
                      "还没解决，就带着分类、对话和试过的办法生成工单，转给合适的工程师。"],
                 en: ["The problem description is the one main input; AI fills in product and issue type, and the user just confirms or corrects.",
                      "An “AI answer” button sits in the description area, with follow-up questions that keep the context.",
                      "The side panel suggests diagnostic tools, cases and docs as you type.",
                      "If it’s still unsolved, the ticket goes to a matching engineer with the categories, the conversation and what was already tried."] },
        result: { zh: "新建工单从一张录入表，变成一个分流入口：常见问题提前解决，进到人工的工单上下文更完整。",
                  en: "The new-ticket page went from a data-entry form to a triage point: common issues get solved up front, and tickets that reach a person arrive with full context." } }
    ],
    background: {
      zh: "在某云平台做 B 端与 AI 产品体验设计，覆盖 Agent 编排、数据生产、数据平台、自助分析和客户支持。习惯的做法：先理清对象、角色、流程、状态和规则，再画页面。",
      en: "B2B and AI product experience design at a cloud platform, across agent orchestration, data production, data platforms, self-service analytics and customer support. The habit: sort out objects, roles, flows, states and rules before drawing a single page."
    },
    method: { zh: ["对象", "角色", "流程", "状态", "规则", "页面"], en: ["Objects", "Roles", "Flows", "States", "Rules", "Pages"] },
    deliverables: {
      zh: "通常交付：信息架构图、对象关系模型、业务流程与状态流转图、原型、设计规范与交互说明。",
      en: "Usual deliverables: IA maps, object models, process and state diagrams, prototypes, design specs and interaction notes."
    }
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
      key: "steam", order: 30, type: "product", status: "live",
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
      key: "suikou", order: 40, type: "product", status: "in-development",
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
      key: "taotao", order: 50, type: "channel", status: "live",
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
      key: "wild-louis", order: 60, type: "virtual", status: "self",
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
        { date: "2026-10-18", zh: "统一左对齐，调整章节顺序，加入「设计作品」", en: "Aligned every left edge, reordered chapters, added Design Work", model: null, costUsd: 0 }
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
          zh: "Louis 是 ailiu 的数字分身，也是站里的虚拟角色，两者并不矛盾。其余六章是 ailiu 的作品，这一章是 Louis 亲手做的。",
          en: "Louis is ailiu’s digital double and this site’s character; the two don’t clash. The other six chapters are ailiu’s work. This one, Louis made."
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
      key: "xiaoyi", order: 70, type: "design", status: "pending",
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
