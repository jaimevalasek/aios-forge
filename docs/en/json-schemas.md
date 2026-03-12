# JSON Schemas

AIOS Forge exposes machine-readable JSON output on selected commands.

This folder provides formal schemas for automation:
- `docs/en/schemas/index.json`
- `docs/en/schemas/*.schema.json`

## Commands covered
- `aios-forge init <project-name> --json`
- `aios-forge install [path] --json`
- `aios-forge update [path] --json`
- `aios-forge info --json`
- `aios-forge agents [path] --json`
- `aios-forge agent:prompt <agent> [path] --json`
- `aios-forge locale:apply [path] --json`
- `aios-forge setup:context [path] --defaults --json`
- `aios-forge i18n:add <locale> --dry-run --json`
- `aios-forge doctor --json`
- `aios-forge context:validate --json`
- `aios-forge test:smoke --json`
- `aios-forge mcp:init --json`
- `aios-forge mcp:doctor --json`
- `aios-forge test:package --json`
- `aios-forge workflow:plan --json`
- `aios-forge parallel:init --json`
- `aios-forge parallel:assign --json`
- `aios-forge parallel:status --json`
- `aios-forge parallel:doctor --json`
- Generic CLI JSON errors (`unknown_command`, `command_error`)

## Compatibility policy
- Keys listed in each schema `required` array are stable for automation.
- New optional keys may be added in future releases.
- Removing or renaming required keys is a breaking change and must be called out in release notes.

## Suggested validation flow
1. Load schema from `docs/en/schemas/index.json`.
2. Validate command output against the corresponding schema.
3. Treat missing required keys as contract breakage.
4. Ignore unknown keys unless your integration explicitly disallows them.
