## Change evidence

- Target state: <!-- implemented | verified; do not infer deployed or live -->
- Risk: <!-- Standard | Controlled | Gated, with rationale -->
- Authority: <!-- native task or requirement link -->
- Baseline revision: <!-- full SHA -->
- Candidate revision: <!-- full SHA -->
- Changed paths: <!-- exact baseline-to-candidate list -->

## Verification

- [ ] Native verifier completed on the candidate.
- [ ] Shell syntax, diff whitespace, exact scope, and executable bit were checked.
- [ ] Verification left tracked and untracked worktree state unchanged.

## Review

- Independent review: <!-- fresh findings-first review bound to the candidate SHA -->
- [ ] Implementation self-review is not counted as independent evidence.
- [ ] Product meaning, project specificity, truth sources, enforcement, and claims were reviewed.

## Stop-line confirmation

- Stop-line confirmation: <!-- list any approval evidence or state "none crossed" -->
- [ ] No unauthorized feature, content, runtime, dependency, package, build, or deployment change.
- [ ] No unauthorized deployment, release, DNS, production smoke, credential use, external
      communication, data action, history rewrite, force push, or branch deletion.
