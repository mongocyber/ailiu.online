# PROJECT_CONTEXT — ailiu.online

> 项目胶囊（保持瘦，≤120 行）。事实用 `scripts/cap_facts.py` 采集，不靠记忆。
> 最近更新：2026-07-01

## 是什么

`ailiu.online` —— owner（设计师 / AI Builder）的**个人作品集网站**。横向画廊式沉浸体验：5 个全屏面板（Hero / About / Aviso / 小姨家 / Contact）+ 每个项目可点进的全屏详情页。极简瑞士风、白色背景、电光靛蓝强调色。

## 技术栈

- React 19 + TypeScript + Vite 8（构建）
- 无第三方动画库，核心动效由 `requestAnimationFrame` 驱动
- oxlint 做 lint；Google Fonts（Schibsted Grotesk / Space Mono / Noto Sans SC）

## 当前状态（截至 2026-07-01）

- 代码已完成；当前本地门禁需以最新 `npm run lint`、`npm run build` 和 PC / 移动预览截图为准。
- 仓库：`github.com/mongocyber/ailiu.online`（**私有**），默认分支 `main`。
- **尚未部署**。目标域名 `ailiu.online`（与仓库同名，owner 已持有该域名待接入）。
- Aviso 和小姨家详情页已用当前真实项目资料与图片替换占位内容。

## 验证骨架（spine）

| 检查 | 状态 |
| --- | --- |
| lint (`npm run lint`) | ✅ |
| typecheck + build (`npm run build` = `tsc -b && vite build`) | ✅ |
| CI（GitHub Actions） | ⬜ 暂未启用（本次发布先走本地 lint/build + Vercel 部署） |
| 自动化测试 | ⬜ 暂无（展示型站点，P1 计划加 Playwright 冒烟） |
| preview | 本地 `npm run dev`（5173）+ `.claude/launch.json`；Claude 预览可驱动 |

## 下一步（next）

1. ✋ **落盘待提交改动**：真实项目图片、详情页、灯箱、移动端间距与文档同步，等 owner 确认后 land。
2. ✋ **部署 + 接域名**：把站点上线到托管（推荐 Vercel）并接 `ailiu.online`（硬停，需 owner 批准）。
3. 上线前人工确认：公开邮箱、GitHub、Aviso 官网外链、项目图片授权、小姨家“已结束”口径。
4. Day-2：隐私友好的访问统计 / 监控（新外部服务，需 owner 选型）。

## 边界（硬停，必须 owner 拍板）

部署上线 / 接域名 / 对外公开 / 新外部服务（统计、监控）/ 新依赖 / 真实联系方式与隐私内容。详见 cap `references/boundaries.md`。

## 关键文件

- `src/content.ts` —— 所有文案 + 两个项目的结构化数据（**改内容只动这里**）。
- `src/styles.css` —— 设计令牌 + 全部组件样式 + 响应式断点（820px）。
- `src/components/Gallery.tsx` —— 横向画廊（桌面）/ 纵向堆叠（移动）+ 导航与揭示动效。
- `src/components/DetailOverlay.tsx` —— 项目详情 overlay。
- `public/aviso/` —— Aviso 真实图片（社交卡封面、划词工具栏截图、icon）。

## 已知约定 / 坑

- **揭示动效用 rAF + setInterval 看门狗驱动，不用 CSS 过渡**：headless 预览会冻结 CSS 动画时间线，改这部分务必沿用此模式，否则内容会卡在隐藏态。
- 内容尽量数据驱动（content.ts）；面板布局靠媒体查询在 820px 折叠为单列。
