'use strict';

const MANAGED_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'OPENCODE.md',
  '.gemini/GEMINI.md',
  '.gemini/commands/aios-setup.toml',
  '.gemini/commands/aios-analyst.toml',
  '.gemini/commands/aios-architect.toml',
  '.gemini/commands/aios-pm.toml',
  '.gemini/commands/aios-dev.toml',
  '.gemini/commands/aios-qa.toml',
  '.gemini/commands/aios-orchestrator.toml',
  '.aios-lite/config.md',
  '.aios-lite/agents/setup.md',
  '.aios-lite/agents/analyst.md',
  '.aios-lite/agents/architect.md',
  '.aios-lite/agents/pm.md',
  '.aios-lite/agents/dev.md',
  '.aios-lite/agents/qa.md',
  '.aios-lite/agents/orchestrator.md',
  '.aios-lite/skills/static/laravel-conventions.md',
  '.aios-lite/skills/static/tall-stack-patterns.md',
  '.aios-lite/skills/static/jetstream-setup.md',
  '.aios-lite/skills/static/rails-conventions.md',
  '.aios-lite/skills/static/node-express-patterns.md',
  '.aios-lite/skills/static/nextjs-patterns.md',
  '.aios-lite/skills/static/ui-ux-modern.md',
  '.aios-lite/skills/static/git-conventions.md',
  '.aios-lite/skills/dynamic/laravel-docs.md',
  '.aios-lite/skills/dynamic/flux-ui-docs.md',
  '.aios-lite/skills/dynamic/npm-packages.md',
  '.aios-lite/mcp/servers.md'
];

const REQUIRED_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  '.aios-lite/config.md',
  '.aios-lite/agents/setup.md',
  '.aios-lite/agents/analyst.md',
  '.aios-lite/agents/dev.md',
  '.aios-lite/context/.gitkeep'
];

module.exports = {
  MANAGED_FILES,
  REQUIRED_FILES
};
