// =============================================================================
// Localized site content. Components render copy from this single source.
// =============================================================================

export type Locale = 'en' | 'zh'
export type ProjectKey = 'aviso' | 'xiaoyi'

export const BRAND = 'ailiu'
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALES: Locale[] = ['en', 'zh']
export const PROJECT_KEYS: ProjectKey[] = ['aviso', 'xiaoyi']

export interface LanguageOptionCopy {
  shortLabel: string
}

export const LANGUAGE_OPTIONS = {
  en: { shortLabel: 'EN' },
  zh: { shortLabel: '中文' },
} satisfies Record<Locale, LanguageOptionCopy>

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
  alt: string
  /** CSS aspect-ratio value, e.g. '4 / 3'. */
  aspect: string
  /** Spans both columns on desktop. */
  wide?: boolean
  /** Real image under /public. Omit to render a striped fallback. */
  src?: string
}

export interface Project {
  key: ProjectKey
  /** Identity color (sage for Aviso, terracotta for Xiao Yi Jia). */
  accent: string
  /** Big faint backdrop number, e.g. '01'. */
  bignum: string
  /** Which side the cover image sits on at desktop width. */
  imageSide: 'left' | 'right'

  // -- panel (gallery card) --
  eyebrow: string
  name: string
  subtitle: string
  desc: RichText
  tags?: string[]
  cover: string
  coverAlt: string
  coverImage?: string
  coverAspect?: string

  // -- detail overlay / standalone page --
  detailEyebrow: string
  detailSubtitle: string
  lead: RichText
  meta: MetaItem[]
  coverCaption: string
  detailCoverAlt: string
  detailCoverImage?: string
  detailCoverAspect?: string
  overviewTitle: string[]
  overviewBody: RichText[]
  listKicker: string
  features: FeatureItem[]
  galleryKicker: string
  gallery: GalleryItem[]
  externalUrl?: string
  externalLabel?: string

  // -- search and sharing --
  seoTitle: string
  seoDescription: string
}

export interface UiCopy {
  languageSwitcherLabel: string
  englishLanguage: string
  chineseLanguage: string
  currentLanguage: string
  switchToLanguage: (language: string) => string
  panelLabel: (index: number) => string
  scroll: string
  scrollDrag: string
  viewCase: string
  enterProject: (name: string) => string
  back: string
  backToPortfolio: string
  homeLabel: string
  overviewKicker: string
  zoomProject: (name: string) => string
  zoomImage: (caption: string) => string
  imagePreview: string
  closeImage: string
  nextProject: (name: string) => string
  previousProject: (name: string) => string
}

export interface HeroCopy {
  kicker: string
  titleLines: string[]
  titleAccent: string
  lead: string
  coords: string[]
}

export interface AboutCopy {
  tag: string
  titleLines: string[]
  titleAccent: string
  sub: string
  para: string
  capabilities: { label: string; descriptor: string }[]
}

export interface ContactCopy {
  kicker: string
  titleLines: string[]
  titleAccent: string
  lead: string
  links: { label: string; value: string; href: string }[]
  footerLeft: string
  footerRight: string
}

export interface SeoCopy {
  homeTitle: string
  homeDescription: string
  homeImageAlt: string
  jobTitle: string
  portfolioName: string
}

export interface SiteContent {
  ui: UiCopy
  hero: HeroCopy
  about: AboutCopy
  contact: ContactCopy
  projects: Project[]
  seo: SeoCopy
}

const contactLinks = [
  { label: 'EMAIL', value: 'liuliu8765@gmail.com', href: 'mailto:liuliu8765@gmail.com' },
  { label: 'GITHUB', value: '@mongocyber', href: 'https://github.com/mongocyber' },
]

const englishProjects: Project[] = [
  {
    key: 'aviso',
    accent: '#6F8A5B',
    bignum: '01',
    imageSide: 'right',
    eyebrow: 'WORK 01 — CHROME EXTENSION · PRODUCT',
    name: 'Aviso',
    subtitle: 'IN-PAGE AI, ON YOUR TERMS',
    desc: {
      text: 'A Chrome extension that brings AI into the page you are already using. Open a command palette with a shortcut, then explain, translate, rewrite, or summarize in place. Responses appear beside the source—no tab switching, no copy and paste. Direct BYOK connections keep the privacy boundary inside the product.',
    },
    tags: ['Command palette', 'Selection toolbar', 'Context menu', 'Direct BYOK'],
    cover: 'Product interface',
    coverAlt: 'Aviso command palette and in-page AI response interface',
    coverImage: '/aviso/aviso-product.jpg',
    coverAspect: '1512 / 1120',
    detailEyebrow: 'WORK 01 · CHROME EXTENSION',
    detailSubtitle: 'In-page AI, on your terms.',
    lead: {
      text: 'Aviso brings AI into the page without breaking the flow of reading or working. A single shortcut opens the command palette to search local history and bookmarks or send a question to AI. The answer appears beside the source, ready to copy, save, or continue.',
    },
    meta: [
      { k: 'ROLE', v: 'Product / Design / Engineering' },
      { k: 'YEAR', v: '2026' },
      { k: 'PLATFORM', v: 'Chrome desktop' },
      { k: 'STATUS', v: 'Internal testing · v0.3' },
    ],
    coverCaption: 'Command palette and selection toolbar',
    detailCoverAlt: 'Aviso command palette beside an in-page AI conversation',
    detailCoverImage: '/aviso/aviso-detail.jpg',
    overviewTitle: ['AI, right where', 'the work is', 'happening'],
    overviewBody: [
      {
        text: 'Most AI assistants make you leave the page, switch tabs, and move context by hand. Aviso works the other way around: it fits into familiar actions—keyboard shortcuts, selected text, and the context menu—so help is available at the moment it is useful.',
      },
      {
        text: 'The in-page panel is the primary result space. Responses stream in, can be copied or saved, and support follow-up questions. Saved conversations stay in local history and can be reopened from the command palette.',
      },
    ],
    listKicker: '02 / CORE FEATURES',
    features: [
      {
        no: '01',
        title: 'Command palette',
        desc: 'Open it anywhere with ⌘⇧Space to search local history, bookmarks, and previous AI conversations. If there are no local results, press Enter to ask AI directly.',
      },
      {
        no: '02',
        title: 'Selection toolbar',
        desc: 'Select text on any page to reveal focused actions for explaining, translating, rewriting, and summarizing in place.',
      },
      {
        no: '03',
        title: 'Direct BYOK access',
        desc: 'Use your own API key and connect the browser directly to approved model providers, without a required Aviso account or proxy backend.',
      },
      {
        no: '04',
        title: 'Privacy by construction',
        desc: 'No telemetry and no third-party analytics. API keys are encrypted locally, conversation history stays in the browser, and every data path has a clear boundary.',
      },
    ],
    galleryKicker: '03 / INTERFACE',
    gallery: [
      {
        caption: 'Command palette',
        alt: 'Aviso command palette showing local results and AI actions',
        aspect: '1448 / 1086',
        src: '/aviso/aviso-command-panel.png',
      },
      {
        caption: 'In-page conversation',
        alt: 'Aviso AI conversation floating beside the source webpage',
        aspect: '1448 / 1086',
        src: '/aviso/aviso-chat-dialog.png',
      },
      {
        caption: 'Model and privacy settings',
        alt: 'Aviso settings for model providers, API keys, and local privacy controls',
        aspect: '1672 / 941',
        wide: true,
        src: '/aviso/aviso-model-privacy.png',
      },
    ],
    externalUrl: 'https://aviso-nine.vercel.app/',
    externalLabel: 'VISIT AVISO',
    seoTitle: 'Aviso — In-Page AI Chrome Extension | ailiu',
    seoDescription:
      'Aviso is a privacy-conscious Chrome extension for in-page AI commands, selected-text actions, local history, and direct BYOK model access.',
  },
  {
    key: 'xiaoyi',
    accent: '#C8643C',
    bignum: '02',
    imageSide: 'left',
    eyebrow: 'WORK 02 — FOOD & BEVERAGE · BRAND',
    name: 'Antis Home',
    subtitle: 'A TASTE OF HOME',
    desc: {
      text: 'A food-and-beverage brand built from the ground up around the feeling of home. Naming, identity, spatial touchpoints, menus, and packaging come together as one warm, recognizable system.',
    },
    cover: 'Brand key visual',
    coverAlt: 'Antis Home restaurant identity applied across signs, menus, and packaging',
    coverImage: '/xiaoyi/xiaoyi-cover.png',
    coverAspect: '1512 / 1120',
    detailEyebrow: 'WORK 02 · F&B BRAND',
    detailSubtitle: 'Antis Home — a taste of home.',
    lead: {
      text: 'Antis Home is a food-and-beverage venture shaped from zero to one around a simple promise: food that feels like home. The project turns familiarity, warmth, and ease into a brand language that can work in the real world.',
    },
    meta: [
      { k: 'ROLE', v: 'Brand / Visual Design' },
      { k: 'YEAR', v: '2024' },
      { k: 'TYPE', v: 'Brand system' },
      { k: 'STATUS', v: 'Ended' },
    ],
    coverCaption: 'Brand key visual and identity applications',
    detailCoverAlt: 'Antis Home terracotta identity shown across restaurant brand applications',
    detailCoverImage: '/xiaoyi/xiaoyi-detail-cover.png',
    detailCoverAspect: '1686 / 933',
    overviewTitle: ['From a name', 'to a flavor', 'people remember'],
    overviewBody: [
      {
        text: 'The name Antis Home is meant to feel close and unforced—like arriving at Your Antis Place for a warm meal. Every brand decision begins with that emotional brief.',
      },
      {
        text: 'Naming, marks, color, typography, menus, packaging, space, and wayfinding were designed as one coherent system, giving the brand a recognizable voice at every customer touchpoint.',
      },
    ],
    listKicker: '02 / BRAND DELIVERABLES',
    features: [
      {
        no: '01',
        title: 'Naming and marks',
        desc: 'Brand naming, bilingual marks, and a supporting graphic system.',
      },
      {
        no: '02',
        title: 'Color and typography',
        desc: 'A warm core palette and typographic rules that connect physical and digital touchpoints.',
      },
      {
        no: '03',
        title: 'Menus and packaging',
        desc: 'Menu layouts and a consistent visual system for dine-in and takeaway packaging.',
      },
      {
        no: '04',
        title: 'Space and wayfinding',
        desc: 'A spatial mood and navigation system that carry the brand into the restaurant experience.',
      },
    ],
    galleryKicker: '03 / VISUAL SYSTEM',
    gallery: [
      {
        caption: 'Brand key visual',
        alt: 'Antis Home terracotta key visual and original bilingual wordmark',
        aspect: '1686 / 933',
        wide: true,
        src: '/xiaoyi/xiaoyi-main-visual.png',
      },
      {
        caption: 'Packaging applications',
        alt: 'Antis Home takeaway packaging in the terracotta brand system',
        aspect: '4 / 3',
        src: '/xiaoyi/xiaoyi-packaging.png',
      },
      {
        caption: 'Menus and printed materials',
        alt: 'Antis Home menus and printed restaurant materials',
        aspect: '4 / 3',
        src: '/xiaoyi/xiaoyi-menu-materials.png',
      },
    ],
    seoTitle: 'Antis Home — Food & Beverage Brand Identity | ailiu',
    seoDescription:
      'Antis Home is a food-and-beverage identity project spanning naming, visual language, menus, packaging, space, and wayfinding.',
  },
]

const chineseProjects: Project[] = [
  {
    key: 'aviso',
    accent: '#6F8A5B',
    bignum: '01',
    imageSide: 'right',
    eyebrow: '项目 01 — Chrome 扩展 · 产品',
    name: 'Aviso',
    subtitle: '页面内 AI，由你掌控',
    desc: {
      text: '一个在你正看的网页里就地调用 AI 的 Chrome 扩展。快捷键唤起命令面板，解释、翻译、润色、总结，结果浮在原文旁边——不跳转、不复制粘贴。BYOK 默认直连模型厂商，隐私边界写进实现本身。',
    },
    tags: ['命令面板', '划词工具栏', '右键菜单', 'BYOK 直连'],
    cover: '产品界面',
    coverAlt: 'Aviso 命令面板与页面内 AI 对话界面',
    coverImage: '/aviso/aviso-product.jpg',
    coverAspect: '1512 / 1120',
    detailEyebrow: '项目 01 · CHROME 扩展',
    detailSubtitle: '页面内 AI，由你掌控。',
    lead: {
      text: '在你正看的网页里就地调用 AI，不打断当前的阅读与工作。一个快捷键唤起命令面板，搜索本地历史与书签，或把问题直接交给 AI——结果浮在原文旁边，不跳转、不复制粘贴。',
    },
    meta: [
      { k: '角色', v: '产品 / 设计 / 开发' },
      { k: '年份', v: '2026' },
      { k: '平台', v: 'Chrome 桌面版' },
      { k: '状态', v: '内部试用 · v0.3' },
    ],
    coverCaption: '命令面板与划词工具栏主视图',
    detailCoverAlt: 'Aviso 命令面板与页面内 AI 对话并排显示',
    detailCoverImage: '/aviso/aviso-detail.jpg',
    overviewTitle: ['把 AI 放回', '你需要它的', '那一刻'],
    overviewBody: [
      {
        text: '大多数 AI 助手要求你离开当前页面、切换标签、复制粘贴。Aviso 反过来——它接进你已有的习惯：右键、划词、快捷键，你顺手怎么用都行。需要的那一刻，从哪都能叫出它。',
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
        desc: '⌘⇧Space 随处唤起，搜索本地历史、书签与过往 AI 对话；没有结果时回车直接交给 AI。',
      },
      {
        no: '02',
        title: '划词工具栏',
        desc: '选中网页文字，轻量工具栏就地浮出——解释、翻译、润色、总结一键直达。',
      },
      {
        no: '03',
        title: 'BYOK 默认直连',
        desc: '使用自己的 API Key，浏览器直连已批准的模型厂商，不强制登录，也不经过 Aviso 后端。',
      },
      {
        no: '04',
        title: '隐私边界写进实现',
        desc: '无遥测、无第三方分析；API Key 本地加密，对话历史只存在浏览器里。每条数据路径都有清楚边界。',
      },
    ],
    galleryKicker: '03 / 界面一览',
    gallery: [
      {
        caption: '命令面板',
        alt: 'Aviso 命令面板中的本地搜索结果与 AI 操作',
        aspect: '1448 / 1086',
        src: '/aviso/aviso-command-panel.png',
      },
      {
        caption: '页面内对话',
        alt: 'Aviso AI 对话浮在原网页内容旁边',
        aspect: '1448 / 1086',
        src: '/aviso/aviso-chat-dialog.png',
      },
      {
        caption: '模型与隐私设置',
        alt: 'Aviso 模型厂商、API Key 与本地隐私控制设置',
        aspect: '1672 / 941',
        wide: true,
        src: '/aviso/aviso-model-privacy.png',
      },
    ],
    externalUrl: 'https://aviso-nine.vercel.app/',
    externalLabel: '访问 AVISO 官网',
    seoTitle: 'Aviso — 页面内 AI Chrome 扩展 | ailiu',
    seoDescription:
      'Aviso 是一款注重隐私的 Chrome 扩展，提供页面内 AI 命令、划词操作、本地历史与 BYOK 模型直连。',
  },
  {
    key: 'xiaoyi',
    accent: '#C8643C',
    bignum: '02',
    imageSide: 'left',
    eyebrow: '项目 02 — 餐饮创业 · 品牌',
    name: '小姨家',
    subtitle: '家的味道',
    desc: {
      text: '一个从 0 到 1 的餐饮品牌创业项目。围绕“家的味道”展开——从命名、标志、视觉系统到空间与包装，建立一套温暖、可被记住的品牌语言。',
    },
    cover: '品牌主视觉',
    coverAlt: '小姨家餐饮品牌在招牌、菜单与包装上的视觉应用',
    coverImage: '/xiaoyi/xiaoyi-cover.png',
    coverAspect: '1512 / 1120',
    detailEyebrow: '项目 02 · 餐饮品牌',
    detailSubtitle: '小姨家——家的味道。',
    lead: {
      text: '一个从 0 到 1 的餐饮品牌创业项目，围绕“家的味道”展开。把熟悉、温暖、可被记住的体验，变成一套能真正落地的品牌语言。',
    },
    meta: [
      { k: '角色', v: '品牌 / 视觉设计' },
      { k: '年份', v: '2024' },
      { k: '类型', v: '品牌系统' },
      { k: '状态', v: '已结束' },
    ],
    coverCaption: '品牌主视觉与标志应用',
    detailCoverAlt: '小姨家陶土色品牌系统在餐饮场景中的应用',
    detailCoverImage: '/xiaoyi/xiaoyi-detail-cover.png',
    detailCoverAspect: '1686 / 933',
    overviewTitle: ['从一个名字，', '到一种', '被记住的味道'],
    overviewBody: [
      {
        text: '“小姨家”想传达的是一种亲近感——像去亲戚家吃饭那样，自在、热乎、不拘束。品牌的所有决定都围绕这一句感受展开。',
      },
      {
        text: '从命名、标志、色彩与字体，到菜单、包装与空间，建立一套统一而有温度的视觉系统，让顾客在每个触点都能认出它。',
      },
    ],
    listKicker: '02 / 品牌交付',
    features: [
      { no: '01', title: '命名与标志', desc: '品牌命名、中英文标志与辅助图形系统。' },
      { no: '02', title: '色彩与字体', desc: '温暖基调的主色与字体规范，统一线上与线下触点。' },
      { no: '03', title: '菜单与包装', desc: '菜单版式、外卖与堂食包装的视觉应用。' },
      { no: '04', title: '空间与导视', desc: '门店空间氛围与导视系统设计。' },
    ],
    galleryKicker: '03 / 视觉一览',
    gallery: [
      {
        caption: '品牌主视觉',
        alt: '小姨家陶土色主视觉与原始中英文标志',
        aspect: '1686 / 933',
        wide: true,
        src: '/xiaoyi/xiaoyi-main-visual.png',
      },
      {
        caption: '包装应用',
        alt: '小姨家陶土色品牌系统的外卖包装',
        aspect: '4 / 3',
        src: '/xiaoyi/xiaoyi-packaging.png',
      },
      {
        caption: '菜单与物料',
        alt: '小姨家菜单与餐厅印刷物料',
        aspect: '4 / 3',
        src: '/xiaoyi/xiaoyi-menu-materials.png',
      },
    ],
    seoTitle: '小姨家 — 餐饮品牌设计案例 | ailiu',
    seoDescription:
      '小姨家是一个从命名、视觉语言到菜单、包装、空间与导视的完整餐饮品牌设计项目。',
  },
]

export const contentByLocale: Record<Locale, SiteContent> = {
  en: {
    ui: {
      languageSwitcherLabel: 'Language',
      englishLanguage: 'English',
      chineseLanguage: 'Chinese',
      currentLanguage: 'current language',
      switchToLanguage: (language) => `Switch to ${language}`,
      panelLabel: (index) => `Go to panel ${index}`,
      scroll: 'SCROLL',
      scrollDrag: 'SCROLL / DRAG',
      viewCase: 'VIEW CASE',
      enterProject: (name) => `Open the ${name} case study`,
      back: 'BACK',
      backToPortfolio: 'BACK TO PORTFOLIO',
      homeLabel: `${BRAND} home`,
      overviewKicker: '01 / OVERVIEW',
      zoomProject: (name) => `Enlarge the ${name} project image`,
      zoomImage: (caption) => `Enlarge ${caption}`,
      imagePreview: 'Image preview',
      closeImage: 'Close image preview',
      nextProject: (name) => `NEXT PROJECT — ${name} →`,
      previousProject: (name) => `PREVIOUS PROJECT — ${name} →`,
    },
    hero: {
      kicker: 'DESIGNER · AI BUILDER · CREATOR',
      titleLines: ['Design.', 'Build.'],
      titleAccent: 'Create.',
      lead: 'I design and build products where brand, interface, and AI meet—turning early ideas into clear, polished experiences people can actually use.',
      coords: ['47.6°N  PORTFOLIO SITE', 'DESIGN · BUILD', 'v 1.0 — 2026'],
    },
    about: {
      tag: '( ABOUT / 02 OF 05 )',
      titleLines: ['Design and AI', 'are the same'],
      titleAccent: 'material.',
      sub: 'DESIGN & CODE — ONE MATERIAL',
      para: 'I care about more than how an interface looks; I care about the full journey of a product, from concept and form to implementation. Design creates order, and AI accelerates execution—so ideas can quickly become things people can use, give feedback on, and iterate.',
      capabilities: [
        { label: 'Brand & identity', descriptor: 'SYSTEMS / EXPRESSION' },
        { label: 'Product & interface', descriptor: 'PRODUCT / UI' },
        { label: 'AI-assisted building', descriptor: 'AI / VIBE CODING' },
        { label: 'Prototype & ship', descriptor: 'PROTOTYPE / DELIVERY' },
      ],
    },
    contact: {
      kicker: '( 05 / 05 · CONTACT )',
      titleLines: ["Let's build"],
      titleAccent: 'something good.',
      lead: 'Have an idea, a collaboration in mind, or simply want to talk about design and AI? Get in touch. More work is already on the way.',
      links: contactLinks,
      footerLeft: '© 2026 — PERSONAL PORTFOLIO',
      footerRight: 'MADE WITH DESIGN & AI',
    },
    projects: englishProjects,
    seo: {
      homeTitle: 'ailiu — Designer & AI Builder Portfolio',
      homeDescription:
        'The portfolio of a designer and AI builder creating thoughtful brands, interfaces, and working AI products from early ideas.',
      homeImageAlt: 'Aviso product interface featured in the ailiu portfolio',
      jobTitle: 'Designer & AI Builder',
      portfolioName: 'ailiu portfolio projects',
    },
  },
  zh: {
    ui: {
      languageSwitcherLabel: '语言',
      englishLanguage: '英文',
      chineseLanguage: '中文',
      currentLanguage: '当前语言',
      switchToLanguage: (language) => `切换到${language}`,
      panelLabel: (index) => `跳转到第 ${index} 屏`,
      scroll: '滚动',
      scrollDrag: '滚动 / 拖拽',
      viewCase: '查看项目',
      enterProject: (name) => `进入 ${name} 项目案例`,
      back: '返回',
      backToPortfolio: '返回作品集',
      homeLabel: `${BRAND} 首页`,
      overviewKicker: '01 / 概述',
      zoomProject: (name) => `放大查看 ${name} 项目图片`,
      zoomImage: (caption) => `放大查看${caption}`,
      imagePreview: '图片预览',
      closeImage: '关闭图片预览',
      nextProject: (name) => `下一个项目 — ${name} →`,
      previousProject: (name) => `上一个项目 — ${name} →`,
    },
    hero: {
      kicker: '设计师 · AI 构建者 · 创作者',
      titleLines: ['设计。', '构建。'],
      titleAccent: '创造。',
      lead: '我是一名设计师与 AI 构建者，在品牌、界面与 AI 的交汇处工作，把模糊的想法做成清晰、有设计感、真正能被使用的产品。',
      coords: ['47.6°N  个人作品集', '设计 · 构建', '版本 1.0 — 2026'],
    },
    about: {
      tag: '( 关于 / 第 02 屏，共 05 屏 )',
      titleLines: ['设计与 AI，', '是同一种'],
      titleAccent: '材料。',
      sub: '设计与代码——同一种材料',
      para: '我关注的不只是界面好不好看，而是一个产品从概念、形态到落地的完整过程。用设计建立秩序，用 AI 加速实现——让想法尽快变成可以被使用、被反馈、被迭代的东西。',
      capabilities: [
        { label: '品牌与视觉', descriptor: '品牌 / 识别系统' },
        { label: '产品与界面', descriptor: '产品 / UI' },
        { label: 'AI 辅助构建', descriptor: 'AI / VIBE CODING' },
        { label: '原型与落地', descriptor: '原型 / 交付' },
      ],
    },
    contact: {
      kicker: '( 第 05 屏，共 05 屏 · 联系 )',
      titleLines: ['一起做点'],
      titleAccent: '真正有用的。',
      lead: '有想法、想合作，或只是想聊聊设计与 AI——随时找我。更多项目正在路上。',
      links: contactLinks,
      footerLeft: '© 2026 — 个人作品集',
      footerRight: '由设计与 AI 共同完成',
    },
    projects: chineseProjects,
    seo: {
      homeTitle: 'ailiu — 设计师与 AI 构建者作品集',
      homeDescription:
        '设计师与 AI 构建者 ailiu 的个人作品集，展示从早期想法到品牌、界面与可运行 AI 产品的完整实践。',
      homeImageAlt: 'ailiu 作品集中的 Aviso 产品界面',
      jobTitle: '设计师与 AI 构建者',
      portfolioName: 'ailiu 作品项目',
    },
  },
}

export function getContent(locale: Locale): SiteContent {
  return contentByLocale[locale]
}

export function getProject(locale: Locale, key: ProjectKey): Project {
  const project = contentByLocale[locale].projects.find((item) => item.key === key)
  if (!project) throw new Error(`Missing project content for ${locale}/${key}`)
  return project
}

/** Total number of horizontal panels (Hero, About, 2 × Work, Contact). */
export const PANEL_COUNT = 3 + PROJECT_KEYS.length
