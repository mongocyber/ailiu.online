# Rule Accountability Matrix

This Matrix accounts for the hard rules in `AGENTS.md`. Guidance without a listed
enforcement channel is advisory.

| Rule | Trigger | Enforcement Layer | Evidence | Failure Action | Removal Condition |
| --- | --- | --- | --- | --- | --- |
| R1 — Follow current authority and exact scope | Any task or edit | Semantic and Human | Active Issue, project context, Git status, and baseline-to-candidate diff | Stop or remove the out-of-scope change | A later native task explicitly changes the authority or scope |
| R2 — Keep content in its source of truth | Any copy or project-data change | Semantic | Diff review shows content changes only in `src/content.ts` | Move the content to its canonical source or stop | An authorized architecture change replaces that source |
| R3 — Preserve the motion mechanism | Any reveal or parallax change | Executable and Semantic | Browser behavior, desktop/mobile screenshots, and exact diff | Restore the rAF/watchdog pattern or stop | An authorized task replaces the motion architecture with verified evidence |
| R4 — Use one state-preserving verifier | Any implementation or verification claim | Deterministic and Executable | Successful native verifier output and identical before/after Git status | Treat the candidate as unverified and fix the verifier or failure | The repository adopts a different single native verification entry |
| R5 — Verify user-visible changes visually | Any frontend behavior or presentation change | Executable and Human | Desktop and mobile preview screenshots bound to the candidate | Keep the change incomplete until both views are checked | The project no longer has a visual frontend |
| R6 — Obtain owner approval for gated changes | Any listed real-world, dependency, private-data, delete, or reset action | Human | Explicit approval naming the action and scope | Stop before execution | The action no longer has the listed impact and is reclassified with evidence |
| R7 — Keep authority levels separate | Any move from read through release or any production action | Human | Separate approval for the requested level; explicit owner approval for production | Stop at the currently authorized level | The owner explicitly changes the authorization policy |
| R8 — Keep MON-106 adoption isolated | Any MON-106 candidate edit | Deterministic and Semantic | Exact baseline-to-candidate path review plus independent semantic review | Fail closed, remove scope drift, or return to the Issue | MON-106 is replaced by new native task authority |
| R9 — Keep the import neutral and avoid unsupported model claims | Any `CLAUDE.md` change, external-model call, or compatibility claim | Deterministic and Semantic | Native verifier output and exact-revision review | Restore import-only content, stop the call, or withdraw the claim | New task authority plus exact-revision proof permits the difference |
| R10 — Account for every hard rule | Any hard-rule or Matrix change | Deterministic and Semantic | Native rule-ID/field checks and independent review | Fail verification or demote unenforced text to advisory guidance | An authorized policy replaces rule accountability |
| R11 — Preserve native review evidence | Any reviewable change | Deterministic | Native verifier confirms required PR checklist fields | Restore the fields before review | The native review platform enforces equivalent evidence |
| R12 — Require independent exact-candidate review | Any medium/high-risk completion or semantic acceptance | Semantic | Fresh findings-first review bound to the full candidate SHA | Keep semantic acceptance pending | The authorized review policy changes |
