# ailiu.online 生产运行手册

本手册只描述已经由仓库、Git 历史、Vercel 只读信息或生产 HTTP
检查证实的操作路径。动态状态必须在每次操作时重新读回；不得把本文中的历史
结果当作当前生产事实。

## 1. 当前运行模型与真相源

- 生产站点：`https://ailiu.online`。
- `https://www.ailiu.online` 由 Vercel 永久重定向到根域名。
- Vercel 项目：`jonyliu-projects/ailiu.online`，框架为 Vite。
- 已观察到的发布路径是 GitHub 与 Vercel 的既有 Git 集成：
  非 `main` 分支可产生 Preview deployment，`main` 更新可产生
  Production deployment。集成设置可能变化，每次都要在 Vercel 读回确认。
- 仓库没有 GitHub Actions 工作流。原生本地验证入口是
  `./scripts/verify.sh`，它包含 Node.js 版本、lint、生产构建和工作区洁净检查。
- GitHub/Linear 拥有代码与审批事实；Vercel 拥有 deployment、target、alias
  和运行平台事实；生产域名的 HTTP/浏览器检查拥有用户可访问性事实。

不要在文档中长期固定“当前 deployment ID”。需要时从 Vercel 项目重新查询，
并把当次 ID、Git SHA、target 和状态记录在变更或故障证据中。

## 2. 权限门禁

`read`、`write`、`push`、`PR`、`merge`、`production` 和 `rollback`
是不同权限级别，不得自动升级。

开始发布前必须具备：

1. 当前任务明确授权的范围和 active Issue。
2. 最新远端 `main` 的完整 SHA，以及候选的完整 SHA、父提交和 changed paths。
3. 候选工作区洁净，`./scripts/verify.sh` 通过；用户可见改动还需桌面和移动端检查。
4. medium/high-risk 候选具有绑定 exact candidate 的新鲜独立 review。
5. 对即将执行的 push、PR、merge 或 Production 动作分别取得 owner 授权。

以下动作始终停止并请求 owner 明确批准：

- Production 发布、回滚、删除 deployment 或改变 production alias。
- Vercel 项目/Git 集成/Web Analytics 设置、环境变量或密钥变更。
- 域名、DNS、证书、VPS 或网络接入变更。
- 新依赖、外部监控/告警服务、真实联系方式或用户数据处理。
- reset、force push、历史改写，或改动 owner 的 dirty worktree。

不得在仓库、Issue、日志或聊天中复制 token、密钥或 `.env` 内容。

## 3. Preview 与 Production 发布

### Preview

1. 取得候选 push/PR 授权后，推送 exact candidate；推送本身不等于 Preview 已成功。
2. 在 Vercel 项目读回新 deployment：
   - 项目必须是 `ailiu.online`；
   - Git SHA、分支和 PR 必须匹配候选；
   - target 必须是 Preview（API 可能显示为 `null`），不能是 `production`；
   - 状态必须是 `READY`。
3. 在该 Preview URL 完成与变更风险相称的桌面、移动端和 console 检查。
4. 任何 SHA、target、项目或状态不匹配都立即停止；不得用另一个 READY
   deployment 代替本候选证据。

### Production

1. 取得明确 Production 授权，并再次确认 owner 接受 `main` 更新可能由既有
   Git 集成自动触发生产部署。
2. 只合入已经验收的 exact candidate。不要另外发起手工部署，除非 owner
   对该手工动作另行授权。
3. 在 Vercel 读回由本次 `main` 更新产生的 deployment：
   - project 为 `ailiu.online`；
   - source/ref 为 Git/`main`；
   - Git SHA 等于实际 merge 后的 `main` SHA；
   - target 为 `production`；
   - 状态为 `READY`；
   - 生产域名 alias 指向该 deployment。
4. `READY` 只证明平台部署完成，不证明页面、Analytics 或用户体验正常。
   必须继续执行生产验证。

## 4. 生产验证

按顺序记录结果；任何必检项失败都停止后续发布并进入故障处理。

1. **平台绑定**：记录 Vercel deployment ID、target、状态、Git SHA 和生产域名。
2. **HTTP smoke**：
   - `https://ailiu.online/` 返回 200；
   - `https://www.ailiu.online/` 永久重定向到根域名；
   - `/projects/aviso/`、`/projects/xiaoyi/` 返回 200；
   - `/sitemap.xml`、`/llms.txt` 返回 200。
3. **浏览器 smoke**：桌面和移动宽度检查首页、两个项目页、导航/详情交互、
   图片加载、横向溢出和 console error。
4. **响应策略**：确认生产响应仍带有 `vercel.json` 定义的安全头，且
   `www` 和项目页路由与配置一致。

HTTP 200、Vercel `READY`、无 console error 和真实业务结果是不同证据，不得互相替代。

## 5. Web Analytics 验证边界

截至本手册创建时，MON-116 Web Analytics 仅有本地候选；尚未 push、合入或部署，
生产真实 pageview 未验证。Analytics 不能写成当前 live 能力。

在取得对应 Preview/Production 授权后，按以下链路逐层验证：

1. deployment 的 exact Git SHA 包含获批的 Analytics 候选。
2. 目标页面实际注入并请求 `/_vercel/insights/script.js`，且没有新增 console error。
3. Production 发布后，从生产域名进行一次真实页面访问。
4. 在 Vercel Web Analytics 中读回该发布之后产生的 pageview，记录查询时间和范围。

`/_vercel/insights/script.js` 端点可访问，不等于页面已加载脚本；页面加载脚本，
也不等于 Vercel 设置已启用或 pageview 已入库。Vercel Web Analytics 开关当前
仍需在 Production gate 中重新验证；若需要改变设置，必须先取得 owner 批准。

Web Analytics 是访问统计，不是 uptime、错误告警、VPS 监控或自动修复。

## 6. 回滚

回滚是 Production 动作，必须由 owner 针对明确目标批准。

1. 停止继续发布，保存故障时间、现象、受影响 URL、当前 deployment ID、
   target、Git SHA、HTTP/console 证据。
2. 在 Vercel 历史中选择一个此前已验证的 `READY` Production deployment；
   记录它的 deployment ID 和 Git SHA，不凭时间或名称猜测。
3. 由 owner 批准这个 exact 回滚目标。
4. 在 Vercel 使用平台的 rollback，或将已验证的目标 deployment 重新指向
   Production。CLI、Dashboard 或 API 的实际写操作都需要单独授权。
5. 读回 production alias、target、状态和 Git SHA，并重新执行第 4 节全部验证。
6. 用新的可审查 revert/fix 候选修复 `main` 真相；重新走验证、review 和发布门禁。

不得通过改 DNS、删除历史 deployment、reset、force push 或静默改写 Git 历史回滚。
如果找不到“此前已验证”的 deployment，保持停线并由 owner 决定，不得自行选取。

## 7. 故障处理

### 站点不可用、错误版本或页面回归

1. 先确认生产域名当前指向的 deployment ID 和 Git SHA。
2. 区分 Vercel deployment 失败、alias/域名问题、HTTP 问题和浏览器功能回归。
3. 保存证据并停止新的 merge/deploy。
4. 若存在明确的前一已验证版本，请求 owner 批准回滚；否则提交最小修复候选。

### 仅 Analytics 无数据

站点本身正常时，不要直接回滚网站。依次核对 exact deployed SHA、脚本注入、
浏览器请求、console、Production 域名真实访问和 Vercel Analytics 读回。
设置变更、用户数据查看范围扩大或引入其他统计服务都需要 owner 批准。

### DNS、域名或证书异常

只收集当前解析、HTTP/证书和 Vercel domain 状态证据。不得自行改火山引擎 DNS、
nameserver、Vercel domain 或证书设置；把 exact 证据交给 owner 决策。

## 8. 监控与告警现状

当前已证实的运行信号只有 Vercel deployment 状态读回和人工 HTTP/浏览器 smoke。
仓库内没有 GitHub Actions、自动化生产 smoke 或端到端测试配置。

以下能力未验证或尚未配置，不能声称存在：

- uptime、错误率、性能或证书到期告警；
- Sentry、Datadog、Vercel Drains 或其他外部监控；
- 固定告警接收人、值班渠道或响应时限；
- 自动回滚、自动修复、VPS 监控或 AI 运维；
- Web Analytics 生产真实 pageview。

因此，Vercel `READY` 之后的人工生产验证是当前必需门禁。补充任何自动监控、
告警或运行服务属于新范围，需 owner 选型和批准。

## 9. 每次操作的最小记录

在 active Issue、PR 或独立证据中记录：

- 操作时间、操作人和 owner 授权；
- remote `main` baseline、candidate、merge 后 `main` 的完整 SHA；
- exact changed paths、验证和独立 review 结果；
- Preview/Production deployment ID、target、状态、Git SHA 和 URL；
- 生产 smoke 结果，以及 Analytics 是否仅 implemented、deployed 或已验证 pageview；
- 失败项、回滚目标、回滚授权和回滚后验证。

未执行或无法读回的字段写 `UNKNOWN` / `NOT VERIFIED`，不能用预期结果补齐。
