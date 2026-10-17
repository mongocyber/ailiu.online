# 任务：ailiu.online 第二版重设计样片 (preview-v2)
读 INSTRUCTIONS.md（单一事实源，§13 禁止项必须遵守：无 3D/WebGL/Three.js、无麦克风、声音单向且默认尝试播放(此版静音占位并标注)、七板块各有个别设计、无单一项目主导风格、纵向滚动、中英双语）。
参考在 refs/（notes.md、shots/*.png 用 Read 看图、higgsfield-report.md）。Atomic(atomic.black，设计工作室作品集)是用户点名的主要参考，其余自行取舍；用户明确说：你可以也应当超越参考，做得比它们更好，自己做决定，不要被束缚。
第一版(/workspace/ailiu-preview)用户不满意：质感不足、Aviso 窗口标签被裁、PrintPlay 页叠右侧被裁、从没在浏览器看过。不要沿用其设计，从头做。
范围：纯静态 index.html/styles.css/app.js（可多文件），首屏 Louis + Aviso + PrintPlay 两个差异化深度板块 + 其余五板块（蒸汽站、随口英语、小姨家、桃桃屋、野生路易斯）各自有区别的占位；中英切换；导航与滚动节奏自定；不用外部CDN依赖/不联网生成素材；不调用 Midjourney/Suno/Higgsfield；音频静音占位并标注；不花钱。
必须自检：用 Playwright(python，已装 chromium) 起 python3 -m http.server 8801，桌面1440x900 与手机390x844 对各板块滚动截图到 shots/，亲自 Read 看图，发现裁切/对齐/质感问题就改，至少迭代 2 轮。最后写 DESIGN-NOTES.md：你的设计决策、偏离 INSTRUCTIONS 处、已知问题。完成后 git add -A && git commit。不要部署，不要联网推送。
