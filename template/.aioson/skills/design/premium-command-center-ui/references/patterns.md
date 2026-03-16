# Patterns — Premium Command Center UI

---

## Application flow

Follow this sequence. Do not start from components. Start from operational pressure.

### 1. Inspect the product before drawing anything

Identify the real operational nouns and verbs:

- What is the **live signal**? (running tasks, active events, real-time state)
- What is the **queue**? (pending work, backlog, staged items)
- What is the **grouped catalog**? (squads, agents, workflows, resources)
- What deserves **persistent navigation**?
- What belongs in **context**, not in the primary column?

### 2. Translate raw data into UI-native objects

Do not render tables straight from storage shape when the user actually needs lanes, signals, grouped cards, or contextual summaries.

Convert backend records into view models. Examples from the AIOS Dashboard:
- `GlobalTaskRecord` — aggregated task signal with lane/priority/status
- `WorkflowRecord` — lifecycle-aware workflow with stage and next action
- `MemoryAssetRecord` — knowledge item with type, source, and recency

Apply the same principle in new projects. Ask: *what shape does the user need to think in?*

### 3. Choose the shell intentionally

Use the **tri-rail shell** when the product has:
- 5+ first-class modules
- Live or near-live context
- A need for persistent navigation + persistent context panel
- Enough desktop usage to justify a right rail

Collapse progressively below the desktop breakpoint — do not build a separate mobile design system.

**Tri-rail layout:**
```
┌────────────────────────────────────────────────────────┐
│  TOP BAR: [Logo] [Search] [Workspace picker] [Actions] │
├──────────┬─────────────────────────────────┬───────────┤
│  LEFT    │                                 │  RIGHT    │
│  NAV     │     CENTER WORKSPACE            │  ACTIVITY │
│  RAIL    │     (primary column)            │  RAIL     │
│  200px   │     one focal block per page    │  280px    │
│  module  │     operational priority first  │  state    │
│  icons   │                                 │  history  │
│  + labels│                                 │  metrics  │
└──────────┴─────────────────────────────────┴───────────┘
```

### 4. Choose the page archetype

Pick the pattern that matches the page's job:

| Archetype | Job | Focal block |
|---|---|---|
| **Command overview** | Surface live signals and current operational state | Priority queue or status summary |
| **Queue / control tower** | Show pending work in processing order | Task lane or control grid |
| **Grouped registry** | Browse and act on a categorized catalog | Group headers with inline actions |
| **Workflow catalog** | Track multi-step flows from start to completion | Status-aware workflow cards |
| **Knowledge explorer** | Find, filter, and inspect reference assets | Search bar + metadata panels |

Use the UX playbook (operations.md) to decide which archetype fits each route.

### 5. Apply the visual language without diluting it

Preserve these moves together — removing any one degrades the whole:

- Dark graphite or cool mist foundation
- Aurora background fields on the page and shell — not on every card
- Borders-first depth with one shadow family only
- Three surface levels maximum
- Compact spacing and short helper copy
- Semantic badges and gradient fills tied to meaning, not decoration

### 6. Build direct next actions into the UI

Every major card must expose the next useful step:
- Open the squad / agent / workflow
- Inspect the task
- View logs / history
- Switch workspace
- Drill into detail or source

Premium feel comes from reduced friction, not only from color.

---

## Shell guardrails

- Do not create equal-weight card walls for every section.
- Every screen needs one obvious focal block.
- Context and supporting data belong in side rails, not in the main narrative column.
- Search and navigation must reduce friction — they cannot compete with the workspace.

---

## How to adapt this skill to new projects

Adapt the system structurally, not literally.

- Replace `squads` with the domain grouping that matters in the new product.
- Replace `tasks` with the domain queue or active work item.
- Replace `memories` with the project's knowledge layer, asset layer, or context layer.
- Replace `activity rail` content with the three slices that matter most: current state, history, metrics.
- Keep the same visual grammar and density discipline even when labels and data change.

If the new project already has a design system:
1. Port the hierarchy rules first
2. Port the page archetypes second
3. Port the shell behaviors third
4. Port colors only if they do not violate brand or accessibility
