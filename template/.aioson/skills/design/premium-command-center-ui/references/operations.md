# Operations — Premium Command Center UI

---

## Hierarchy rules

1. **Show live pressure first.** Runtime operations appear above infrastructure or metadata.
2. **Group cards by operational meaning**, not by raw data type.
3. **Convert backend shapes into UI-native view models** when the user needs lanes, signals, grouped cards, or contextual summaries — not table rows.
4. **Expose the next useful action** from every major block. Never leave the user without a clear path forward after reading a card.

---

## UI view model concept

Do not render storage records directly as UI rows. Instead, aggregate backend data into objects shaped for operational reading.

Examples from the AIOS Dashboard:
- `GlobalTaskRecord` — combines task status, lane assignment, priority, and direct action into one card
- `WorkflowRecord` — shows lifecycle stage, progress, blockers, and the one next step
- `MemoryAssetRecord` — surfaces type, recency, source, and retrieval action

Apply this in every new product: ask *"what does the user need to decide?"* and build the view model around that answer.

---

## How to preserve quality

The quality bar is preserved when all of the following remain true:

- Runtime or primary operations appear **above** infrastructure or metadata
- Every screen has **one obvious focal block**
- Cards are grouped by **operational meaning**, not just by data type
- The shell behaves like a **product operating surface** — not a page of links
- Semantic colors are **limited and consistent** — no rainbow status colors
- Empty states are **styled and intentional** — never raw blank space
- Search, navigation, and context **work together** instead of competing
- Density is **compact but not cramped** — operational readability, not marketing whitespace

---

## When the system is working

The result should feel like an operating surface:
- Search and navigation reduce friction without competing with the workspace
- Contextual rails support the current task without overloading the viewport
- Live signals, queue state, history, and drill-downs coexist without collision
- A user arriving at any screen can immediately read: *what is happening, what is next, what do I do*

---

## When to use this skill

Apply `premium-command-center-ui` when:

- The product is an operational dashboard or internal tool
- The user asks for a premium, high-contrast, high-trust interface
- The current UI feels washed out, generic, or too expanded
- The app has multiple modules that need one shared shell and consistent hierarchy
- The interface must surface live signals, queue state, history, and deep links

---

## When NOT to use this skill

Do not apply this skill when:

- The project is a landing page or campaign site
- The product is intentionally minimal, calm, editorial, or consumer-soft
- The existing brand system already conflicts with aurora-glass language
- The screen is simple CRUD that should stay neutral and utilitarian
- The domain demands conventional enterprise neutrality over expressiveness

In those cases, borrow only the pieces that fit: density control, hierarchy discipline, grouped operational cards, or contextual rails.
