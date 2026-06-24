// =============================================================================
// Site content. Edit text here — components read from this single source.
// Placeholders (name / email / wechat / images) are intentionally generic;
// replace them with real details and assets when ready.
// =============================================================================

export type ProjectKey = 'aviso' | 'xiaoyi'

/** A short rich paragraph: main text plus an optional trailing muted note. */
export interface RichText {
  text: string
  /** Rendered in a faint "ghost" color, appended after `text`. */
  muted?: string
}

export interface MetaItem {
  k: string
  v: string
}

export interface FeatureItem {
  no: string
  title: string
  desc: string
}

export interface GalleryItem {
  caption: string
  /** CSS aspect-ratio value, e.g. '4 / 3'. */
  aspect: string
  /** Spans both columns on desktop. */
  wide?: boolean
}

export interface Project {
  key: ProjectKey
  /** Identity color (sage for Aviso, terracotta for 小姨家). */
  accent: string
  /** Big faint backdrop number, e.g. '01'. */
  bignum: string
  /** Which side the cover image sits on at desktop width. */
  imageSide: 'left' | 'right'

  // -- panel (gallery card) --
  eyebrow: string // e.g. 'WORK 01 — Chrome 扩展 · PRODUCT'
  name: string
  subtitle: string // mono tagline on the card
  desc: RichText
  tags?: string[]
  cover: string // placeholder caption on the card

  // -- detail overlay --
  detailEyebrow: string // e.g. 'WORK 01 · CHROME EXTENSION'
  detailSubtitle: string
  lead: RichText
  meta: MetaItem[]
  coverCaption: string
  overviewTitle: string[] // each entry = one line
  overviewBody: RichText[]
  listKicker: string // '02 / 核心功能' | '02 / 品牌交付'
  features: FeatureItem[]
  galleryKicker: string // '03 / 界面一览' | '03 / 视觉一览'
  gallery: GalleryItem[]
  /** External site (Aviso only). */
  externalUrl?: string
  externalLabel?: string
}

export const BRAND = 'ailiu'

export const hero = {
  kicker: 'DESIGNER · AI BUILDER · CREATOR',
  titleLines: ['Design.', 'Build.'],
  titleAccent: 'Create.',
  lead: '我是一名设计师与 AI Builder。把模糊的想法，做成有设计感、能运行的真实产品 —— 从品牌视觉到 AI 工具。',
  coords: ['47.6°N  VECTOR FIELD', 'FLOW · INTERACTIVE', 'v 1.0 — 2026'],
}

export const about = {
  tag: '( 关于 / ABOUT )',
  titleLines: ['设计与 AI，', '是同一种'],
  titleAccent: '材料。',
  sub: 'DESIGN & CODE — ONE MATERIAL',
  para: '我关注的不只是界面好不好看，而是一个产品从概念、形态到落地的完整过程。用设计建立秩序，用 AI 加速实现 —— 让想法尽快变成可以被使用、被反馈、被迭代的东西。',
  capabilities: [
    { cn: '品牌与视觉', en: 'BRAND / IDENTITY' },
    { cn: '产品与界面', en: 'PRODUCT / UI' },
    { cn: 'AI 编程', en: 'AI / VIBECODING' },
    { cn: '原型与落地', en: 'PROTOTYPE / SHIP' },
  ],
}

export const contact = {
  kicker: '( 04 / 05 · 联系 — CONTACT )',
  titleLines: ["Let's build"],
  titleAccent: 'something good.',
  lead: '有想法、想合作，或只是想聊聊设计与 AI —— 随时找我。更多项目正在路上。',
  links: [
    { label: 'EMAIL', value: 'hello@ailiu.online', href: 'mailto:hello@ailiu.online' },
    { label: 'GITHUB', value: '@mongocyber', href: 'https://github.com/mongocyber' },
    { label: 'WECHAT', value: 'your_id', href: '#' },
  ],
  footerLeft: '© 2026 — 个人作品集',
  footerRight: 'DESIGNED & BUILT WITH AI',
}

export const projects: Project[] = [
  {
    key: 'aviso',
    accent: '#6F8A5B',
    bignum: '01',
    imageSide: 'right',
    eyebrow: 'WORK 01 — Chrome 扩展 · PRODUCT',
    name: 'Aviso',
    subtitle: 'IN-PAGE AI, ON YOUR TERMS',
    desc: {
      text: '一个在你正看的网页里就地调用 AI 的 Chrome 扩展。快捷键唤起命令面板，解释、翻译、润色、总结，结果浮在原文旁边 —— 不跳转、不复制粘贴。BYOK 默认直连模型厂商，隐私边界写进实现本身。',
    },
    tags: ['命令面板', '划词工具栏', '右键菜单', 'BYOK 直连'],
    cover: '产品界面 · IMAGE PLACEHOLDER',
    detailEyebrow: 'WORK 01 · CHROME EXTENSION',
    detailSubtitle: 'In-page AI, on your terms.',
    lead: {
      text: '在你正看的网页里就地调用 AI，不打断当前的阅读与工作。一个快捷键唤起命令面板，搜本地历史与书签，或把问题直接交给 AI —— 结果浮在原文旁边，不跳转、不复制粘贴。',
    },
    meta: [
      { k: 'ROLE', v: '产品 / 设计 / 开发' },
      { k: 'YEAR', v: '2026' },
      { k: 'PLATFORM', v: 'Chrome 桌面版' },
      { k: 'STATUS', v: '内部试用 · v0.3' },
    ],
    coverCaption: '命令面板 / 划词工具栏主视图 · COVER PLACEHOLDER',
    overviewTitle: ['把 AI 放回', '你需要它的', '那一刻'],
    overviewBody: [
      {
        text: '大多数 AI 助手要求你离开当前页面、切换标签、复制粘贴。Aviso 反过来 —— 它接进你已有的习惯：右键、划词、快捷键，你顺手怎么用都行。需要的那一刻，从哪都能叫出它。',
      },
      {
        text: '页面内浮窗是主结果位：内容流式输出，可以复制、保存、继续追问。保存的对话进入本地历史，之后能在命令面板里复用。',
      },
    ],
    listKicker: '02 / 核心功能',
    features: [
      {
        no: '01',
        title: '命令面板',
        desc: '⌘⇧Space 随处唤起，搜本地历史、书签与过往 AI 对话；没有结果时回车直接交给 AI。',
      },
      {
        no: '02',
        title: '划词工具栏',
        desc: '选中网页文字，轻量工具栏就地浮出 —— 解释、翻译、润色、总结一键直达。',
      },
      {
        no: '03',
        title: 'BYOK 默认直连',
        desc: '用自己的 API Key，浏览器直连已批准的模型厂商，不强制登录、不经过 Aviso 后端。',
      },
      {
        no: '04',
        title: '隐私边界写进实现',
        desc: '无遥测、无第三方分析；API Key 本地加密，对话历史只存在浏览器里。每条数据路径都说清楚。',
      },
    ],
    galleryKicker: '03 / 界面一览',
    gallery: [
      { caption: '命令面板 · placeholder', aspect: '4 / 3' },
      { caption: '页面内浮窗 · placeholder', aspect: '4 / 3' },
      { caption: '模型配置 / 隐私设置 · placeholder', aspect: '16 / 9', wide: true },
    ],
    externalUrl: 'https://aviso-nine.vercel.app/',
    externalLabel: '访问官网 VISIT SITE',
  },
  {
    key: 'xiaoyi',
    accent: '#C8643C',
    bignum: '02',
    imageSide: 'left',
    eyebrow: 'WORK 02 — 餐饮品牌创业 · BRAND',
    name: '小姨家',
    subtitle: 'XIAO YI JIA — TASTE OF HOME',
    desc: {
      text: '一个从 0 到 1 的餐饮品牌创业项目。围绕「家的味道」展开 —— 从命名、logo、视觉系统到空间与包装，建立一套温暖、可被记住的品牌语言。',
      muted: '（项目介绍占位，更多细节与成片即将补充。）',
    },
    cover: '品牌主视觉 · IMAGE PLACEHOLDER',
    detailEyebrow: 'WORK 02 · F&B BRAND',
    detailSubtitle: 'Xiao Yi Jia — taste of home.',
    lead: {
      text: '一个从 0 到 1 的餐饮品牌创业项目，围绕「家的味道」展开。把熟悉、温暖、可被记住的体验，变成一套能落地的品牌语言。',
      muted: '（以下为内容占位，正式文案、成片与照片即将补充。）',
    },
    meta: [
      { k: 'ROLE', v: '品牌 / 视觉设计' },
      { k: 'YEAR', v: '2024' },
      { k: 'TYPE', v: '品牌系统' },
      { k: 'STATUS', v: '进行中 · 占位' },
    ],
    coverCaption: '品牌主视觉 / logo 应用 · COVER PLACEHOLDER',
    overviewTitle: ['从一个名字，', '到一种', '被记住的味道'],
    overviewBody: [
      {
        text: '「小姨家」想传达的是一种亲近感 —— 像去亲戚家吃饭那样，自在、热乎、不拘束。品牌的所有决定都围绕这一句感受展开。',
        muted: '（占位文案。）',
      },
      {
        text: '从命名、标志、色彩与字体，到菜单、包装与空间，建立一套统一而有温度的视觉系统，让顾客在每个触点都能认出它。',
        muted: '（占位文案。）',
      },
    ],
    listKicker: '02 / 品牌交付',
    features: [
      { no: '01', title: '命名与标志', desc: '品牌命名、中英文标志与辅助图形系统。（占位）' },
      { no: '02', title: '色彩与字体', desc: '温暖基调的主色与字体规范，统一线上线下。（占位）' },
      { no: '03', title: '菜单与包装', desc: '菜单版式、外卖与堂食包装的视觉应用。（占位）' },
      { no: '04', title: '空间与导视', desc: '门店空间氛围与导视系统设计。（占位）' },
    ],
    galleryKicker: '03 / 视觉一览',
    gallery: [
      { caption: '主视觉海报 · placeholder', aspect: '16 / 9', wide: true },
      { caption: '包装应用 · placeholder', aspect: '4 / 3' },
      { caption: '菜单 / 物料 · placeholder', aspect: '4 / 3' },
    ],
  },
]

export const projectByKey: Record<ProjectKey, Project> = {
  aviso: projects[0],
  xiaoyi: projects[1],
}

/** Total number of horizontal panels (Hero, About, 2 × Work, Contact). */
export const PANEL_COUNT = 3 + projects.length
