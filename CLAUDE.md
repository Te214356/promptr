# Promptr — Claude Code Project Guide

This file is loaded automatically by Claude Code at the start of every session in this project. It documents the subagent network available in `.claude/agents/` and how agents should collaborate on common tasks.

---

## Subagent Roster

### Code Agents
| Agent | File | Role |
|---|---|---|
| **code-expert** | `code-expert.md` | Implements code changes, debugging, and architecture decisions for the Promptr monorepo (Medusa backend + Next.js storefront). Invoke for any non-trivial implementation task. |
| **code-reviewer** | `code-reviewer.md` | Reviews diffs for correctness, security, and simplification before committing. Always run after code-expert on significant changes. |

### Arabic-Language Business Agents
| Agent | File | Role |
|---|---|---|
| **كاتبي** (katiby) | `katiby.md` | Writes Arabic content: product descriptions, blog posts, marketing copy, social media captions. Matches brand voice for both Promptr and سبعة أصفار. |
| **بريدي** (baridy) | `baridy.md` | Drafts and classifies Arabic/English emails. Triages inbox by urgency and category. |
| **يوتيوبر** (youtuber) | `youtuber.md` | YouTube content strategist for the سبعة أصفار channel. Produces video ideas, hooks, scripts, and thumbnail briefs in Dramatic Gold brand style. |
| **محلل** (muhalil) | `muhalil.md` | Business and data analyst. Synthesises market research and gives bottom-line-first recommendations with explicit tradeoffs. |
| **متابع** (mutabi) | `mutabi.md` | Project and task tracker. Surfaces overdue items, maps dependencies, and maintains status across Promptr and سبعة أصفار. |
| **مصمم** (musammim) | `musammim.md` | Brand and UI design direction (no image generation). Fluent in Promptr's identity (`#080810` / `#6C2BFF` / `#00CFFF`) and سبعة أصفار's Dramatic Gold palette. |
| **مستشار** (mustashar) | `mustashar.md` | Strategic business advisor. Gives honest, balanced counsel on decisions across all ventures — including pushback on bad ideas. |
| **باحث** (bahith) | `bahith.md` | Deep researcher. Verifies facts, cites sources, and produces structured research briefs with content angle suggestions. |

---

## Common Workflows

### Content Creation
```
bahith (research) → katiby (write) → musammim (design/visual notes) → mustashar (strategic review)
```
1. **bahith** — research the topic, produce a structured brief with 3–5 content angles
2. **katiby** — draft the content from the brief
3. **musammim** — add visual direction (if the content ships with design assets)
4. **mustashar** — final sanity check on message, positioning, and brand fit

### YouTube Video (سبعة أصفار)
```
bahith (research) → youtuber (script + title + thumbnail brief) → musammim (thumbnail direction)
```
1. **bahith** — research the angle, verify claims, gather supporting data
2. **youtuber** — write the hook, script, title options, and thumbnail description
3. **musammim** — refine thumbnail visual spec to Dramatic Gold identity

### Code Change
```
code-expert (implement) → code-reviewer (review) → commit & push
```
1. **code-expert** — implement the feature, fix, or refactor
2. **code-reviewer** — review the diff; only commit after reviewer sign-off on significant changes

### Business Decision
```
bahith (research landscape) → muhalil (analyse options) → mustashar (final recommendation)
```
1. **bahith** — gather relevant market/competitor/data context
2. **muhalil** — structure the analysis, quantify tradeoffs
3. **mustashar** — give a clear directional recommendation

### Project Status Check
```
mutabi (status summary) → mustashar (strategic priorities)
```
1. **mutabi** — surface all open items, flag overdue, map blockers
2. **mustashar** — identify which open items matter most given current stage

---

## Project Context

- **Promptr** (`promptrsa.com`) — Medusa v2 e-commerce backend + storefront. Primary stack: TypeScript, Medusa 2.x, Node.js. Payment: Moyasar (SAR). Deployed on Railway.
- **سبعة أصفار** — Arabic YouTube channel. Brand: Dramatic Gold, entrepreneurship/wealth content, Gulf/Saudi audience.
- **Monorepo layout:** `apps/backend` (Medusa), `.claude/agents/` (subagents), root `package.json` (npm workspaces).
- **Build note:** `ts-node` and `typescript` are in `dependencies` (not devDependencies) — required for Railway production builds.
