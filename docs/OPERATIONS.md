# ailiu.online 生产运行手册

本手册只描述已经由仓库、Git 历史、Vercel 只读信息或生产 HTTP
检查证实的操作路径。动态状态必须在每次操作时重新读回；不得把本文中的历史
结果当作当前生产事实。

## 1. 当前运行模型与真相源 [O1]

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

## 2. 权限门禁 [O2]

`read`、`write`、`push`、`PR`、`merge`、`production` 和 `rollback`
是不同权限级别，不得自动升级。

开始发布前必须具备：

1. 当前任务有范围匹配的 active Issue，或有明确记录仓库、范围、权限级别和
   stop lines 的 owner task authorization；已完成或相邻 Issue 只能作为背景，
   不能授权新工作。
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

### Preview [O3]

1. 取得候选 push/PR 授权后，推送 exact candidate；推送本身不等于 Preview 已成功。
2. 在 Vercel 项目读回新 deployment：
   - 项目必须是 `ailiu.online`；
   - Vercel UI/environment 必须明确显示 `Preview`；
   - API `target` 必须按原始值单独记录；Preview deployment 实际可能为
     `null`，`null` 绝不能解释为 `production`；
   - Git SHA、Git ref/分支和 PR 必须分别匹配候选；
   - 状态必须是 `READY`。
3. 在该 Preview URL 完成与变更风险相称的桌面、移动端和 console 检查。
4. 任何 environment、API `target`、Git SHA/ref/PR、项目或状态不匹配都立即停止；
   不得用另一个 READY deployment 代替本候选证据，也不得仅凭 API `target: null`
   声称 Preview 或 Production 已验证。

### Production [O4]

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

## 4. 生产验证 [O5]

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

每个门禁必须独立记录 `PASS` 或 `UNKNOWN / NOT VERIFIED`，以及对应时间、环境和
证据。前一门禁通过不能替代后一门禁；缺少读回、证据不匹配或请求失败时保持
`UNKNOWN / NOT VERIFIED`，不得推断为通过。

1. **Gate A — exact deployment 包含获批候选 [O6A]**
   - 记录 deployment ID、environment、API `target` 原始值、状态、Git SHA、
     Git ref 和 PR。
   - 对照获批候选，确认该 exact Git SHA 的源码/依赖确实包含 Analytics SDK
     和脚本注入改动。
   - 只有 deployment 与获批候选完全绑定时记 `PASS`；否则记
     `UNKNOWN / NOT VERIFIED`。
2. **Gate B — Dashboard 开关只读读回 [O6B]**
   - 在 Vercel Web Analytics Dashboard 只读确认目标项目和目标 environment
     的开关状态，记录读回时间和原始状态。
   - 只有只读读回明确确认目标 environment 已启用时记 `PASS`；无法读取、
     environment 不明或状态未启用时记 `UNKNOWN / NOT VERIFIED`。
   - 任何启用、关闭或其他设置改变都是独立 owner-gated 写操作；本门禁不授权改变。
3. **Gate C — 页面实际加载且脚本请求成功 [O6C]**
   - 在目标 deployment 页面打开浏览器 Network/console，确认页面实际发起
     `/_vercel/insights/script.js` 请求，并记录该请求的成功响应状态和时间。
   - 同时记录页面 URL、environment、deployment ID 和新增 console error 数。
   - 只有请求由该页面实际发出并成功完成时记 `PASS`；源码、DOM 或日志中仅出现
     endpoint 路径，或单独访问 endpoint，均不能记 `PASS`。
4. **Gate D — 限定时间窗内读回真实 Production pageview [O6D]**
   - Production 发布后，先记录真实生产访问的 URL 和访问时间 `T0`，再从
     `https://ailiu.online` 完成一次真实页面访问。
   - 在操作记录中预先写明查询窗口起止 `T0`–`T1`；到 `T1` 后按 Production
     environment、生产域名和该时间窗过滤 Vercel Web Analytics。
   - 记录 Dashboard 查询时间、过滤条件和读回结果。只有在该限定时间窗内读回
     发布后真实 Production pageview 时记 `PASS`；没有限定窗口、读不到数据或
     无法确认 environment/域名时记 `UNKNOWN / NOT VERIFIED`。

`/_vercel/insights/script.js` endpoint 路径出现，不等于请求已发出或成功响应；
脚本请求成功，也不等于 Dashboard 开关已启用或 pageview 已入库。四个门禁必须
分别留证，不能合并为一个“Analytics 正常”结论。

Web Analytics 是访问统计，不是 uptime、错误告警、VPS 监控或自动修复。

## 6. 回滚 [O7]

回滚是 Production 动作，必须由 owner 针对明确目标批准。

1. 停止继续发布，保存故障时间、现象、受影响 URL、当前 deployment ID、
   target、Git SHA、HTTP/console 证据。
2. 在 Vercel 历史中选择一个此前已验证的 `READY` Production deployment；
   记录它的 deployment ID 和 Git SHA，不凭时间或名称猜测。
3. 由 owner 批准这个 exact 回滚目标。
4. 在 Vercel 使用平台的 rollback，或将已验证的目标 deployment 重新指向
   Production。CLI、Dashboard 或 API 的实际写操作都需要单独授权。
5. 回滚后只读核对 `Current deployment`、production alias、target、状态、Git SHA
   和 auto-assignment，并重新执行第 4 节全部验证。
6. Vercel Instant Rollback 会关闭生产域名的 auto-assignment；在该状态下，后续
   `main` push 不会自动 live。不得用新 deployment 的 `READY` 或 `main` 已更新
   推断生产域名已切换。
7. 通过 **Undo Rollback** 或 **promote** 恢复 auto-assignment 是新的 Production
   写操作，必须取得独立 owner 授权；原回滚授权不自动覆盖恢复动作。
8. 执行获批的恢复动作后，只读核对 `Current deployment`、production alias、
   Git SHA 和 auto-assignment 状态，并重新执行第 4 节全部验证；无法读回的字段
   保持 `UNKNOWN / NOT VERIFIED`。
9. 用新的可审查 revert/fix 候选修复 `main` 真相；重新走验证、review 和发布门禁。

不得通过改 DNS、删除历史 deployment、reset、force push 或静默改写 Git 历史回滚。
如果找不到“此前已验证”的 deployment，保持停线并由 owner 决定，不得自行选取。

## 7. 故障处理 [O8]

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

## 8. 监控与告警现状 [O9]

当前生产信号仍以 Vercel deployment 状态读回和人工 HTTP/浏览器 smoke 为准。
仓库中的 repo-local Phase A checker 只是尚未安装的运行模板，不能据此声称监控已部署。

MON-117 Phase A 的准确状态只能写成：
`IMPLEMENTED / VERIFIED WITH FIXTURES ONLY / NOT INSTALLED / NOT DEPLOYED / NOT LIVE`。

### 检查与故障分类合同 [O9A]

- `ops/monitoring/check-site.sh` 固定检查 DNS、TLS、英文首页、两个英文项目页和
  sitemap。四个 HTTP 路由只有精确状态 `200` 才算成功；`201`、`206` 或其他
  2xx 仍归类为 `HTTP_STATUS`。它不跟随重定向，不接受非 HTTPS 或其他域名作为
  成功结果。
- 故障主分类固定按 `DNS`、`TLS`、`HTTP_TRANSPORT`、`HTTP_STATUS`、
  `CONTENT` 的顺序选择；同一次检查可以保留多个失败分类，但不能
  用后续 HTTP 或内容结果覆盖更早的 DNS/TLS 失败。
- deployment ID 文件只是告警上下文中的 configured reference，不参与健康判断，
  运行时状态固定标记 `UNKNOWN_NOT_VERIFIED`。静态示例、`x-vercel-id`、HTML marker
  或旧值都不能证明当前 Vercel deployment；激活时必须从 Vercel 当前真相源刷新
  并读回，真实 drift 检测仍是后续 owner-gated 能力。
- `--fixture` 和 `--dry-run` 只接受本地原始 transport facts，不访问真实 DNS、TLS、
  HTTP、告警或 heartbeat endpoint。fixture 通过只能证明分类代码，不证明生产可用。
- DNS、TLS、HTTP 和 delivery 全部同时使用 TERM→KILL POSIX watchdog；curl 路径
  另有自身 hard timeout。验证器把单 cycle 最坏外部等待锁为 40 秒，严格小于
  systemd 模板的 50 秒整组停止线；并用真实 PID 探针验证脚本直接启动的 timeout
  transport 已退出。脚本不宣称 standalone whole-cycle hard stop；任意 provider
  helper 的后代进程、50 秒 cgroup 停止和 timeout 后清理只能在目标 systemd 安装后
  验证，当前保持 `UNKNOWN / NOT VERIFIED`。任何 timeout 都不得伪造 heartbeat 或
  健康结论。

### Incident、去重与恢复合同 [O9B]

- 失败计数跨独立进程写入原子 state；故障分类变化不重置计数。连续第 3 个失败
  cycle 才打开 incident，只有所有必检项成功才清零或进入 recovery。
- 每个 incident 生成一个稳定 `event_id`。告警或 recovery 未取得明确 2xx 时，
  后续重试必须沿用同一 ID；持续失败不能创建第二个逻辑 alert event。
- incident 打开时必须把首次失败结果随 state v2 一起原子持久化。即使下一 cycle
  已恢复，未获 2xx 的 alert 也不能被关闭或用健康结果重造；必须先按原 ID、原时间、
  原失败快照补送 alert，再按同一 ID 发送持久化 recovery。recovery 重试同样不得
  改写首次 recovery 快照。为守住 40 秒 transport 上限，每个 cycle 最多投递一个
  alert 或 recovery；若旧 alert 本 cycle 才成功，recovery 保持 pending 到下一 cycle。
- 只要一个检查 cycle 已完整执行，无论站点健康或失败，都必须尝试发送 VPS
  heartbeat；只有 lock、损坏 state 或内部崩溃等未完成 cycle 才能缺席，避免把站点
  故障误报成监控进程/VPS 故障。
- 通用 webhook 无法单方面保证网络层 exactly-once。只有接收端按稳定 event ID
  实现并验证幂等后，才能声称远端去重；否则只能声称“一次逻辑事件”，远端物理
  重复保持 `UNKNOWN / NOT VERIFIED`。
- 损坏/恶意 state、已有 lock、路径逃逸或不安全 symlink 必须 fail closed，且不得
  访问网络、改写 state、发送事件或伪造 recovery。检查必须覆盖完整路径的每个
  ancestor 和最终组件，并在 `test -e` 前拒绝 dangling symlink。

### Repo-local fixture 与 systemd 模板合同 [O9C]

- `ops/monitoring/test-check-site.sh` 必须在临时目录中覆盖健康、分类变化、三连败、
  exact-200、持续失败去重、恢复前补送未投递 alert、alert/recovery 原快照重试、
  state 损坏、lock、ancestor/dangling symlink、timeout budget 和 secret canary；
  测试不得访问 Production。
- service 必须是非 root oneshot、唯一绝对 `ExecStart`、必填绝对
  `EnvironmentFile`、私有 state 目录并启用最小权限 hardening；timer 固定每分钟
  触发同一 service。仓库模板不会自行 install、enable 或 start。
- webhook 和 heartbeat 的真实 URL/header 不得进入仓库、环境示例、日志或参数输出。
  示例中的 curl config 路径为空；激活文件只接受一个 quoted HTTPS `url` 和最多 8 个
  quoted `header` 行，未知 curl 指令或未配置状态必须 fail closed。
- 本地 parser、mutation probes 和 shell tests 不能替代目标 Linux 上的
  `systemd-analyze verify`、timer/reboot readback 或 journald retention 读回。

### 安装、secret、heartbeat 与 live evidence gate [O9D]

任何安装或 live 声明前，必须另行取得 owner 授权并记录：目标 VPS、运行用户、
Linux/systemd 版本、现有服务边界、唯一告警渠道、secret 存储方式、独立 heartbeat
provider、当前 deployment ID 的合法读取来源，以及安全的故障注入窗口。随后必须：

1. 在目标 Linux 校验 unit，备份同名文件，再安装但不自动启用。
2. 由 owner 单独批准 enable/start；读回 timer 的 last/next、重启后恢复和实际运行用户。
3. 读回 journald 的真实保留上限；`StandardOutput=journal` 本身不证明日志有界。
4. 用非 Production fixture 或明确授权的安全注错验证三连败 alert、持续失败去重、
   recovery 与接收端幂等；再验证第二来源能在 VPS heartbeat 中断时报警。
5. 只有以上 exact evidence 完整时，才把对应能力从 `NOT INSTALLED / NOT LIVE`
   更新为已验证；缺少任何读回时保持 `UNKNOWN / NOT VERIFIED`。

以下能力未验证或尚未配置，不能声称存在：

- uptime、错误率、性能或证书到期告警；
- Sentry、Datadog、Vercel Drains 或其他外部监控；
- 固定告警接收人、值班渠道或响应时限；
- 自动回滚、自动修复、VPS 监控或 AI 运维；
- Web Analytics 生产真实 pageview。

因此，Vercel `READY` 之后的人工生产验证是当前必需门禁。补充任何自动监控、
告警或运行服务属于新范围，需 owner 选型和批准。

## 9. 每次操作的最小记录 [O10]

在 active Issue、PR 或独立证据中记录：

- 操作时间、操作人和 owner 授权；
- remote `main` baseline、candidate、merge 后 `main` 的完整 SHA；
- exact changed paths、验证和独立 review 结果；
- Preview/Production deployment ID、target、状态、Git SHA 和 URL；
- 生产 smoke 结果，以及 Analytics 是否仅 implemented、deployed 或已验证 pageview；
- 失败项、回滚目标、回滚授权和回滚后验证。

未执行或无法读回的字段写 `UNKNOWN` / `NOT VERIFIED`，不能用预期结果补齐。
