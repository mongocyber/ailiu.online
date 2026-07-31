# ailiu.online — 个人作品集

设计师 / AI Builder 的个人作品展示网站。一个**横向画廊式**的沉浸体验：滚轮 / 拖拽 / 方向键在 5 个全屏面板间横向切换，每个项目可点进**全屏纵向详情页**。整体走极简瑞士风、白色背景、克制的电光靛蓝强调色。

> Design. Build. Create.

## ✨ 特性

- **横向画廊** — 5 个面板（Hero / About / Aviso / 小姨家 / Contact），滚轮、拖拽、方向键、导航圆点皆可切换，桌面端横向平滑浏览。
- **滚动驱动动效** — 面板内元素随进度错峰淡入上浮，大序号数字水平视差。
- **项目详情页** — 从底部滑入的全屏纵向详情（概述 / 核心功能 / 界面一览），`Esc` 或返回键关闭。
- **可抓取作品页** — 构建时生成 `/projects/aviso/index.html`、`/projects/xiaoyi/index.html`，首页仍保留沉浸式 overlay 浏览。
- **SEO / GEO 基础** — canonical、Open Graph、Twitter Card、JSON-LD、`robots.txt`、`sitemap.xml`、`llms.txt`。
- **访问统计（本地候选）** — Vercel Web Analytics 基础 pageview 代码已接入，尚未合入或部署；仅在经 owner 批准的生产部署后采集，不补录历史数据。
- **自定义光标** — 仅在精确指针设备上启用，悬停交互元素时放大。
- **完整响应式** — 桌面端为横向画廊；移动端自动切换为纵向堆叠、单列布局、触摸友好，并隐藏自定义光标。
- **可访问性** — 尊重 `prefers-reduced-motion`；无 JS 时内容仍完整可见；详情层和灯箱使用 modal 语义与焦点隔离。

## 🧱 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 构建
- 无第三方动画库，核心动效由 `requestAnimationFrame` 驱动
- 字体：Schibsted Grotesk（标题/UI）与 Space Mono（技术信息）本地托管；中文使用系统字体栈

## 🚀 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（默认 http://localhost:5173）
npm run build    # 类型检查 + 生产构建到 dist/
npm run preview  # 本地预览生产构建
npm run lint     # oxlint 检查
```

需要 Node.js 20+。

## 📁 项目结构

```
src/
├── App.tsx                 # 编排：模式判定、详情开关、全局副作用
├── content.ts              # 所有文案与两个项目的结构化数据（在这里改内容）
├── seo.ts                  # canonical / Open Graph / 项目 URL 元数据
├── styles.css              # 设计令牌 + 全部组件样式 + 响应式
├── portfolio-context.ts    # 打开/关闭详情页的 React Context
├── hooks/useMediaQuery.ts
└── components/
    ├── Cursor.tsx          # 自定义光标（桌面端）
    ├── Chrome.tsx          # 持久 UI：wordmark / 索引 / 圆点 / 进度条
    ├── Gallery.tsx         # 横向画廊（桌面）/ 纵向堆叠（移动）+ 导航逻辑
    ├── DetailOverlay.tsx   # 项目详情页 overlay
    ├── ProjectPage.tsx     # 可直接访问的项目详情 URL
    ├── Placeholder.tsx     # 条纹占位图块
    ├── Rich.tsx            # 带「占位」弱化注释的富文本
    └── panels/             # Hero / About / Work / Contact 面板内容
```

## ✏️ 公开内容确认

当前内容已经换成真实项目资料与图片；公开内容调整前仍需 owner 最后确认：

- **联系方式** — `src/content.ts` 中公开邮箱与 GitHub 是否可以对外展示。
- **项目外链** — Aviso 官网链接是否按当前地址公开。
- **图片授权** — Aviso 截图与小姨家品牌图是否允许放到公开站点。
- **项目状态** — 小姨家标注“已结束”，是否符合当前公开口径。

## 部署

Production 已部署在 [Vercel](https://vercel.com/)：

- 生产域名：`https://ailiu.online`
- `www.ailiu.online` 永久重定向到 `ailiu.online`
- Vercel 项目：`jonyliu-projects/ailiu.online`

当前 `vercel.json` 已包含：

- 安全响应头：CSP、frame 防护、`nosniff`、Referrer Policy、Permissions Policy。
- `www.ailiu.online` → `ailiu.online` 的永久重定向。
- `/projects/aviso`、`/projects/xiaoyi` → 对应静态项目页 HTML，用于直接访问项目详情页。

DNS 当前由火山引擎 nameserver 托管；生产站点可访问，但 Vercel 控制台仍建议在 DNS provider 设置 apex `A ailiu.online 76.76.21.21`，或切 nameserver 到 Vercel。

上线后需要在 Google Search Console 提交 `https://ailiu.online/sitemap.xml`，并用 URL Inspection 检查首页和两个项目页。

---

设计稿为高保真还原；交互参数均按设计交付文档实现。
