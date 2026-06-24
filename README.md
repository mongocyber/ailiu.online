# ailiu.online — 个人作品集

设计师 / AI Builder 的个人作品展示网站。一个**横向画廊式**的沉浸体验：滚轮 / 拖拽 / 方向键在 5 个全屏面板间横向切换，配一张**交互式矢量场背景**（鼠标卷起漩涡），每个项目可点进**全屏纵向详情页**。整体走极简瑞士风、暖米白底、克制的电光靛蓝强调色。

> Design. Build. Create.

## ✨ 特性

- **横向画廊** — 5 个面板（Hero / About / Aviso / 小姨家 / Contact），滚轮、拖拽、方向键、导航圆点皆可切换，停止后自动吸附到最近面板。
- **交互式矢量场背景** — 原生 Canvas + `requestAnimationFrame` 绘制的规整网格流场，鼠标/触摸在半径内卷起漩涡并渐变到强调靛蓝。帧率无关。
- **滚动驱动动效** — 面板内元素随进度错峰淡入上浮，大序号数字水平视差。
- **项目详情页** — 从底部滑入的全屏纵向详情（概述 / 核心功能 / 界面一览），`Esc` 或返回键关闭。
- **自定义光标** — 仅在精确指针设备上启用，悬停交互元素时放大。
- **完整响应式** — 桌面端为横向画廊；移动端自动切换为纵向堆叠、单列布局、触摸友好，并隐藏自定义光标。
- **可访问性** — 尊重 `prefers-reduced-motion`；无 JS 时内容仍完整可见。

## 🧱 技术栈

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 构建
- 原生 Canvas 2D 绘制动态背景，无第三方动画库
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
    ├── VectorField.tsx     # Canvas 矢量场背景
    ├── Cursor.tsx          # 自定义光标（桌面端）
    ├── Chrome.tsx          # 持久 UI：wordmark / 索引 / 圆点 / 进度条
    ├── Gallery.tsx         # 横向画廊（桌面）/ 纵向堆叠（移动）+ 导航逻辑
    ├── DetailOverlay.tsx   # 项目详情页 overlay
    ├── Placeholder.tsx     # 条纹占位图块
    ├── Rich.tsx            # 带「占位」弱化注释的富文本
    └── panels/             # Hero / About / Work / Contact 面板内容
```

## ✏️ 待个性化

当前部分内容为设计稿中的占位，替换为真实信息后即可上线：

- **联系方式** — `src/content.ts` 中的 `contact.links`（EMAIL / WECHAT 目前为占位）。
- **真实图片** — 各 `Placeholder` 占位块，替换为同尺寸的真实图（产品截图、品牌主视觉等）。
- **小姨家项目文案** — 详情中标注「占位」的段落，待补充正式文案与成片。

## 部署

任意静态托管均可（构建产物在 `dist/`）。推荐连接本仓库到 [Vercel](https://vercel.com/) 或 [Netlify](https://www.netlify.com/) 自动构建部署，框架预设选择 Vite 即可。

---

设计稿为高保真还原；动态背景方案与交互参数均按设计交付文档实现。
