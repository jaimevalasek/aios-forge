'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { exists, ensureDir } = require('../utils');

const MY_AGENTS_DIR = '.aioson/my-agents';
const SQUADS_DIR = '.aioson/squads';

function resolveTargetDir(args) {
  return path.resolve(process.cwd(), args[0] || '.');
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildAgentTemplate(slug, opts) {
  const {
    mission = '',
    focus = [],
    scope = 'my-agents',
    squadSlug = null,
    squadName = null,
    disc = null,
    responseStandard = null,
    constraints = []
  } = opts;

  const identity = scope === 'squad' && squadSlug
    ? `<!-- identity: squad:${squadSlug}/${slug} -->`
    : `<!-- identity: my-agent:${slug} -->`;

  const rulesSection = scope === 'squad' && squadSlug
    ? `> **Project rules**: Before starting, check \`.aioson/rules/\` in the project root.
> For each \`.md\` file found: read YAML frontmatter. Load if \`agents:\` is absent (universal),
> or if \`agents:\` includes \`squad:${squadSlug}/${slug}\` or \`squad:${squadSlug}\`. Otherwise skip.`
    : `> **Project rules**: Before starting, check \`.aioson/rules/\` in the project root.
> For each \`.md\` file found: read YAML frontmatter. Load if \`agents:\` is absent (universal),
> or if \`agents:\` includes \`${slug}\`. Otherwise skip.`;

  const contextSection = scope === 'squad' && squadSlug
    ? `## Quick context
Squad: ${squadName || squadSlug} | Agent: @${slug}
`
    : '';

  const discLine = disc ? `\n## Behavioral profile\nDISC: ${disc}\n` : '';

  const focusLines = focus.length > 0
    ? `\n## Focus\n${focus.map(f => `- ${f}`).join('\n')}\n`
    : `\n## Focus\n- [Define focus areas]\n`;

  const responseLine = responseStandard
    ? `\n## Response standard\n${responseStandard}\n`
    : '';

  const constraintLines = constraints.length > 0
    ? `\n## Hard constraints\n${constraints.map(c => `- ${c}`).join('\n')}\n`
    : `\n## Hard constraints\n- Follow project conventions and rules\n- Use \`conversation_language\` from project context for all interaction\n`;

  return `# Agent @${slug}

${identity}

> ⚡ **ACTIVATED** — Execute immediately as @${slug}.

${rulesSection}

## Mission
${mission || '[Define the agent mission]'}

${contextSection}${discLine}${focusLines}${responseLine}${constraintLines}
## Output contract
[Define what artifacts this agent produces and where they go]
`;
}

async function listSquads(projectDir) {
  const squadsDir = path.join(projectDir, SQUADS_DIR);
  if (!(await exists(squadsDir))) return [];

  const entries = await fs.readdir(squadsDir, { withFileTypes: true });
  const squads = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const manifestPath = path.join(squadsDir, entry.name, 'squad.manifest.json');
    if (await exists(manifestPath)) {
      try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(raw);
        squads.push({ slug: entry.name, name: manifest.name || entry.name });
      } catch {
        squads.push({ slug: entry.name, name: entry.name });
      }
    }
  }
  return squads;
}

async function registerInClaudeMd(projectDir, slug, agentPath, scope) {
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
  if (!(await exists(claudeMdPath))) return false;

  let content = await fs.readFile(claudeMdPath, 'utf8');

  if (scope === 'my-agents') {
    const sectionHeader = '## My agents';
    const entry = `- /${slug} -> \`${agentPath}\``;

    if (content.includes(sectionHeader)) {
      if (content.includes(entry)) return false;
      content = content.replace(sectionHeader, `${sectionHeader}\n${entry}`);
    } else {
      const agentsSection = content.indexOf('## Agents');
      if (agentsSection !== -1) {
        const nextSection = content.indexOf('\n## ', agentsSection + 1);
        const insertAt = nextSection !== -1 ? nextSection : content.length;
        const block = `\n${sectionHeader}\n${entry}\n`;
        content = content.slice(0, insertAt) + block + content.slice(insertAt);
      } else {
        content += `\n${sectionHeader}\n${entry}\n`;
      }
    }
  } else {
    // Squad agent — append under existing squad section or create one
    const entry = `- /${slug} -> \`${agentPath}\``;
    if (content.includes(entry)) return false;
    content += `\n${entry}\n`;
  }

  await fs.writeFile(claudeMdPath, content, 'utf8');
  return true;
}

async function registerInAgentsMd(projectDir, slug, agentPath, scope) {
  const agentsMdPath = path.join(projectDir, 'AGENTS.md');
  if (!(await exists(agentsMdPath))) return false;

  let content = await fs.readFile(agentsMdPath, 'utf8');

  if (scope === 'my-agents') {
    const sectionHeader = '## My agents';
    const entry = `- @${slug} → \`${agentPath}\``;

    if (content.includes(sectionHeader)) {
      if (content.includes(`@${slug}`)) return false;
      content = content.replace(sectionHeader, `${sectionHeader}\n${entry}`);
    } else {
      const agentFilesSection = content.indexOf('## Agent files');
      if (agentFilesSection !== -1) {
        const nextSection = content.indexOf('\n## ', agentFilesSection + 1);
        const insertAt = nextSection !== -1 ? nextSection : content.length;
        const block = `\n${sectionHeader}\n${entry}\n`;
        content = content.slice(0, insertAt) + block + content.slice(insertAt);
      } else {
        content += `\n${sectionHeader}\n${entry}\n`;
      }
    }
  } else {
    const entry = `- @${slug} → \`${agentPath}\``;
    if (content.includes(`@${slug}`)) return false;
    content += `\n${entry}\n`;
  }

  await fs.writeFile(agentsMdPath, content, 'utf8');
  return true;
}

async function runSquadAgentCreate({ args = [], options = {}, logger = console, t } = {}) {
  const projectDir = resolveTargetDir(args);
  const name = options.name || args[1];
  const scope = options.scope || null;
  const squadSlug = options.squad || null;
  const mission = options.mission || null;
  const focus = options.focus ? options.focus.split(',').map(f => f.trim()) : [];
  const disc = options.disc || null;
  const dryRun = !!options['dry-run'];

  // Validate name
  if (!name) {
    const msg = t ? t('cli.squad_agent_create.no_name') : 'Usage: aioson squad:agent-create [path] --name=<agent-name> --scope=my-agents|squad [--squad=<slug>]';
    logger.error(msg);
    return { ok: false, error: 'no_name' };
  }

  const slug = slugify(name);

  // Determine scope
  let resolvedScope = scope;
  if (!resolvedScope) {
    // If --squad is provided, scope is squad
    if (squadSlug) {
      resolvedScope = 'squad';
    } else {
      resolvedScope = 'my-agents';
    }
  }

  if (resolvedScope !== 'my-agents' && resolvedScope !== 'squad') {
    const msg = t ? t('cli.squad_agent_create.invalid_scope', { scope: resolvedScope }) : `Invalid scope: "${resolvedScope}". Use "my-agents" or "squad".`;
    logger.error(msg);
    return { ok: false, error: 'invalid_scope' };
  }

  // If scope=squad, validate squad exists
  let squadName = null;
  if (resolvedScope === 'squad') {
    if (!squadSlug) {
      const squads = await listSquads(projectDir);
      if (squads.length === 0) {
        const msg = t ? t('cli.squad_agent_create.no_squads') : 'No squads found. Create a squad first with @squad or provide --squad=<slug>.';
        logger.error(msg);
        return { ok: false, error: 'no_squads' };
      }
      const msg = t ? t('cli.squad_agent_create.squad_required') : `--squad=<slug> required. Available squads: ${squads.map(s => s.slug).join(', ')}`;
      logger.error(msg);
      return { ok: false, error: 'squad_required', squads: squads.map(s => s.slug) };
    }

    const squadDir = path.join(projectDir, SQUADS_DIR, squadSlug);
    if (!(await exists(squadDir))) {
      const msg = t ? t('cli.squad_agent_create.squad_not_found', { squad: squadSlug }) : `Squad "${squadSlug}" not found at ${squadDir}`;
      logger.error(msg);
      return { ok: false, error: 'squad_not_found' };
    }

    // Read squad name from manifest
    const manifestPath = path.join(squadDir, 'squad.manifest.json');
    if (await exists(manifestPath)) {
      try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(raw);
        squadName = manifest.name || squadSlug;
      } catch { squadName = squadSlug; }
    } else {
      squadName = squadSlug;
    }
  }

  // Determine output path
  let agentRelPath;
  let agentAbsPath;
  if (resolvedScope === 'my-agents') {
    agentRelPath = `${MY_AGENTS_DIR}/${slug}.md`;
    agentAbsPath = path.join(projectDir, agentRelPath);
  } else {
    agentRelPath = `${SQUADS_DIR}/${squadSlug}/agents/${slug}.md`;
    agentAbsPath = path.join(projectDir, agentRelPath);
  }

  // Check if already exists
  if (await exists(agentAbsPath)) {
    const msg = t ? t('cli.squad_agent_create.already_exists', { path: agentRelPath }) : `Agent already exists: ${agentRelPath}`;
    logger.error(msg);
    return { ok: false, error: 'already_exists', path: agentRelPath };
  }

  // Build template
  const content = buildAgentTemplate(slug, {
    mission,
    focus,
    scope: resolvedScope,
    squadSlug,
    squadName,
    disc,
    constraints: []
  });

  if (dryRun) {
    logger.log('');
    logger.log(`[dry-run] Would create: ${agentRelPath}`);
    logger.log(`[dry-run] Scope: ${resolvedScope}`);
    if (resolvedScope === 'squad') {
      logger.log(`[dry-run] Squad: ${squadSlug}`);
    }
    logger.log('');
    logger.log(content);
    return { ok: true, dryRun: true, path: agentRelPath, scope: resolvedScope, slug };
  }

  // Write agent file
  await ensureDir(path.dirname(agentAbsPath));
  await fs.writeFile(agentAbsPath, content, 'utf8');

  // Register in CLAUDE.md and AGENTS.md
  const registeredClaude = await registerInClaudeMd(projectDir, slug, agentRelPath, resolvedScope);
  const registeredAgents = await registerInAgentsMd(projectDir, slug, agentRelPath, resolvedScope);

  // Update squad manifest if scope=squad
  let manifestUpdated = false;
  if (resolvedScope === 'squad') {
    const manifestPath = path.join(projectDir, SQUADS_DIR, squadSlug, 'squad.manifest.json');
    if (await exists(manifestPath)) {
      try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(raw);
        if (!Array.isArray(manifest.executors)) manifest.executors = [];

        const alreadyExists = manifest.executors.some(e => e.slug === slug);
        if (!alreadyExists) {
          manifest.executors.push({
            slug,
            type: 'agent',
            role: slug,
            file: agentRelPath,
            skills: [],
            genomes: []
          });
          await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
          manifestUpdated = true;
        }
      } catch { /* manifest parse error — skip */ }
    }
  }

  // Output
  logger.log('');
  logger.log(`  Agent created: ${agentRelPath}`);
  logger.log(`  Scope: ${resolvedScope === 'my-agents' ? 'my-agents (versioned, available globally)' : `squad:${squadSlug}`}`);
  logger.log(`  Slug: @${slug}`);
  if (registeredClaude) logger.log('  Registered in CLAUDE.md');
  if (registeredAgents) logger.log('  Registered in AGENTS.md');
  if (manifestUpdated) logger.log(`  Added to squad manifest: ${squadSlug}`);
  logger.log('');
  logger.log('  Next steps:');
  logger.log(`  1. Edit ${agentRelPath} to define mission, focus, and output contract`);
  logger.log(`  2. Invoke with @${slug} in your AI session`);
  if (resolvedScope === 'my-agents') {
    logger.log('  3. This agent is versioned with the project — commit to share with the team');
  }
  logger.log('');

  return {
    ok: true,
    path: agentRelPath,
    scope: resolvedScope,
    slug,
    squad: squadSlug,
    registeredClaude,
    registeredAgents,
    manifestUpdated
  };
}

module.exports = { runSquadAgentCreate };
