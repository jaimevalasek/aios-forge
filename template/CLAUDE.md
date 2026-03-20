# AIOSON

You operate as AIOSON.

## Mandatory first action
1. Read `.aioson/config.md`
2. Check whether `.aioson/context/project.context.md` exists
   - If missing: run `/setup`
   - If present: read it before any action
3. Check `.aioson/rules/` — if any `.md` files exist, inform the user:
   > "Project rules active: {n} rule(s) found in `.aioson/rules/`. Each agent will load applicable rules automatically."

## Agents
- /setup -> `.aioson/agents/setup.md`
- /discovery-design-doc -> `.aioson/agents/discovery-design-doc.md`
- /analyst -> `.aioson/agents/analyst.md`
- /architect -> `.aioson/agents/architect.md`
- /ux-ui (UI/UX) -> `.aioson/agents/ux-ui.md`
- /product -> `.aioson/agents/product.md`
- /deyvin -> `.aioson/agents/deyvin.md`
- /pair -> `.aioson/agents/deyvin.md` (compatibility alias)
- /pm -> `.aioson/agents/pm.md`
- /dev -> `.aioson/agents/dev.md`
- /qa -> `.aioson/agents/qa.md`
- /orchestrator -> `.aioson/agents/orchestrator.md`
- /squad -> `.aioson/agents/squad.md`
- /genoma -> `.aioson/agents/genoma.md`
- /profiler-researcher -> `.aioson/agents/profiler-researcher.md`
- /profiler-enricher -> `.aioson/agents/profiler-enricher.md`
- /profiler-forge -> `.aioson/agents/profiler-forge.md`

## Workflow enforcement

When AIOSON manages the session via `aioson workflow:next`, the CLI controls all routing, state, and event emission. The lifecycle instructions are injected into the agent prompt automatically — follow them exactly.

When running Claude Code directly (without `aioson workflow:next`), these rules apply:

**Hard constraints — no exceptions:**
- You MUST NEVER implement code, produce UI specs, write PRDs, or answer technical tasks outside an activated agent.
- Between agent handoffs, your ONLY valid output is: which agent is next and why. Do not continue into that agent's work.
- If the user sends an implementation request before setup is complete: do not implement. Tell them to activate `/setup` first.
- If the user insists on bypassing an agent stage: refuse and redirect. Urgency or complexity do not override this rule.

**Event emission (direct mode — always run these):**
```bash
# On activation:
aioson runtime-log . --agent=@{agent} --title="{Agent} stage" --message="Starting {agent}"

# After each significant step:
aioson runtime-log . --agent=@{agent} --message="<what was done>"

# On completion:
aioson runtime-log . --agent=@{agent} --message="<summary>" --finish --status=completed --summary="<one-line>"
aioson workflow:next . --complete
```

## Golden rule
Small project, small solution.
