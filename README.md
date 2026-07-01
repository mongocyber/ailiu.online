# ailiu.online — 个人作品集

设计师 / AI Builder 的个人作品展示网站。一个**横向画廊式**的沉浸体验：滚轮 / 拖拽 / 方向键在 5 个全屏面板间横向切换，每个项目可点进**全屏纵向详情页**。整体走极简瑞士风、白色背景、克制的电光靛蓝强调色。

> Design. Build. Create.

## ✨ 特性

- **横向画廊** — 5 个面板（Hero / About / Aviso / 小姨家 / Contact），滚轮、拖拽、方向键、导航圆点皆可切换，桌面端横向平滑浏览。
- **滚动驱动动效** — 面板内元素随进度错峰淡入上浮，大序号数字水平视差。
- **项目详情页** — 从底部滑入的全屏纵向详情（概述 / 核心功能 / 界面一览），`Esc` 或返回键关闭。
- **自定义光标** — 仅在精确指针设备上启用，悬停交互元素时放大。
- **完整响应式** — 桌面端为横向画廊；移动端自动切换为纵向堆叠、单列布局、触摸友好，并隐藏自定义光标。
- **可访问性** — 尊重 `prefers-reduced-motion`；无 JS 时内容仍完整可见。

## 🧱 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 构建
- 无第三方动画库，核心动效由 `requestAnimationFrame` 驱动
- 字体：Schibsted Grotesk（标题/UI）、Space Mono（技术信息）、Noto Sans SC（中文正文），来自 Google Fonts

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
├── styles.css              # 设计令牌 + 全部组件样式 + 响应式
├── portfolio-context.ts    # 打开/关闭详情页的 React Context
├── hooks/useMediaQuery.ts
└── components/
    ├── Cursor.tsx          # 自定义光标（桌面端）
    ├── Chrome.tsx          # 持久 UI：wordmark / 索引 / 圆点 / 进度条
    ├── Gallery.tsx         # 横向画廊（桌面）/ 纵向堆叠（移动）+ 导航逻辑
    ├── DetailOverlay.tsx   # 项目详情页 overlay
    ├── Placeholder.tsx     # 条纹占位图块
    ├── Rich.tsx            # 带「占位」弱化注释的富文本
    └── panels/             # Hero / About / Work / Contact 面板内容
```

## ✏️ 上线前确认

当前内容已经换成真实项目资料与图片；公开上线前仍需 owner 最后确认：

- **联系方式** — `src/content.ts` 中公开邮箱与 GitHub 是否可以对外展示。
- **项目外链** — Aviso 官网链接是否按当前地址公开。
- **图片授权** — Aviso 截图与小姨家品牌图是否允许放到公开站点。
- **项目状态** — 小姨家标注“已结束”，是否符合当前公开口径。

## 部署

任意静态托管均可（构建产物在 `dist/`）。推荐连接本仓库到 [Vercel](https://vercel.com/) 或 [Netlify](https://www.netlify.com/) 自动构建部署，框架预设选择 Vite 即可。

---

设计稿为高保真还原；交互参数均按设计交付文档实现。
