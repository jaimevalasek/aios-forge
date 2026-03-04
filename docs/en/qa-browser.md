# QA Browser Testing Guide

AIOS Lite includes a built-in browser QA engine powered by [Playwright](https://playwright.dev). It opens a real Chrome browser, runs automated tests across multiple personas, and generates a report in the same format as the `@qa` agent — so both can be used together.

No LLM required. No separate tool to install beyond Playwright itself.

---

## Prerequisites

```bash
npm install -g playwright
npx playwright install chromium
```

Verify everything is ready:

```bash
aios-lite qa:doctor
```

---

## Quick start

```bash
# 1. Generate config (reads prd.md and discovery.md automatically)
aios-lite qa:init --url=http://localhost:3000

# 2. Start your application, then run
aios-lite qa:run

# 3. View the report
aios-lite qa:report
```

Output files written to the project root:
- `aios-qa-report.md` — full report (same severity format as `@qa`)
- `aios-qa-report.json` — machine-readable for CI/CD
- `aios-qa-screenshots/` — screenshot evidence per finding

---

## Commands

### `qa:init`

Generates `aios-qa.config.json` from your project context.

```bash
aios-lite qa:init [path] [--url=<app-url>] [--dry-run] [--json]
```

If `.aios-lite/context/project.context.md` exists, the project name and language are read automatically. If `prd.md` exists, acceptance criteria are extracted and added as test scenarios.

**Flags:**

| Flag | Description |
|------|-------------|
| `--url=<url>` | Target application URL (default: `http://localhost:3000`) |
| `--dry-run` | Preview config without writing |
| `--json` | Output result as JSON |

**Example output — `aios-qa.config.json`:**

```json
{
  "project_name": "MyApp",
  "url": "http://localhost:3000",
  "language": "en",
  "personas": ["naive", "hacker", "power", "mobile"],
  "security_probes": [
    "exposed_env_vars", "xss_inputs", "open_redirect",
    "sensitive_files", "idor_probe", "console_leaks",
    "debug_routes", "mixed_content", "sensitive_get_params"
  ],
  "performance_thresholds": {
    "page_load_ms": 3000,
    "ttfb_ms": 800,
    "requests_max": 80,
    "transfer_max_kb": 2048
  },
  "accessibility": true,
  "network_capture": true,
  "screenshot_on_finding": true,
  "scenarios": []
}
```

---

### `qa:doctor`

Checks all prerequisites before running tests.

```bash
aios-lite qa:doctor [path] [--json]
```

**Checks performed:**

| Check | Severity |
|-------|----------|
| Playwright package installed | Error |
| Chromium binary found | Error |
| `aios-qa.config.json` exists and is valid JSON | Error |
| Target URL is reachable | Warning |
| `project.context.md` present (enriches tests) | Warning |
| `prd.md` present (enables AC coverage) | Warning |

**Example:**

```
[OK]   playwright.installed - Playwright is installed.
[OK]   chromium.binary - Chromium browser binary found.
[OK]   config.exists - aios-qa.config.json found and valid.
[OK]   url.reachable - Target URL is reachable (http://localhost:3000).
[OK]   context.exists - project.context.md found.
[WARN] prd.md — prd.md not found — AC coverage mapping will be skipped.
Summary: 5 passed, 0 failed, 1 warnings.
```

---

### `qa:run`

Runs a full browser QA session: 4 personas, security probes, accessibility audit, performance capture, and AC coverage.

```bash
aios-lite qa:run [path] [--url=<app-url>] [--persona=naive|hacker|power|mobile] [--headed] [--json]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--url=<url>` | Override URL from config |
| `--persona=<name>` | Run only one persona |
| `--headed` | Show browser window (useful for debugging) |
| `--json` | Output result as JSON |

#### Personas

**`naive` — Clumsy user**
- Submits all forms empty → detects unhandled 5xx
- Types 10,000-character strings → detects missing length validation
- Clicks elements with `cursor:pointer` that have no handler → detects ghost clickables

**`hacker` — Attacker mindset**
- Scans `window.__NEXT_DATA__`, `window.__env__`, `window.ENV`, `window.CONFIG` for exposed secrets (OpenAI, Stripe, AWS, Google, GitHub, Slack patterns)
- Scans rendered HTML source for the same patterns
- Tries 10 sensitive file URLs: `/.env`, `/.env.local`, `/.env.production`, `/.git/config`, `/config.js`, and more
- Injects XSS payload in all text inputs, detects execution
- Probes 8 redirect parameters for open redirect
- Types SQL injection payload, detects DB error messages in response
- Tests IDOR: increments/decrements numeric IDs in URL by ±1 and +9999
- Checks 8 debug/admin routes for unauthenticated access

**`power` — Keyboard-only, boundary values**
- Tabs through all interactive elements, detects missing visible focus indicator
- Enters boundary values in number/range inputs: `-999999999`, `0`, `999999999999999`
- Enters edge dates: `1900-01-01`, `9999-12-31`, `2000-02-29`

**`mobile` — iPhone SE (375×667)**
- Detects horizontal overflow (content wider than viewport)
- Flags touch targets smaller than 44×44px (WCAG 2.5.5)
- Flags text smaller than 12px

#### Security probes (post-persona, network layer)
- Console errors containing stack traces → Medium finding
- Sensitive parameter names (`token`, `password`, `api_key`) in GET URLs → High finding
- HTTP requests from HTTPS page (mixed content) → Medium finding

#### Accessibility audit
- Images missing `alt` attribute (WCAG 1.1.1)
- Form inputs with no accessible label (WCAG 1.3.1)
- Buttons with no accessible name (WCAG 4.1.2)
- Heading levels skipped (e.g. `h1` → `h3`)
- `<html>` missing `lang` attribute (WCAG 3.1.1)

#### Performance capture
| Metric | Default threshold |
|--------|------------------|
| Page load complete | 3000ms |
| Time to First Byte (TTFB) | 800ms |
| Network request count | 80 |
| Total transfer size | 2048KB |

Thresholds are configurable in `aios-qa.config.json` under `performance_thresholds`.

#### AC coverage
If `prd.md` exists, acceptance criteria are extracted from the table and 🔴 must-have items. For each AC, a screenshot is taken of the current page state and saved to `aios-qa-screenshots/`.

---

### `qa:scan`

Autonomous crawl mode. No pre-defined scenarios needed — the tool discovers all routes and probes each one.

```bash
aios-lite qa:scan [path] [--url=<app-url>] [--depth=3] [--max-pages=50] [--headed] [--json]
```

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--url=<url>` | from config | Override base URL |
| `--depth=<n>` | `3` | Max crawl depth from base URL |
| `--max-pages=<n>` | `50` | Max pages to visit |
| `--headed` | false | Show browser window |
| `--json` | false | Output result as JSON |

**What it does on each route:**
- Scans HTML source and window globals for exposed secrets
- Checks for stack trace leakage in console errors
- Accessibility quick check (images alt, html lang)
- Horizontal overflow detection

Sensitive files (`/.env`, `/.git/config`, etc.) are probed once per domain at the start of the scan.

---

### `qa:report`

Displays the last generated report.

```bash
aios-lite qa:report [path] [--json]
```

In JSON mode, returns the parsed `aios-qa-report.json` content.

---

## Integration with @qa agent

When the `@qa` agent runs, it automatically checks for `aios-qa-report.md` in the project root. If found, it:

1. Maps browser findings to AC status — any AC that failed in the browser is marked **Missing**
2. Promotes severity — if both static review and browser test flag the same issue, severity goes up one level
3. Adds a **Browser findings (aios-qa)** subsection to its report
4. Tags ACs that passed in the browser with `[browser-validated]`

This means running `aios-lite qa:run` before `@qa` gives you a richer, more complete QA report with zero extra effort.

---

## Typical workflow

Two terminals, running in parallel:

```bash
# Terminal 1 — aios-lite agents
@setup → @product → @analyst → @architect → @dev

# Terminal 2 — browser QA (while app is running)
aios-lite qa:init --url=http://localhost:3000
aios-lite qa:run

# Terminal 1 — continues with merged findings
@qa   # reads aios-qa-report.md automatically
```

---

## CI/CD integration

`aios-qa-report.json` is written alongside the markdown report and is suitable for CI pipelines:

```bash
aios-lite qa:run --json | jq '.summary'
# { "critical": 0, "high": 1, "medium": 3, "low": 2 }

# Fail CI if any critical findings
aios-lite qa:run --json | jq 'if .summary.critical > 0 then error else . end'
```

For headless environments, Playwright runs in headless mode by default (no `--headed` flag needed in CI).

---

## Report severity reference

| Severity | Examples |
|----------|---------|
| **Critical** | Exposed API key, XSS executed, sensitive file accessible, SQL error exposed |
| **High** | IDOR potential, open redirect, 5xx on empty form, sensitive param in GET URL |
| **Medium** | Missing auth on debug route, console stack traces, TTFB > 800ms, accessibility violations |
| **Low** | Ghost clickable elements, touch targets < 44px, fonts < 12px, missing lang attribute |
