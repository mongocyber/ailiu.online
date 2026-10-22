/* Project manifest — single source for nav, fixed text slots; narration lines kept as data (r17: not rendered, kept for voice-over).
   Mirrors INSTRUCTIONS §8 shape (trimmed for this static preview).
   All copy is a DRAFT pending user approval (OPEN-3). No metrics, no invented numbers.
   r7: each project carries a `draft` block (copy, status, links from CONTENT-DRAFT.md, unconfirmed);
   the page renders `draft` over the base fields and tags it 草稿 / Draft.
   r8: order is Aviso, PrintPlay, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (07); copy tightened; `work` = ailiu's professional design work.
   r10: Design Work is chapter 03 (key "work", order 30): Aviso, PrintPlay, Design Work, Steam, Suikou, TaoTao, Wild Louis, Xiaoyi (08).
   r12: all copy is ailiu speaking in the first person; no chapter counts, one self-introduction (the hero title).
   Its slots come from the project entry; the capabilities / cases / background below stay in `work`.
   r14B: order is Aviso, PrintPlay, Design Work, Steam, Suikou, TaoTao, Xiaoyi (07, a restaurant venture), Wild Louis (08).
   Copy pass: each entry says why I made it, what it is and where it stands now; no persona set-up for Louis.
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
    // r13: the line no longer says where Louis's image comes from (that sentence was removed on request).
    // The one self-introduction is the hero title; nothing else re-introduces.
    line: {
      zh: "下面是我做过的东西：工作里的设计案例，也有业余做的小产品、儿歌频道，和一次餐饮创业。",
      en: "Below is what I’ve made: design work from my day job, and things I do on the side, from small products to a kids’ song channel and a restaurant venture."
    }
  },
  contact: [
    // r7 decision: only these two. Real links.
    { id: "email", label: { zh: "邮箱", en: "Email" }, text: "louisliu@mail.grokbot.com", href: "mailto:louisliu@mail.grokbot.com" },
    { id: "x", label: { zh: "X", en: "X" }, text: "@LouisLiu88", href: "https://x.com/LouisLiu88" }
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
    /* r11: capabilities are title + tags. */
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
    /* r13: full case studies again, rewritten in the first person from the old site's case pages.
       Each case: summary, problem, decisions (2–3 concrete design calls), result (qualitative, no figures),
       and images from the old site (anonymized mockups; see scripts/work_images.py). Image entries give the
       desktop file; app.js derives the "-sm" phone file. w / h are the desktop pixel size. */
    cases: [
      { id: "agent", title: "Agent Builder", domain: { zh: "AI Agent · 编排", en: "AI agents · orchestration" },
        summary: { zh: "某云平台内部的 Agent 编排平台。我把模型、工具、知识源、任务节点和卡片放进一张画布，让业务同事能搭、能调、能复用。",
                   en: "An internal agent orchestration platform at a cloud provider. I put models, tools, knowledge, task nodes and cards on one canvas so business teams could build, debug and reuse agents." },
        problem: { zh: "能跑的 Agent 不只是一段 Prompt。对象多、依赖关系看不清，从配置到调试的路径断成几截；运行失败时，没人说得清卡在哪一步。",
                   en: "A working agent is more than a prompt. Too many objects with unclear dependencies, a path from setup to debugging broken into pieces, and when a run failed nobody could say where." },
        decisions: [
          { zh: "画布就是主工作区：节点卡片直接显示类型、输入来源、配置完整度和异常，不用翻多页表单。",
            en: "The canvas is the workspace: each node card shows its type, inputs, how complete its setup is and any errors, instead of a stack of forms." },
          { zh: "所有节点共用一套配置主干（基础信息、输入、参数、输出、高级、测试），只在必要处扩展专属字段。",
            en: "Every node shares one settings spine (basics, inputs, parameters, output, advanced, test run) and adds its own fields only where needed." },
          { zh: "调试留在搭建流程里：运行时节点按顺序点亮，日志先给业务能读懂的解释，出错可以跳回对应节点。",
            en: "Debugging stays inside the build flow: nodes light up in run order, logs explain in plain terms first, and an error jumps back to its node." }
        ],
        result: { zh: "搭一个 Agent 从分散配置收拢成一条连续路径；编排、节点配置、执行反馈和异常处理沉淀成几个团队共用的模式。",
                  en: "Building an agent became one continuous path; orchestration, node setup, run feedback and error handling became patterns several teams share." },
        images: [
          { src: "assets/work/agent-1.webp", w: 1400, h: 885,
            alt: { zh: "Agent Builder 工作流编排界面示意", en: "Mockup of the Agent Builder workflow editor" },
            caption: { zh: "工作流编排：节点画布、节点库、配置面板和执行日志在同一屏。", en: "Workflow editor: node canvas, node library, settings panel and run log on one screen." } },
          { src: "assets/work/agent-2.webp", w: 1000, h: 667,
            alt: { zh: "执行调试界面示意", en: "Mockup of the run debugger" },
            caption: { zh: "执行调试：当前节点、输入输出和结构化日志。", en: "Run debugger: current node, input and output, structured log." } },
          { src: "assets/work/agent-3.webp", w: 1000, h: 667,
            alt: { zh: "Agent Builder 信息架构图", en: "Agent Builder information architecture diagram" },
            caption: { zh: "信息架构：围绕创建、编排、调试、观察和迭代组织入口。", en: "Information architecture, built around create, orchestrate, debug, observe, iterate." } }
        ] },
      { id: "annotation", title: "Data Annotation Service", domain: { zh: "数据生产 · 标注", en: "Data production · annotation" },
        summary: { zh: "AI 训练数据的生产平台。原本散在文档、表格和聊天里的标注协作，我把它做成能配置、分发、执行、追踪、验收的系统。",
                   en: "A platform for producing AI training data. Annotation work that lived in docs, sheets and chat became a system you configure, assign, do, track and sign off." },
        problem: { zh: "规则散在不同文档里，执行的人理解不一；任务分给了谁、做到哪了只能靠追问；结果没有像样的验收，坏数据会流到下游。",
                   en: "Rules were spread across documents and read differently by each annotator; who had what, and how far along, meant chasing people; results had no real review, so bad data flowed downstream." },
        decisions: [
          { zh: "以「标注任务」为核心对象：模板、数据集、人员、工作台、进度和验收都回写到同一个任务上。",
            en: "The annotation task is the core object: template, dataset, people, workspace, progress and review all write back to it." },
          { zh: "发布前分步确认数据、模板、人员和时间，同屏看到人员负载，最后给出任务摘要和风险提示。",
            en: "Publishing walks through data, template, people and deadline in steps, shows workload side by side, and ends with a summary and risk warnings." },
          { zh: "文本和图片标注共用一个工作台框架：样本在中间，规则、标签和提交在右侧，提交后直接进入下一条。",
            en: "Text and image labelling share one workspace frame: the sample in the middle, rules, labels and submit on the right, and the next item right after submitting." }
        ],
        result: { zh: "标注从一次性的人工协作，变成状态清楚、结果可追踪的流程；模板、分发、工作台和验收能复用到更多数据生产场景。",
                  en: "Annotation went from one-off manual coordination to a flow with clear states and traceable results; templates, assignment, workspaces and review carry over to other data work." },
        images: [
          { src: "assets/work/annotation-1.webp", w: 1400, h: 788,
            alt: { zh: "文本与图片标注工作台界面示意", en: "Mockup of the text and image annotation workspace" },
            caption: { zh: "标注工作台：样本队列、文本与图片标注、标签与校验。", en: "Workspace: sample queue, text and image labelling, labels and checks." } },
          { src: "assets/work/annotation-2.webp", w: 1000, h: 563,
            alt: { zh: "任务创建与分发界面示意", en: "Mockup of task creation and assignment" },
            caption: { zh: "任务创建与分发：按步骤确认，同屏看人员负载。", en: "Creating and assigning a task, step by step, with workload in view." } },
          { src: "assets/work/annotation-3.webp", w: 1000, h: 563,
            alt: { zh: "进度管理与结果验收看板示意", en: "Mockup of the progress and review dashboard" },
            caption: { zh: "进度与验收：完成情况、待复核队列、退回与导出。", en: "Progress and review: completion, review queue, returns and export." } }
        ] },
      { id: "platform", title: "Data Platform", domain: { zh: "数据平台 · 管理与使用", en: "Data platform · manage & use" },
        summary: { zh: "某云平台内部的数据管理与使用平台。我把数据资产、数据市场、数据服务、权限和平台管理放进一套体验：找到、看懂、申请、用上。",
                   en: "An internal platform for managing and using data at a cloud provider. I brought assets, the data market, data services, permissions and admin into one experience: find it, understand it, request it, use it." },
        problem: { zh: "资产、服务、权限申请和使用入口分在不同系统；字段、来源、负责人信息不集中，业务同事判断不了数据能不能用；审批走到哪一步也看不到。",
                   en: "Assets, services, access requests and the places to use data sat in different systems; fields, sources and owners were scattered, so people couldn’t tell whether data was usable; and nobody could see where a request stood." },
        decisions: [
          { zh: "先定义对象，再定义页面：把平台拆成资产、市场、服务、使用、权限和管理几类对象，页面围绕对象组织。",
            en: "Objects before pages: I split the platform into assets, market, services, use, permissions and admin, and built the pages around them." },
          { zh: "状态必须绑定操作：每个状态都回答「现在怎样、为什么、下一步做什么」。",
            en: "Every state comes with an action: it answers what’s going on, why, and what to do next." },
          { zh: "管理和使用分层：管理侧保留字段、来源、负责人和发布规则，使用侧先给场景、可用性和入口。",
            en: "Admin and use are separate layers: admins get fields, sources, owners and publishing rules; users get scenarios, availability and a place to start." }
        ],
        result: { zh: "从发现、理解、申请到使用连成一条路；资产详情、数据卡片、权限状态和使用入口沉淀为通用模式。",
                  en: "Finding, understanding, requesting and using data became one path; asset details, data cards, permission states and entry points became shared patterns." },
        images: [
          { src: "assets/work/platform-1.webp", w: 1400, h: 788,
            alt: { zh: "数据平台工作台总览示意", en: "Mockup of the data platform home" },
            caption: { zh: "平台工作台：资产、服务、权限状态和使用入口。", en: "Platform home: assets, services, permission states and entry points." } },
          { src: "assets/work/platform-2.webp", w: 1000, h: 563,
            alt: { zh: "权限状态与使用入口界面示意", en: "Mockup of permission states and entry points" },
            caption: { zh: "权限状态：每个状态都带原因和下一步。", en: "Permission states, each with a reason and a next step." } },
          { src: "assets/work/platform-3.webp", w: 1000, h: 563,
            alt: { zh: "数据平台信息架构图", en: "Data platform information architecture diagram" },
            caption: { zh: "信息架构：模块边界，和一条从接入到使用的链路。", en: "Information architecture: module boundaries and one path from ingest to use." } }
        ] },
      { id: "analytics", title: "Self-Service Analytics", domain: { zh: "数据分析 · 自助", en: "Analytics · self-service" },
        summary: { zh: "给业务同事和分析师用的自助分析工具：自己选数据、配字段、出图表、搭看板并发布，不用等研发。",
                   en: "A self-service analytics tool for business teams and analysts: pick data, set up fields, make charts, build and publish dashboards, without waiting on engineers." },
        problem: { zh: "用户不知道该选哪个数据源、字段代表什么；指标、维度和筛选的关系绕，容易配错；从出图到发布看板断成好几步。",
                   en: "People didn’t know which source to pick or what a field meant; metrics, dimensions and filters were easy to get wrong; and going from a chart to a published dashboard took several disconnected steps." },
        decisions: [
          { zh: "字段解释前置：选数据时就能看到字段说明、口径、示例值和权限状态。",
            en: "Field notes come first: definitions, sample values and access status show up while you pick the data." },
          { zh: "常见任务走默认路径，高级配置按需展开；配置分组固定，实时预览把错误定位到具体配置项。",
            en: "Common tasks follow a default path and advanced settings open on demand; setting groups stay put, and the live preview pins errors to the exact setting." },
          { zh: "筛选范围可见：每个筛选器标明作用于哪些图表；发布前确认可见范围，草稿和已发布分得清。",
            en: "Filter scope is visible: each filter shows which charts it affects; before publishing you confirm who can see it, and drafts stay apart from published versions." }
        ],
        result: { zh: "做报表、搭看板的门槛降下来，少依赖研发；字段、图表、筛选、看板布局和发布沉淀为通用模式。",
                  en: "Reports and dashboards got easier to make, with less help from engineers; fields, charts, filters, layout and publishing became shared patterns." },
        images: [
          { src: "assets/work/analytics-1.webp", w: 1400, h: 788,
            alt: { zh: "自助分析工作台示意", en: "Mockup of the analytics workspace" },
            caption: { zh: "分析工作台：数据、字段、图表配置和看板画布。", en: "Workspace: data, fields, chart setup and the dashboard canvas." } },
          { src: "assets/work/analytics-2.webp", w: 1000, h: 563,
            alt: { zh: "数据源与字段选择界面示意", en: "Mockup of data source and field selection" },
            caption: { zh: "数据源与字段：先解释，再配置。", en: "Sources and fields: explain first, then configure." } },
          { src: "assets/work/analytics-3.webp", w: 1000, h: 563,
            alt: { zh: "图表配置与筛选联动界面示意", en: "Mockup of chart setup and linked filters" },
            caption: { zh: "图表配置与筛选联动：作用范围和受影响的组件一目了然。", en: "Chart setup and linked filters: scope and affected widgets in plain view." } }
        ] },
      { id: "support", title: "Support & Service Upgrade", domain: { zh: "客户支持 · AI 辅助", en: "Support · AI-assisted" },
        summary: { zh: "重做云控制台里的「新建工单」：用户只描述问题，AI 自动填分类、先给解答，解决不了再带着上下文转人工。",
                   en: "A redesign of “new ticket” in a cloud console: users just describe the problem, AI fills in the categories and answers first, and if that doesn’t solve it, a person takes over with the full context." },
        problem: { zh: "用户还没说清问题，就得先在多层产品分类和问题类型里做选择；页面上的助手和工单表单是割裂的，不知道用户在用什么服务；能自助解决的问题也流进了人工。",
                   en: "Before saying what was wrong, users had to pick through layers of product and issue categories; the on-page assistant was cut off from the form and didn’t know what they were using; and questions with ready answers still reached people." },
        decisions: [
          { zh: "问题描述是唯一主输入；产品分类和问题类型由 AI 根据描述、当前页面和已购服务填写，用户只需确认或修改。",
            en: "The description is the one main input; AI fills in product and issue type from it, the current page and the user’s services, and the user only confirms or corrects." },
          { zh: "描述框旁放「AI 解答」，能围绕同一个问题继续追问；右侧随输入推荐排查工具、案例和文档。",
            en: "An “AI answer” button sits by the description, with follow-ups on the same issue; the side panel suggests troubleshooting tools, cases and docs as you type." },
          { zh: "仍然没解决，就把对话、推荐过的尝试和分类一起带进人工工单。",
            en: "If it’s still unsolved, the conversation, what was tried and the categories all go into the ticket for a person." }
        ],
        result: { zh: "新建工单从录入表变成分流入口：基础问题在提交前就被解决，转到人工的工单上下文更完整。",
                  en: "“New ticket” turned from a data-entry form into a triage point: simple issues get solved before submitting, and the ones that reach a person arrive with fuller context." },
        images: [
          { src: "assets/work/support-1.webp", w: 1400, h: 933,
            alt: { zh: "AI 处理与推荐解决流程图", en: "Diagram of the AI handling and suggestion flow" },
            caption: { zh: "方案结构：描述问题 → AI 处理 → 推荐解决 → 转人工。", en: "The flow: describe → AI handles it → suggested fixes → hand-off to a person." } },
          { src: "assets/work/support-2.webp", w: 760, h: 950,
            alt: { zh: "原流程问题概览图（说明文字已隐去）", en: "Overview of the old flow’s problems (descriptions removed)" },
            caption: { zh: "原流程的痛点：提交慢、助手缺上下文、基础问题进人工、工单信息不全。", en: "Where the old flow hurt: slow to submit, an assistant without context, simple issues reaching people, thin tickets." } }
        ] }
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
      narration: [{ id: "aviso-1", subtitle: {
        zh: "Aviso 是我做的浏览器扩展：划一段字，答案就出现在旁边。",
        en: "Aviso is my browser extension: highlight a passage and the answer appears beside it." } }],
      links: [{ label: { zh: "打开 Aviso", en: "Open Aviso" }, href: "https://aviso-nine.vercel.app" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "为了不离开当前页面就能问 AI，我做了这个 Chrome 扩展。划词或右键，就在原页面里解释、翻译、润色、总结，也能说明图片；用你自己的模型 API Key。",
          en: "I built this Chrome extension so I could ask AI without leaving the page. Select text or right-click to explain, translate, polish or summarize it in place, or describe an image, with your own model API key."
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
      narration: [{ id: "printplay-1", subtitle: {
        zh: "PrintPlay 的终点是纸：每一页都是为了从打印机里出来。",
        en: "PrintPlay ends on paper: every page is made to come out of a printer." } }],
      links: [{ label: { zh: "访问 printplay.asia", en: "Visit printplay.asia" }, href: "https://printplay.asia" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "我给课堂比划猜词和家里的猜词游戏做了这个网站：选主题和年龄段，预览后直接打印或下载 PDF，不用注册。已上线，主题和打印件还在陆续加。",
          en: "I made this site for classroom charades and family guessing games: pick a theme and an age range, preview, then print or download a PDF. No sign-up. It’s live, and I keep adding themes and printables."
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
        zh: "我的本职：B 端与 AI 产品的体验设计。下面的案例来自某云平台的内部产品，名称和数据已隐去；点开看问题、做法和结果。",
        en: "My day job: UX for B2B and AI products. The cases below come from a cloud platform’s internal tools, with names and figures left out. Open one for the problem, the moves and the outcome."
      },
      statusLabel: { zh: "本行 · 案例已脱敏", en: "Day job · anonymized" },
      treatment: { id: "work-case-studies", choreographyId: "work.case-studies.v1" },
      transition: { enter: "reveal-up", exit: "fade-through" },
      stageHeightVh: null, // r13: no pinned stage — the chapter scrolls as a normal page (case studies)
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
      narration: [{ id: "steam-1", subtitle: {
        zh: "在蒸汽站，公式没有出处就不上线。",
        en: "On Steam Vent Calc, no formula goes live without a source." } }],
      links: [{ label: { zh: "steamventcalc.com", en: "steamventcalc.com" }, href: "https://steamventcalc.com" }],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "我把单管蒸汽采暖的几类计算做成了在线工具：排气阀选型、散热器排气、室外温度补偿曲线、注入混水。为了能核对，每条公式都注明公开来源；结果只是估算，不能代替专业设计。",
          en: "I turned the core sums of one-pipe steam heat into online tools: main and radiator vent sizing, outdoor reset curves, injection mixing. So you can check them, every formula cites a public source; results are estimates, not a substitute for professional design."
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
      narration: [{ id: "suikou-1", subtitle: {
        zh: "随口英语还在做，你看到的是原型。",
        en: "Suikou English is still in the works. This is the prototype." } }],
      links: [], qr: null,
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "想让家长在日常里随口带孩子说英语，我在做这个微信小程序：把刷牙、吃饭、出门这些场景做成卡片。首版面向 3–5 岁，还在开发，没有上线。",
          en: "I want parents to slip into English with their kids during the day, so I’m building this WeChat mini program: brushing teeth, mealtime and heading out become cards. The first version is for ages 3–5; it’s still in development."
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
      narration: [{ id: "taotao-1", subtitle: {
        zh: "桃桃屋把刷牙、洗手这些小事编成歌，一首教三个英文词。",
        en: "TaoTao House turns brushing teeth and washing hands into songs, three English words each." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "我给 2–4 岁的孩子做的中英双语儿歌频道：把刷牙、洗手、吃饭、睡觉编成能跟着唱的歌，每首教三个英文词。在 YouTube 和抖音持续更新。",
          en: "My Chinese–English song channel for ages 2–4: brushing teeth, washing hands, mealtime and bedtime become sing-alongs, and each song teaches three English words. Still updating on YouTube and Douyin."
        },
        statusLabel: { zh: "运营中", en: "Running" },
        links: [
          { label: { zh: "YouTube", en: "YouTube" }, href: "https://www.youtube.com/@TaoTaoHouse", state: "ok" },
          { label: { zh: "抖音号 TaoTaoHouse2026", en: "Douyin ID TaoTaoHouse2026" }, href: null, state: "text" },
          { label: { zh: "B 站", en: "Bilibili" }, href: null, state: "confirm" }
        ]
      },
      aiGenerated: true,
      disclosure: { zh: "内容由 AI 辅助生成", en: "Made with AI assistance" },
      mobileFallback: "grid-2x2"
    },
    {
      // r14B: chapter 07. A venture, not a design case: I started a restaurant brand from scratch (2024, ended).
      // Facts only from CONTENT-DRAFT.md and the old site (ailiu-peek content.ts): "从 0 到 1 的餐饮品牌创业项目", 家的味道, 2024, ended,
      // and I also did the naming and the visuals. No figures, no store count, no duration.
      // r25b: facts checked against the old site's production copy (/workspace/xiaoyi-src): 2024, ended, 0 → 1, 家的味道,
      // 像去亲戚家吃饭那样自在热乎, a real shop; naming / mark / menu / packaging / space and signage were mine. Told as a venture.
      key: "xiaoyi", order: 70, type: "venture", status: "ended",
      title: { zh: "小姨家", en: "Aunt’s Home" },
      tagline: { zh: "我的一次餐饮创业", en: "A restaurant venture I started from scratch" },
      blurb: {
        zh: "2024 年我从零开起一家小店，想做出家的味道。现在已经结束。",
        en: "A small shop I opened from scratch in 2024, built around a taste of home. It has since closed."
      },
      statusLabel: { zh: "已结束 · 2024", en: "Ended · 2024" },
      treatment: { id: "xiaoyi-venture-book", choreographyId: "xiaoyi.venture-book.v1" },
      transition: { enter: "depth-rise", exit: "fade-through" },
      stageHeightVh: 160,
      narration: [{ id: "xiaoyi-1", subtitle: {
        zh: "小姨家是我 2024 年开的店，从零做起，现在已经关了。",
        en: "Aunt’s Home was the shop I opened in 2024. I started it from scratch, and it has since closed." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        blurb: {
          zh: "2024 年，我从零开了一家小店，想让人吃到家的味道：像去亲戚家吃饭那样，自在、热乎。这首先是一次创业；名字、标志、菜单、包装和门店导视也是我自己做的。现在店已经关了。",
          en: "In 2024 I opened a small shop from scratch, built around a taste of home: easy and warm, like dinner at a relative’s. It was a venture first; I also made the name, the mark, the menus, the packaging and the shop’s signage myself. It has since closed."
        },
        statusLabel: { zh: "已结束 · 2024", en: "Ended · 2024" },
        statusClass: "is-pending",
        links: []
      },
      aiGenerated: false, disclosure: null, mobileFallback: "single-pages"
    },
    {
      key: "wild-louis", order: 80, type: "virtual", status: "self",
      title: { zh: "野生路易斯", en: "Wild Louis" },
      // r14: Wild Louis and this site are two separate projects (the site's content comes from Wild Louis).
      // The chapter is Wild Louis introducing himself, first person, plus his social channels; the build log lives in the footer.
      tagline: { zh: "设计师，爱试新鲜东西", en: "A designer who likes trying new things" },
      blurb: {
        zh: "我是一名设计师，喜欢尝试各种新鲜东西。",
        en: "I'm a designer who likes trying new things."
      },
      statusLabel: { zh: "进行中", en: "Ongoing" },
      treatment: { id: "wild-louis-portrait", choreographyId: "wildlouis.portrait.v1" },
      transition: { enter: "mask-wipe", exit: "fade-through" },
      stageHeightVh: 160,
      narration: [{ id: "wild-louis-1", subtitle: {
        zh: "我爱试新鲜东西，做出来就分享。做过的都在 ailiu.online。",
        en: "I like trying new things and sharing what I make. It all lives at ailiu.online." } }],
      links: [],
      draft: {
        label: { zh: "草稿", en: "Draft" },
        tagline: { zh: "设计师，爱试新鲜东西", en: "A designer who likes trying new things" },
        blurb: {
          zh: "我是一名设计师，喜欢尝试各种新鲜东西。做了什么就分享出来，也聊聊想法和见解。我做过的东西，都收在我的网站 ailiu.online。",
          en: "I'm a designer, and I like trying new things. Whatever I make, I share, along with my thoughts and takes. My site, ailiu.online, is where the things I've made live. Come have a look."
        },
        statusLabel: { zh: "进行中 · 持续分享", en: "Ongoing · still sharing" },
        statusClass: "is-ai",
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
      disclosure: null,
      mobileFallback: "portrait-stack"
    }

  ]
};
