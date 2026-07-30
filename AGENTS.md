# ailiu.online Project Instructions

`ailiu.online` is the owner's personal portfolio site, built with React 19, Vite,
and TypeScript. This file is the canonical, tool- and model-neutral instruction
entry for the repository.

Capability: core

## Authority and context

- [R1] Dynamic scope and acceptance must come from an active native task whose scope
  matches the work, or from an explicit owner task-authorization record that names the
  repository, scope, allowed authority levels, and stop lines. A completed or adjacent
  Issue is context only and cannot authorize new work. Before editing, read the authority
  record and the checked-out Git revision and status. Stop on authority, baseline, or
  scope drift.
- Completed [Linear MON-106](https://linear.app/mongocyber/issue/MON-106/external-proof-adopt-the-core-project-harness-in-ai流)
  is historical evidence for the core-harness adoption only, not current task authority.
- Current implementation truth is the checked-out Git exact revision. Native platforms
  own review, deployment, and runtime facts.
- [`docs/ai/PROJECT_CONTEXT.md`](docs/ai/PROJECT_CONTEXT.md) is a legacy project capsule
  for architectural and historical context. Reverify its dated, deployment, runtime,
  role, and tool-specific statements against Git, native platforms, and current authority.

## Project map

- `src/content.ts`: the single source for all copy and project data.
- `src/styles.css`: design tokens, component styles, and the `820px` mobile breakpoint.
- `src/components/Gallery.tsx`: gallery orchestration, navigation, reveal, and parallax.
- `src/components/{DetailOverlay,Chrome,Cursor,Lightbox,Placeholder,Rich}.tsx` and
  `src/components/panels/*`: supporting presentation components.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md): production operations and evidence gates.
- [`docs/ai/PROJECT_CONTEXT.md`](docs/ai/PROJECT_CONTEXT.md): legacy architecture/history capsule.
- [`docs/ai/RULE_ACCOUNTABILITY.md`](docs/ai/RULE_ACCOUNTABILITY.md): hard-rule Matrix.
- [`.github/pull_request_template.md`](.github/pull_request_template.md): native review checklist.

## Commands

[R13] Use Node.js 20 or newer for setup and verification.

- Development: `npm run dev` at `http://localhost:5173`.
- Production preview: `npm run preview`.
- Verification: `./scripts/verify.sh`.

The verification script is the single native verification entry and composes the
repository's existing lint and production-build gates.

## Working contract

- [R2] Put copy and project-data changes only in `src/content.ts`; do not duplicate
  that content inside components.
- Prefer existing components, tokens, data-driven patterns, and naming. Keep diffs
  focused and avoid unrelated formatting or refactors.
- [R3] Keep reveal and parallax motion on `requestAnimationFrame` with the existing
  `setInterval` watchdog; do not replace it with CSS transitions.
- [R4] After an implementation, run the native verification entry. A passing run must
  leave tracked and untracked worktree state unchanged.
- [R5] For a user-visible frontend change, also inspect browser or preview screenshots
  at desktop and mobile widths before claiming the change is complete.
- [R11] Use the native PR checklist for any reviewable change.
- [R12] Medium- or high-risk completion requires a fresh, findings-first semantic
  review bound to the exact candidate. Implementation self-review is not independent evidence.

## Stop lines

- [R6] Stop and obtain owner approval before deployment, domain or DNS changes,
  public release, a new external service, a new dependency, real contact or private
  information, deletion, or reset.
- [R7] Treat `read`, `write`, `push`, `merge`, and `release` as separate authority
  levels that never advance automatically. Production action always requires owner approval.
- [R8] Keep each task within its authorized paths and authority levels, and do not
  modify the owner dirty worktree. Do not add a dependency, schema, manifest, database,
  daemon, scheduler, hosted service, or second task system unless current authority
  explicitly covers it. Fail closed and return to the owner on scope or authority drift.
- [R9] Keep `CLAUDE.md` import-only. Do not call Claude or another external model,
  and do not make a compatibility claim without new task authority and exact-revision proof.
- [R10] Register every hard rule in the Rule Accountability Matrix with its trigger,
  enforcement, evidence, failure action, and removal condition. Guidance without an
  enforcement channel remains advisory.
