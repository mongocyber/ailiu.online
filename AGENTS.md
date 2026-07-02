# AGENTS.md — ailiu.online

owner 的个人作品集网站（React 19 + Vite + TS）。本文件是项目长期规则；当前状态见
[`docs/ai/PROJECT_CONTEXT.md`](docs/ai/PROJECT_CONTEXT.md)。本项目由 **Cap（AI CTO）** 托管交付。

## 命令

```bash
npm run dev      # 本地开发（http://localhost:5173）
npm run build    # 类型检查 + 生产构建（tsc -b && vite build）→ dist/
npm run lint     # oxlint
npm run preview  # 预览生产构建
```

需 Node 20+。

## 架构（改之前先读）

- `src/content.ts` —— **所有文案与项目数据的唯一来源**。改内容只动这里。
- `src/styles.css` —— 设计令牌（CSS 变量）+ 全部组件样式 + 响应式（移动断点 `820px`）。
- `src/components/Gallery.tsx` —— 画廊编排 + 导航 + 揭示/视差动效（桌面横向 / 移动纵向）。
- `src/components/{DetailOverlay,Chrome,Cursor,Lightbox,Placeholder,Rich}.tsx`、`src/components/panels/*`。

## 约定

1. **先复用再造**：照搬既有组件/令牌/命名，别引第三方动画库或 UI 框架。
2. **数据驱动**：能放 `content.ts` 的就别硬编码进组件。
3. **小 diff、聚焦**：一个改动一件事，不顺手大重构或格式化无关文件。
4. **动效用 rAF + setInterval 看门狗，不用 CSS 过渡**——见 PROJECT_CONTEXT「坑」。

## 完成的定义（done = 真门禁绿）

每次实现完：`npm run lint` + `npm run build` 真跑过绿；前端改动用浏览器/预览截图核对（PC + 移动两端）。合并前中高风险改动跑 `/code-review`，必要时 `$vet` 跨模型复审。
用 `python3 ~/.Codex/skills/cap/scripts/cap_facts.py --project-root .` 取 git/CI 真实状态。

## 边界（硬停，必须先问 owner）

部署上线 / 接入 `ailiu.online` 域名 / 对外公开 / 新外部服务（访问统计、监控、表单后端）/ 新依赖 / 写入真实联系方式或隐私内容 / 删除重置。
授权分档（read → write → push → merge → release），每档单独授权，不自动顺延。生产动作永远 owner 人工签字。
