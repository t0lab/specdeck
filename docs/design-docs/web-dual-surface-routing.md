# ADR: Web dual-surface Spec detail (drawer + full page at one URL)

**Status:** Accepted · **Date:** 2026-06-25 · **Feature:** [002-web-mock](../../.specify/specs/002-web-mock/)

## Context

A reviewer needs two ways into a Spec's detail:

- **Triage in place** — glance at the overview without losing the board (most interactions).
- **Deep read / share / refresh** — a dedicated, linkable page (the occasional deep dive, and every shared link).

Both must live at the **same address** `/board/[spec]` so a URL copied from the drawer opens the full page, and a refresh never traps the user in a modal. This is the canonical "gallery ↔ photo modal" problem.

## Decision

Use Next.js **intercepting routes + parallel routes** (verified against the installed Next 16.2.9 docs, per `web/AGENTS.md`):

```
app/board/layout.tsx            → renders {children} + {drawer}
app/board/page.tsx              → the board
app/board/[spec]/page.tsx       → FULL detail page (DetailTabs)
app/board/[spec]/not-found.tsx  → "Spec not found"
app/board/@drawer/default.tsx   → null (slot closed)
app/board/@drawer/(.)[spec]/page.tsx → drawer overview (intercepts soft-nav)
```

- **Soft-nav** (clicking a card → `router.push('/board/[spec]')`): the `(.)[spec]` route in the `@drawer` slot intercepts and renders the overview overlaid on the still-mounted board.
- **Hard-nav / refresh / share**: no interception; `@drawer` falls back to `default.tsx` (null) and `children` renders the full `[spec]/page.tsx`.
- **Close** (Esc / backdrop / swipe / Back): `router.back()` returns to `/board`; the slot resets to `default`.
- **"Open full" / ⌘-click**: a plain `<a href>` (hard navigation) bypasses interception and lands on the full page directly (SC-005).

The `(.)` matcher (same segment level) is correct because `@drawer` is a **slot, not a route segment**, so `(.)[spec]` sits at the `board` level — mirroring the docs' login-modal example.

## Alternatives considered

- **Client-state drawer + separate `/spec/[id]` route** (the spec's stated fallback): rejected — the native API works, and split addresses break "one URL, two surfaces" (SC-005).
- **Pure client modal (no URL change)**: rejected — not shareable or deep-linkable (FR-014).

## Consequences

**Better**

- One address deep-links to the full page and overlays as a drawer on soft-nav — no divergence (same `getSpec` source).
- Refresh-safe, Back-closes, Forward-reopens for free from the router.

**Worse**

- Parallel slots add conceptual overhead; every slot at a segment level must provide `default.tsx`.
- "Open full" must be a hard `<a>` navigation to escape interception (a full reload), not a soft transition.

**Must now be true**

- `@drawer/default.tsx` MUST return `null`; if the drawer is ever opened over routes other than `/board`, a catch-all slot returning null is required to close it (per the parallel-routes "Modals" docs).
- The drawer and full page MUST read the same data (`getSpec`) so the two surfaces never drift.
