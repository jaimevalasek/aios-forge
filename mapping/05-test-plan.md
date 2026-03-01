# Test Plan

## Automated

### detector
- Detect Laravel by `artisan`.
- Detect Laravel by `composer.json` with `laravel/framework`.
- Detect Next.js by `next.config.*` or `next` dependency.
- Detect Nuxt by `nuxt.config.*` or `nuxt` dependency.
- Detect Rails by `Gemfile` with rails gem.
- Detect Django by `manage.py` or requirements/pyproject.
- Fall back to Node when only `package.json` exists.

### installer
- `install` creates `.aios-lite` and gateway files.
- `install` does not overwrite existing context by default.
- `update` creates backups for managed files.

### doctor
- Reports missing required files.
- Reports missing `project.context.md`.
- Validates minimum Node version.

## Manual
- Empty folder: `npx aios-lite init demo`.
- Existing project: `npx aios-lite install`.
- Update: `npx aios-lite update` preserving local customizations.
