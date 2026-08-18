# PROJECT_CONTEXT — ailiu.online

> 项目胶囊（保持瘦，≤120 行）。事实用 `scripts/cap_facts.py` 采集，不靠记忆。
> 最近更新：2026-08-17

## 是什么

`ailiu.online` —— owner（设计师 / AI Builder）的**个人作品集网站**。横向画廊式沉浸体验：5 个全屏面板（Hero / About / Aviso / 小姨家 / Contact）+ 每个项目可点进的全屏详情页。极简瑞士风、白色背景、电光靛蓝强调色。

## 技术栈

- React 19 + TypeScript + Vite 8（构建）
- 无第三方动画库，核心动效由 `requestAnimationFrame` 驱动
- oxlint 做 lint；Schibsted Grotesk / Space Mono 走本地字体文件，中文走系统字体栈

## 当前状态（站点运行事实截至 2026-07-02；Analytics 状态须按 exact revision / environment 读回）

- 代码已完成；当前本地门禁需以最新 `npm run lint`、`npm run build` 和 PC / 移动预览截图为准。
- 仓库：`github.com/mongocyber/ailiu.online`（**私有**），默认分支 `main`。
- **Production live**：Vercel 项目 `jonyliu-projects/ailiu.online`，生产域名 `https://ailiu.online`，`https://www.ailiu.online` 永久重定向到根域名。
- 当前生产部署 ID 以 Vercel 为准；用 `vercel inspect https://ailiu.online` 查询，避免 Git 集成自动部署后文档漂移。
- 域名 DNS 当前由火山引擎 nameserver 托管；站点可访问且解析到 Vercel 边缘，但 Vercel 控制台仍建议在 DNS provider 设置 apex `A ailiu.online 76.76.21.21`，或切 nameserver 到 Vercel。
- Aviso 和小姨家详情页已用当前真实项目资料与图片替换占位内容。
- SEO / GEO 基础已接入：canonical、OG/Twitter meta、JSON-LD、`robots.txt`、`sitemap.xml`、`llms.txt`，构建时生成 `/projects/aviso/index.html`、`/projects/xiaoyi/index.html`。
- Vercel Web Analytics 基础 pageview 的 implementation evidence 已在 revision `51a8e0a6b1e9b3f07a40a032173f190d7b3d8227` 验证；pushed / merged / deployed / collection 状态须分别绑定当前 exact revision、environment、deployment 与 Dashboard readback。Preview 与 Production 各有独立 Owner Gate；未验证不得写成 deployed / live，不补录历史数据。
- ICP：2026-08-17 已在火山引擎控制台核验 `ailiu.online` 服务状态为“正常”，服务备案号为 `冀ICP备2026029440号-1`，备案记录关联 IP 为 `14.103.220.193`。本候选仅实现所有中英文动态页面与构建期静态 HTML 的备案号展示；尚未 push / merge / deploy，当前 Production 仍在 Vercel，线上展示与大陆接入均不得据此写成 live。

## 验证骨架（spine）

| 检查 | 状态 |
| --- | --- |
| lint (`npm run lint`) | ✅ |
| typecheck + build (`npm run build` = `tsc -b && vite build`) | ✅ |
| npm audit（2026-07-31；candidate `51a8e0a6b1e9b3f07a40a032173f190d7b3d8227` vs baseline `37c588ec60bb16549dec4a952078aa480398c26d`；`--registry=https://registry.npmjs.org`） | 完整 audit：两者均有同一个 pre-existing dev-only High（`postcss@8.5.15`，经 Vite 依赖链引入）；production-only `npm audit --omit=dev`：两者均为 0；该 High 非 `@vercel/analytics@2.0.1` 引入 |
| production deploy | ✅ Vercel production `dpl_CDwJoU7vBw1pVz4rzqsWFKYtPRzg` |
| live smoke | ✅ `ailiu.online`、`www` redirect、项目页、sitemap、llms、桌面/移动 Playwright |
| CI（GitHub Actions） | ⬜ 暂未启用（当前发布走本地 lint/build/audit + Vercel 部署） |
| 自动化测试 | ⬜ 暂无（展示型站点，P1 计划加 Playwright 冒烟） |
| preview | 本地 `npm run dev`（5173）+ `.claude/launch.json`；Claude 预览可驱动 |

## 下一步（next）

1. MON-126 Phase B：完成 ICP 页脚候选的 lint、build、静态 HTML 与 PC / 移动浏览器验证；push / PR / merge / deploy 仍需各自 owner gate。
2. 大陆接入：核验备案关联火山资源的产品、地域、运行状态、有效期与静态站点发布路径，再单独决定 Production 迁移、DNS 切换和回滚目标。
3. 公安联网备案：真实大陆接入稳定后，由 owner 使用真实接入商、IP 与主体材料在全国互联网安全管理服务平台提交；审核通过后再独立加入公安备案图标与编号。

## 边界（硬停，必须 owner 拍板）

新外部服务（统计、监控）/ 新依赖 / 真实联系方式与隐私内容 / DNS provider 账号操作 / 生产回滚。详见 cap `references/boundaries.md`。

## 关键文件

- `src/content.ts` —— 所有文案 + 两个项目的结构化数据（**改内容只动这里**）。
- `src/seo.ts` —— canonical / Open Graph / JSON-LD / 项目 URL 元数据生成。
- `src/styles.css` —— 设计令牌 + 全部组件样式 + 响应式断点（820px）。
- `src/components/Gallery.tsx` —— 横向画廊（桌面）/ 纵向堆叠（移动）+ 导航与揭示动效。
- `src/components/DetailOverlay.tsx` —— 项目详情 overlay。
- `src/components/ProjectPage.tsx` —— 可直接访问的项目详情页。
- `public/robots.txt`、`public/sitemap.xml`、`public/llms.txt` —— 搜索与 AI 检索入口。
- `public/aviso/` —— Aviso 真实图片（社交卡封面、划词工具栏截图、icon）。
- `public/fonts/` —— 本地 Schibsted Grotesk / Space Mono 字体文件，避免生产站点请求 Google Fonts。

## 已知约定 / 坑

- **揭示动效用 rAF + setInterval 看门狗驱动，不用 CSS 过渡**：headless 预览会冻结 CSS 动画时间线，改这部分务必沿用此模式，否则内容会卡在隐藏态。
- 内容尽量数据驱动（content.ts）；面板布局靠媒体查询在 820px 折叠为单列。
