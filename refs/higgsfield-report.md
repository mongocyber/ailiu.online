# higgsfield.ai 首页研究 (2026-10-15, 只读, 未登录)
证据文件: headers.txt home.html dom.json reqs.json 01-hero.png 02..13-scroll.png full.png

## 已验证
- 框架: 响应头 `x-hf-worker: tanstack` → TanStack Start (React) SSR; 路径 /tanstack/assets, /_serverFn/, route-preload-manifest。i18n JSON 按路由分包。
- 托管/CDN: Cloudflare (cf-cache-status HIT), 静态资源 assets.higgsfield.ai, 媒体 cdn.higgsfield.ai / static.higgsfield.ai / CloudFront, 图片经 images.higgs.ai 动态转 webp 缩放。
- 其他服务: Clerk 登录, Stripe, Sentry, GrowthBook(AB), Securiti 同意弹窗, Google Tag Manager/GA, DataDome 反爬, 内容 CMS(cms.higgsfield.ai)。CSP 还列出 Sanity/Contentful/Framer 域名(仅白名单,未必用于首页)。
- 字体: Inter Display(100-900) , Space Grotesk, IBM Plex Mono, Space Mono, 自托管 woff2, 4 个文件约 90KB。
- 首页结构 (h1/h2 实测): 顶栏导航(Explore/Image/Video/Audio/MCP/API/Genjutsu/Katana/AI Influencer…) + 荧光黄绿促销条 → 产品卡片横排 → 注册折扣大卡 → AI Influencer 区 → Genjutsu 模块 → Visual Effects / 预设墙 → GPT Image 2 作品拼贴墙 → "ONE CANVAS. EVERY WORKFLOW." → "DIFFERENT SCENES SAME STAR" → "EXPLORE MORE AI FEATURES"。深色底、荧光黄绿强调色、全大写粗体标题、大圆角卡片。
- 视频: DOM 50 个 `<video>`, 全部 muted + loop, 非 autoplay 属性(应由脚本在进入视口时播放,推断), 无 poster。MP4 直链 + HLS(.m3u8/.ts, 多档 480p–2160p, 疑用 hls.js: 3 个包含该字样)。最大单个 mp4 约 10MB。
- 图片: 266 个 img, 大量 webp 预设缩略图。
- 无 `<canvas>`; 无 .glb/.wasm/lottie/.riv 请求; 全局对象未发现 gsap/THREE/Lenis。包文本扫描 558 个 JS: gsap/three/lenis/lottie/rive/spline 均 0 命中。→ 首页没有 WebGL/3D、没有 Lenis 平滑滚动、没有 GSAP。
- 页面重量: HTML 解码 624KB(传输 94KB 压缩); JS 约 558 个小分包; 无头滚动 12 屏后总传输约 387MB(绝大多数是视频/HLS 分片,含重复范围请求,偏高估计)。首屏 DOMContentLoaded 约 0.8s, load 约 1.9s (无头, 美东 CF 节点)。
- 无角色/Avatar 吉祥物元素; 人物都是 AI 生成的作品素材。

## 推断(未验证)
- 动效基本是 CSS 过渡 + 视口触发视频播放 + 懒加载, 靠"满屏动态作品墙"而非复杂特效取胜。
- 包里有 1 个 chunk 命中 framer-motion/AnimatePresence 字样, 可能用了 motion 库做进出场, 未确认。
- 导航栏滚动时高亮当前分区(截图中 Explore 到 ChatGPT Plugin 高亮变化), 可能是 IntersectionObserver 驱动。

## 没做
未登录, 未点击产品内演示(Canvas/生成器在登录后), 所以"产品演示机制"只看到首页的循环视频卡片和静态拼贴。

## 对 ailiu.online 可借鉴
1. 内容即特效: 7 个项目每个配一段短循环静音视频(进入视口才播放、离开暂停, 带 poster), 比 3D 便宜得多。
2. 黑底 + 单一强调色 + 全大写粗标题 + 大圆角卡片, 统一模板, 与"七章同权"一致。
3. 性能纪律: 视频分档/HLS、图片用 CDN 动态缩放 webp、字体自托管只留 3 种、JS 分包。
4. 导航随滚动高亮当前章节。
5. Louis 叙述者: Higgsfield 没有角色吉祥物可抄; 建议用预渲染短视频片段(与之前评估的视频方案一致), 按章节切换, 不上 3D。
6. 反面: 380MB 级流量对个人站不可取, 视频每段控制在 1–2MB、总量 <15MB。
