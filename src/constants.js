'use strict';

const MANAGED_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'OPENCODE.md',
  '.gemini/GEMINI.md',
  '.gemini/commands/aios-setup.toml',
  '.gemini/commands/aios-discovery-design-doc.toml',
  '.gemini/commands/aios-analyst.toml',
  '.gemini/commands/aios-architect.toml',
  '.gemini/commands/aios-ux-ui.toml',
  '.gemini/commands/aios-pm.toml',
  '.gemini/commands/aios-dev.toml',
  '.gemini/commands/aios-qa.toml',
  '.gemini/commands/aios-orchestrator.toml',
  '.aios-forge/config.md',
  '.aios-forge/agents/setup.md',
  '.aios-forge/agents/discovery-design-doc.md',
  '.aios-forge/agents/analyst.md',
  '.aios-forge/agents/architect.md',
  '.aios-forge/agents/ux-ui.md',
  '.aios-forge/agents/product.md',
  '.aios-forge/agents/pm.md',
  '.aios-forge/agents/dev.md',
  '.aios-forge/agents/qa.md',
  '.aios-forge/agents/orchestrator.md',
  '.aios-forge/agents/squad.md',
  '.aios-forge/agents/genoma.md',
  '.aios-forge/agents/profiler-researcher.md',
  '.aios-forge/agents/profiler-enricher.md',
  '.aios-forge/agents/profiler-forge.md',
  '.aios-forge/locales/en/agents/setup.md',
  '.aios-forge/locales/en/agents/discovery-design-doc.md',
  '.aios-forge/locales/en/agents/analyst.md',
  '.aios-forge/locales/en/agents/architect.md',
  '.aios-forge/locales/en/agents/ux-ui.md',
  '.aios-forge/locales/en/agents/product.md',
  '.aios-forge/locales/en/agents/pm.md',
  '.aios-forge/locales/en/agents/dev.md',
  '.aios-forge/locales/en/agents/qa.md',
  '.aios-forge/locales/en/agents/orchestrator.md',
  '.aios-forge/locales/en/agents/squad.md',
  '.aios-forge/locales/en/agents/genoma.md',
  '.aios-forge/locales/en/agents/profiler-researcher.md',
  '.aios-forge/locales/en/agents/profiler-enricher.md',
  '.aios-forge/locales/en/agents/profiler-forge.md',
  '.aios-forge/locales/pt-BR/agents/setup.md',
  '.aios-forge/locales/pt-BR/agents/discovery-design-doc.md',
  '.aios-forge/locales/pt-BR/agents/analyst.md',
  '.aios-forge/locales/pt-BR/agents/architect.md',
  '.aios-forge/locales/pt-BR/agents/ux-ui.md',
  '.aios-forge/locales/pt-BR/agents/product.md',
  '.aios-forge/locales/pt-BR/agents/pm.md',
  '.aios-forge/locales/pt-BR/agents/dev.md',
  '.aios-forge/locales/pt-BR/agents/qa.md',
  '.aios-forge/locales/pt-BR/agents/orchestrator.md',
  '.aios-forge/locales/pt-BR/agents/squad.md',
  '.aios-forge/locales/pt-BR/agents/genoma.md',
  '.aios-forge/locales/pt-BR/agents/profiler-researcher.md',
  '.aios-forge/locales/pt-BR/agents/profiler-enricher.md',
  '.aios-forge/locales/pt-BR/agents/profiler-forge.md',
  '.aios-forge/locales/es/agents/setup.md',
  '.aios-forge/locales/es/agents/discovery-design-doc.md',
  '.aios-forge/locales/es/agents/analyst.md',
  '.aios-forge/locales/es/agents/architect.md',
  '.aios-forge/locales/es/agents/ux-ui.md',
  '.aios-forge/locales/es/agents/product.md',
  '.aios-forge/locales/es/agents/pm.md',
  '.aios-forge/locales/es/agents/dev.md',
  '.aios-forge/locales/es/agents/qa.md',
  '.aios-forge/locales/es/agents/orchestrator.md',
  '.aios-forge/locales/es/agents/squad.md',
  '.aios-forge/locales/es/agents/genoma.md',
  '.aios-forge/locales/es/agents/profiler-researcher.md',
  '.aios-forge/locales/es/agents/profiler-enricher.md',
  '.aios-forge/locales/es/agents/profiler-forge.md',
  '.aios-forge/locales/fr/agents/setup.md',
  '.aios-forge/locales/fr/agents/discovery-design-doc.md',
  '.aios-forge/locales/fr/agents/analyst.md',
  '.aios-forge/locales/fr/agents/architect.md',
  '.aios-forge/locales/fr/agents/ux-ui.md',
  '.aios-forge/locales/fr/agents/product.md',
  '.aios-forge/locales/fr/agents/pm.md',
  '.aios-forge/locales/fr/agents/dev.md',
  '.aios-forge/locales/fr/agents/qa.md',
  '.aios-forge/locales/fr/agents/orchestrator.md',
  '.aios-forge/locales/fr/agents/squad.md',
  '.aios-forge/locales/fr/agents/genoma.md',
  '.aios-forge/locales/fr/agents/profiler-researcher.md',
  '.aios-forge/locales/fr/agents/profiler-enricher.md',
  '.aios-forge/locales/fr/agents/profiler-forge.md',
  '.aios-forge/skills/static/laravel-conventions.md',
  '.aios-forge/skills/static/tall-stack-patterns.md',
  '.aios-forge/skills/static/jetstream-setup.md',
  '.aios-forge/skills/static/rails-conventions.md',
  '.aios-forge/skills/static/node-express-patterns.md',
  '.aios-forge/skills/static/node-typescript-patterns.md',
  '.aios-forge/skills/static/nextjs-patterns.md',
  '.aios-forge/skills/static/ui-ux-modern.md',
  '.aios-forge/skills/static/web3-ethereum-patterns.md',
  '.aios-forge/skills/static/web3-solana-patterns.md',
  '.aios-forge/skills/static/web3-cardano-patterns.md',
  '.aios-forge/skills/static/web3-security-checklist.md',
  '.aios-forge/skills/static/git-conventions.md',
  '.aios-forge/skills/static/premium-command-center-ui.md',
  '.aios-forge/skills/references/premium-command-center-ui/visual-system-and-component-patterns.md',
  '.aios-forge/skills/references/premium-command-center-ui/operational-ux-playbook.md',
  '.aios-forge/skills/references/premium-command-center-ui/master-application-prompt.md',
  '.aios-forge/skills/references/premium-command-center-ui/quality-validation-checklist.md',
  '.aios-forge/skills/dynamic/laravel-docs.md',
  '.aios-forge/skills/dynamic/flux-ui-docs.md',
  '.aios-forge/skills/dynamic/npm-packages.md',
  '.aios-forge/skills/dynamic/ethereum-docs.md',
  '.aios-forge/skills/dynamic/solana-docs.md',
  '.aios-forge/skills/dynamic/cardano-docs.md',
  '.aios-forge/mcp/servers.md',
  '.aios-forge/schemas/genome.schema.json',
  '.aios-forge/schemas/genome-meta.schema.json',
  '.aios-forge/schemas/squad-manifest.schema.json',
  '.aios-forge/schemas/squad-blueprint.schema.json',
  '.aios-forge/schemas/readiness.schema.json',
  '.aios-forge/schemas/content-blueprint.schema.json',
  '.aios-forge/schemas/genome.schema.json',
  '.aios-forge/schemas/genome-meta.schema.json',
  '.aios-forge/tasks/squad-design.md',
  '.aios-forge/tasks/squad-create.md',
  '.aios-forge/tasks/squad-validate.md',
  '.aios-forge/tasks/squad-analyze.md',
  '.aios-forge/tasks/squad-extend.md',
  '.aios-forge/tasks/squad-export.md',
  '.aios-forge/tasks/squad-repair.md',
  '.aios-forge/tasks/squad-pipeline.md',
  '.aios-forge/profiler-reports/.gitkeep',
  '.aios-forge/advisors/.gitkeep'
];

const REQUIRED_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'OPENCODE.md',
  '.gemini/GEMINI.md',
  '.gemini/commands/aios-setup.toml',
  '.gemini/commands/aios-discovery-design-doc.toml',
  '.gemini/commands/aios-analyst.toml',
  '.gemini/commands/aios-architect.toml',
  '.gemini/commands/aios-ux-ui.toml',
  '.gemini/commands/aios-pm.toml',
  '.gemini/commands/aios-dev.toml',
  '.gemini/commands/aios-qa.toml',
  '.gemini/commands/aios-orchestrator.toml',
  '.aios-forge/config.md',
  '.aios-forge/agents/setup.md',
  '.aios-forge/agents/discovery-design-doc.md',
  '.aios-forge/agents/analyst.md',
  '.aios-forge/agents/ux-ui.md',
  '.aios-forge/agents/dev.md',
  '.aios-forge/context/.gitkeep'
];

const CONTEXT_REQUIRED_FIELDS = [
  'project_name',
  'project_type',
  'profile',
  'framework',
  'framework_installed',
  'classification',
  'conversation_language',
  'aios_forge_version'
];

const CONTEXT_ALLOWED_CLASSIFICATIONS = ['MICRO', 'SMALL', 'MEDIUM'];
const CONTEXT_ALLOWED_PROJECT_TYPES = ['web_app', 'api', 'site', 'script', 'dapp'];
const CONTEXT_ALLOWED_PROFILES = ['developer', 'beginner', 'team'];

const AGENT_DEFINITIONS = [
  {
    id: 'setup',
    command: '@setup',
    path: '.aios-forge/agents/setup.md',
    dependsOn: [],
    output: '.aios-forge/context/project.context.md'
  },
  {
    id: 'discovery-design-doc',
    command: '@discovery-design-doc',
    path: '.aios-forge/agents/discovery-design-doc.md',
    dependsOn: ['.aios-forge/context/project.context.md'],
    output: '.aios-forge/context/design-doc.md + .aios-forge/context/readiness.md'
  },
  {
    id: 'product',
    command: '@product',
    path: '.aios-forge/agents/product.md',
    dependsOn: ['.aios-forge/context/project.context.md'],
    output: '.aios-forge/context/prd.md or .aios-forge/context/prd-{slug}.md (PRD base)'
  },
  {
    id: 'analyst',
    command: '@analyst',
    path: '.aios-forge/agents/analyst.md',
    dependsOn: ['.aios-forge/context/project.context.md'],
    output: '.aios-forge/context/discovery.md'
  },
  {
    id: 'architect',
    command: '@architect',
    path: '.aios-forge/agents/architect.md',
    dependsOn: [
      '.aios-forge/context/project.context.md',
      '.aios-forge/context/discovery.md'
    ],
    output: '.aios-forge/context/architecture.md'
  },
  {
    id: 'ux-ui',
    command: '@ux-ui',
    path: '.aios-forge/agents/ux-ui.md',
    dependsOn: [
      '.aios-forge/context/project.context.md',
      '.aios-forge/context/prd.md or .aios-forge/context/prd-{slug}.md',
      '.aios-forge/context/discovery.md',
      '.aios-forge/context/architecture.md'
    ],
    output: '.aios-forge/context/ui-spec.md + Visual identity enrichment in prd.md or prd-{slug}.md'
  },
  {
    id: 'pm',
    command: '@pm',
    path: '.aios-forge/agents/pm.md',
    dependsOn: [
      '.aios-forge/context/project.context.md',
      '.aios-forge/context/prd.md or .aios-forge/context/prd-{slug}.md',
      '.aios-forge/context/discovery.md',
      '.aios-forge/context/architecture.md'
    ],
    output: '.aios-forge/context/prd.md or prd-{slug}.md (enriched with delivery plan and acceptance criteria)'
  },
  {
    id: 'dev',
    command: '@dev',
    path: '.aios-forge/agents/dev.md',
    dependsOn: [
      '.aios-forge/context/project.context.md',
      '.aios-forge/context/discovery.md',
      '.aios-forge/context/architecture.md'
    ],
    output: 'code changes'
  },
  {
    id: 'qa',
    command: '@qa',
    path: '.aios-forge/agents/qa.md',
    dependsOn: ['.aios-forge/context/discovery.md'],
    output: 'QA report'
  },
  {
    id: 'orchestrator',
    command: '@orchestrator',
    path: '.aios-forge/agents/orchestrator.md',
    dependsOn: [
      '.aios-forge/context/discovery.md',
      '.aios-forge/context/architecture.md',
      '.aios-forge/context/prd.md'
    ],
    output: '.aios-forge/context/parallel/*.status.md'
  },
  {
    id: 'squad',
    command: '@squad',
    path: '.aios-forge/agents/squad.md',
    dependsOn: [],
    output:
      '.aios-forge/squads/{slug}/squad.manifest.json + .aios-forge/squads/{slug}/squad.md + .aios-forge/squads/{slug}/agents/ + .aios-forge/squads/{slug}/skills/ + .aios-forge/squads/{slug}/templates/ + .aios-forge/squads/{slug}/docs/ + output/{slug}/{session-id}.html + output/{slug}/{content-key}/content.json + output/{slug}/{content-key}/index.html + output/{slug}/latest.html + aios-logs/{slug}/ + media/{slug}/'
  },
  {
    id: 'genoma',
    command: '@genoma',
    path: '.aios-forge/agents/genoma.md',
    dependsOn: [],
    output: '.aios-forge/genomas/[slug].md + .aios-forge/genomas/[slug].meta.json + optional binding in .aios-forge/squads/{slug}/squad.md or .aios-forge/squads/{slug}/squad.manifest.json'
  },
  {
    id: 'profiler-researcher',
    command: '@profiler-researcher',
    path: '.aios-forge/agents/profiler-researcher.md',
    dependsOn: [],
    output: '.aios-forge/profiler-reports/{person-slug}/research-report.md'
  },
  {
    id: 'profiler-enricher',
    command: '@profiler-enricher',
    path: '.aios-forge/agents/profiler-enricher.md',
    dependsOn: ['.aios-forge/profiler-reports/{person-slug}/research-report.md'],
    output: '.aios-forge/profiler-reports/{person-slug}/enriched-profile.md'
  },
  {
    id: 'profiler-forge',
    command: '@profiler-forge',
    path: '.aios-forge/agents/profiler-forge.md',
    dependsOn: ['.aios-forge/profiler-reports/{person-slug}/enriched-profile.md'],
    output: '.aios-forge/genomas/{person-slug}-{domain-slug}.md + .aios-forge/genomas/{person-slug}-{domain-slug}.meta.json + .aios-forge/advisors/{person-slug}-advisor.md'
  }
];

module.exports = {
  MANAGED_FILES,
  REQUIRED_FILES,
  CONTEXT_REQUIRED_FIELDS,
  CONTEXT_ALLOWED_CLASSIFICATIONS,
  CONTEXT_ALLOWED_PROJECT_TYPES,
  CONTEXT_ALLOWED_PROFILES,
  AGENT_DEFINITIONS
};
