# AIOS Forge

Lightweight AI agent framework for software projects.

## Requirements

**Core**

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 18.0.0 | Required by the CLI itself |
| An AI CLI tool | — | At least one: [Claude Code](https://claude.ai/code), [Codex CLI](https://github.com/openai/codex), [Gemini CLI](https://github.com/google-gemini/gemini-cli), or [OpenCode](https://opencode.ai) |

**Optional — by feature**

| Feature | Extra requirement |
|---------|-------------------|
| `scan:project` (brownfield scanner) | `aios-forge-models.json` with a cheap LLM API key (DeepSeek, OpenAI, Gemini, Groq, Together, Mistral, or Anthropic) |
| `qa:run` / `qa:scan` (browser QA) | Playwright + Chromium: `npm install -g playwright && npx playwright install chromium` |
| `mcp:init` / `mcp:doctor` | MCP-compatible tool (Claude Code, Gemini CLI, OpenCode, or Codex CLI with MCP support) |
| Web3 support | Project must use a supported chain toolchain (Hardhat, Foundry, Anchor, etc.) |

## Install

```bash
npx aios-forge init my-project
# or
npx aios-forge install
```

## Legacy projects and custom stacks
You can run AIOS Forge on existing/legacy projects (not only new projects).

```bash
# inside an existing project
npx aios-forge install .
aios-forge setup:context . --defaults --framework="CodeIgniter 3" --backend="CodeIgniter 3" --database="MySQL"

# generate discovery.md + skeleton-system.md using a cheap LLM (saves tokens in your AI session)
# requires aios-forge-models.json with your API key
aios-forge scan:project
```

If your stack is not listed in menus, use free-text values via `--framework`, `--backend`, `--frontend`, `--database`, `--auth`, and `--uiux`.

## Commands

**Setup and install**
- [`aios-forge init`](docs/en/cli-reference.md#init) `<project-name> [--lang=en|pt-BR|es|fr] [--tool=codex|claude|gemini|opencode]`
- [`aios-forge install`](docs/en/cli-reference.md#install) `[path] [--lang=en|pt-BR|es|fr] [--tool=codex|claude|gemini|opencode]`
- [`aios-forge update`](docs/en/cli-reference.md#update) `[path] [--lang=en|pt-BR|es|fr]`
- [`aios-forge info`](docs/en/cli-reference.md#info) `[path] [--json]`
- [`aios-forge doctor`](docs/en/cli-reference.md#doctor) `[path] [--fix] [--dry-run] [--json]`
- [`aios-forge setup:context`](docs/en/cli-reference.md#setupcontext) `[path] [--defaults] [--framework=<name>] [--lang=en|pt-BR|es|fr]`
- [`aios-forge context:validate`](docs/en/cli-reference.md#contextvalidate) `[path] [--json]`
- [`aios-forge scan:project`](docs/en/cli-reference.md#scanproject) `[path] [--provider=<name>] [--dry-run] [--json]`

**Agents**
- [`aios-forge agents`](docs/en/cli-reference.md#agents)
- [`aios-forge agent:prompt`](docs/en/cli-reference.md#agentprompt) `<agent> [--tool=codex|claude|gemini|opencode]`
- [`aios-forge workflow:plan`](docs/en/cli-reference.md#workflowplan) `[path] [--classification=MICRO|SMALL|MEDIUM] [--json]`

**Locale**
- [`aios-forge i18n:add`](docs/en/i18n.md#create-a-locale-scaffold) `<locale>`
- [`aios-forge locale:apply`](docs/en/i18n.md#apply-localized-agent-prompts) `[path] [--lang=en|pt-BR|es|fr]`

**Parallel orchestration**
- [`aios-forge parallel:init`](docs/en/parallel.md) `[path] [--workers=2..6] [--force] [--dry-run] [--json]`
- [`aios-forge parallel:assign`](docs/en/parallel.md#scope-assignment) `[path] [--source=auto|prd|architecture|discovery|<file>] [--workers=2..6] [--force] [--dry-run] [--json]`
- [`aios-forge parallel:status`](docs/en/parallel.md#status-overview) `[path] [--json]`
- [`aios-forge parallel:doctor`](docs/en/parallel.md#diagnose-and-repair) `[path] [--workers=2..6] [--fix] [--force] [--dry-run] [--json]`

**MCP**
- [`aios-forge mcp:init`](docs/en/mcp.md#mcpinit) `[path] [--tool=claude|codex|gemini|opencode] [--dry-run] [--json]`
- [`aios-forge mcp:doctor`](docs/en/mcp.md#mcpdoctor) `[path] [--strict-env] [--json]`

**Browser QA (Playwright)**
- [`aios-forge qa:init`](docs/en/qa-browser.md#qainit) `[path] [--url=<app-url>] [--dry-run] [--json]`
- [`aios-forge qa:doctor`](docs/en/qa-browser.md#qadoctor) `[path] [--json]`
- [`aios-forge qa:run`](docs/en/qa-browser.md#qarun) `[path] [--url=<app-url>] [--persona=naive|hacker|power|mobile] [--headed] [--html] [--json]`
- [`aios-forge qa:scan`](docs/en/qa-browser.md#qascan) `[path] [--url=<app-url>] [--depth=3] [--max-pages=50] [--headed] [--html] [--json]`
- [`aios-forge qa:report`](docs/en/qa-browser.md#qareport) `[path] [--html] [--json]`

**Testing and validation (CI / contributors)**
- [`aios-forge test:smoke`](docs/en/cli-reference.md#testsmoke) `[workspace-path] [--lang=en|pt-BR|es|fr] [--web3=ethereum|solana|cardano] [--profile=standard|mixed|parallel] [--keep] [--json]`
- [`aios-forge test:package`](docs/en/cli-reference.md#testpackage) `[source-path] [--keep] [--dry-run] [--json]`

## Agent usage helper

If your AI CLI does not show a visual agent picker, these commands let you interact with agents directly from the terminal. See the [CLI reference](docs/en/cli-reference.md) for full docs on each.

**Discover agents**
- [`aios-forge agents`](docs/en/cli-reference.md#agents) — list all agents and their paths
- [`aios-forge agent:prompt setup --tool=codex`](docs/en/cli-reference.md#agentprompt) — get activation prompt for any agent
- [`aios-forge workflow:plan --classification=SMALL`](docs/en/cli-reference.md#workflowplan) — see the recommended agent sequence

**Setup and locale**
- [`aios-forge init my-project --lang=pt-BR --tool=codex`](docs/en/cli-reference.md#init)
- [`aios-forge install --lang=es --tool=claude`](docs/en/cli-reference.md#install)
- [`aios-forge update --lang=fr`](docs/en/cli-reference.md#update)
- [`aios-forge locale:apply --lang=pt-BR`](docs/en/i18n.md#apply-localized-agent-prompts)

**Maintenance**
- [`aios-forge doctor --fix`](docs/en/cli-reference.md#doctor) — restore any missing managed files

**Parallel orchestration**
- [`aios-forge parallel:init --workers=3`](docs/en/parallel.md)
- [`aios-forge parallel:assign --source=architecture --workers=3`](docs/en/parallel.md#scope-assignment)
- [`aios-forge parallel:status`](docs/en/parallel.md#status-overview)
- [`aios-forge parallel:doctor --fix --dry-run`](docs/en/parallel.md#diagnose-and-repair)

**MCP**
- [`aios-forge mcp:init --dry-run`](docs/en/mcp.md#mcpinit)
- [`aios-forge mcp:doctor --strict-env`](docs/en/mcp.md#mcpdoctor)

**Browser QA**
- [`aios-forge qa:init --url=http://localhost:3000`](docs/en/qa-browser.md#qainit)
- [`aios-forge qa:doctor`](docs/en/qa-browser.md#qadoctor)
- [`aios-forge qa:run --persona=hacker`](docs/en/qa-browser.md#qarun)
- [`aios-forge qa:run --html`](docs/en/qa-browser.md#html-reports) — visual HTML report in `reports/`
- [`aios-forge qa:scan --depth=2 --max-pages=30`](docs/en/qa-browser.md#qascan)
- [`aios-forge qa:report --html`](docs/en/qa-browser.md#html-reports) — retroactive HTML from last run
- [`aios-forge qa:report`](docs/en/qa-browser.md#qareport)

**Integration tests (CI)**
- [`aios-forge test:smoke --lang=pt-BR`](docs/en/cli-reference.md#testsmoke)
- [`aios-forge test:smoke --web3=ethereum`](docs/en/cli-reference.md#testsmoke)
- [`aios-forge test:smoke --profile=parallel`](docs/en/cli-reference.md#testsmoke)
- [`aios-forge test:package --dry-run`](docs/en/cli-reference.md#testpackage)

Default planning includes `@product` → `@ux-ui` for SMALL/MEDIUM projects.

## JSON output for CI
Use `--json` on selected commands. See [JSON schemas](docs/en/json-schemas.md) for output contracts.
- `aios-forge init <project-name> --json`
- `aios-forge install [path] --json`
- `aios-forge update [path] --json`
- `aios-forge agents [path] --json`
- `aios-forge agent:prompt <agent> [path] --json`
- `aios-forge locale:apply [path] --json`
- `aios-forge setup:context [path] --defaults --json`
- `aios-forge i18n:add <locale> --dry-run --json`
- `aios-forge info --json`
- `aios-forge doctor --json`
- `aios-forge context:validate --json`
- `aios-forge test:smoke --json`
- `aios-forge parallel:init --json`
- `aios-forge parallel:assign --json`
- `aios-forge parallel:status --json`
- `aios-forge parallel:doctor --json`
- `aios-forge mcp:doctor --json`
- `aios-forge qa:run --json`
- `aios-forge qa:scan --json`
- `aios-forge qa:doctor --json`
- `aios-forge qa:report --json`
- `aios-forge scan:project --json`

## i18n
CLI localization is supported with:
- `--locale=<code>`
- `AIOS_LITE_LOCALE=<code>`

Built-in locales: `en`, `pt-BR`, `es`, `fr`.
Default locale is `en`.
`pt`, `pt_br`, and `pt-BR` resolve to the same Portuguese dictionary.
`es-*` resolves to `es`, and `fr-*` resolves to `fr`.
Localized agent packs are built-in for `en`, `pt-BR`, `es`, and `fr`.

Generate a new locale scaffold:

```bash
aios-forge i18n:add fr
```

## Multi-IDE support
- Claude Code (`CLAUDE.md`)
- Codex CLI (`AGENTS.md`)
- Gemini CLI (`.gemini/GEMINI.md`)
- OpenCode (`OPENCODE.md`)

## Web3 support
See the [Web3 guide](docs/en/web3.md) for the full reference.
- `project_type=dapp` is supported in context validation and setup.
- Framework detection now includes:
  - Ethereum: `Hardhat`, `Foundry`, `Truffle`
  - Solana: `Anchor`, `Solana Web3`
  - Cardano: `Cardano` (Aiken/Cardano SDK signals)
- `setup:context` supports Web3 fields:
  - `--web3-enabled=true|false`
  - `--web3-networks=ethereum,solana`
  - `--contract-framework=Hardhat`
  - `--wallet-provider=wagmi`
  - `--indexer=The Graph`
  - `--rpc-provider=Alchemy`

## Docs

**CLI reference**
- [CLI reference](docs/en/cli-reference.md) — `init`, `install`, `update`, `info`, `doctor`, `setup:context`, `context:validate`, `agents`, `agent:prompt`, `workflow:plan`, `test:smoke`, `test:package`

**Feature guides**
- [i18n guide](docs/en/i18n.md) — `i18n:add`, `locale:apply`, locale resolution
- [Parallel orchestration](docs/en/parallel.md) — `parallel:init`, `parallel:assign`, `parallel:status`, `parallel:doctor`
- [MCP guide](docs/en/mcp.md) — `mcp:init`, `mcp:doctor`
- [Browser QA guide](docs/en/qa-browser.md) — `qa:init`, `qa:doctor`, `qa:run`, `qa:scan`, `qa:report`
- [Web3 guide](docs/en/web3.md) — `project_type=dapp`, framework detection, Web3 context fields
- [JSON schemas](docs/en/json-schemas.md) — `--json` output contracts for all commands

**Release (internal)**
- [Release guide](docs/en/release.md)
- [Release flow](docs/en/release-flow.md)
- [Release notes template](docs/en/release-notes-template.md)

**Portuguese guides**
- [Início rápido](docs/pt/inicio-rapido.md)
- [Guia de agentes](docs/pt/agentes.md)
- [Squad e Genoma](docs/pt/squad-genoma.md)
- [Cenários de uso](docs/pt/cenarios.md)
- [Clientes AI](docs/pt/clientes-ai.md)
- [Guia do engenheiro](docs/pt/guia-engineer.md)

## MCP bootstrap
Generate a local MCP server recommendation file from `project.context.md`:

```bash
aios-forge mcp:init
aios-forge mcp:init --dry-run
aios-forge mcp:init --tool=codex
aios-forge mcp:doctor
aios-forge mcp:doctor --strict-env
```

`mcp:init` generates:
- `.aios-forge/mcp/servers.local.json` (project MCP plan)
- `.aios-forge/mcp/presets/<tool>.json` (tool-specific preset templates)
- Context7/Database presets in remote-endpoint mode (`mcp-remote`) using:
  - `CONTEXT7_MCP_URL`
  - `DATABASE_MCP_URL` (when database MCP is enabled)

`mcp:doctor` validates:
- core MCP servers (`filesystem`, `context7`)
- preset coverage
- required env vars from enabled servers
- context compatibility for database and Web3 (`chain-rpc`)

## License
MIT
