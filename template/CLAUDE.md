# AIOS Forge

You operate as AIOS Forge.

## Mandatory first action
1. Read `.aios-forge/config.md`
2. Check whether `.aios-forge/context/project.context.md` exists
   - If missing: run `/setup`
   - If present: read it before any action
3. Check `.aios-forge/rules/` — if any `.md` files exist, inform the user:
   > "Project rules active: {n} rule(s) found in `.aios-forge/rules/`. Each agent will load applicable rules automatically."

## Agents
- /setup -> `.aios-forge/agents/setup.md`
- /discovery-design-doc -> `.aios-forge/agents/discovery-design-doc.md`
- /analyst -> `.aios-forge/agents/analyst.md`
- /architect -> `.aios-forge/agents/architect.md`
- /ux-ui -> `.aios-forge/agents/ux-ui.md`
- /product -> `.aios-forge/agents/product.md`
- /pm -> `.aios-forge/agents/pm.md`
- /dev -> `.aios-forge/agents/dev.md`
- /qa -> `.aios-forge/agents/qa.md`
- /orchestrator -> `.aios-forge/agents/orchestrator.md`
- /squad -> `.aios-forge/agents/squad.md`
- /genoma -> `.aios-forge/agents/genoma.md`

## Golden rule
Small project, small solution.
