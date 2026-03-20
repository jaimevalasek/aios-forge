'use strict';

const { AGENT_DEFINITIONS } = require('./constants');
const { getLocalizedAgentPath } = require('./locales');

function normalizeAgentName(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
}

function getAgentDefinition(name) {
  const normalized = normalizeAgentName(name);
  return AGENT_DEFINITIONS.find((agent) => {
    if (agent.id === normalized) return true;
    return Array.isArray(agent.aliases) && agent.aliases.includes(normalized);
  }) || null;
}

function listAgentDefinitions() {
  return [...AGENT_DEFINITIONS];
}

function resolveInstructionPath(agent, locale) {
  if (!locale) return agent.path;
  return getLocalizedAgentPath(agent.id, locale);
}

function buildAgentPrompt(agent, tool, options = {}) {
  const safeTool = String(tool || 'codex').toLowerCase();
  const instructionPath = options.instructionPath || agent.path;
  const targetDir = options.targetDir ? String(options.targetDir) : '.';
  const dependencyText =
    agent.dependsOn.length > 0
      ? `Check required context files first: ${agent.dependsOn.join(', ')}.`
      : 'No prerequisite context files are required.';

  const lifecycleBlock = [
    '',
    '',
    '## AIOSON Lifecycle — mandatory, do not skip',
    '',
    '> If the `aioson` CLI is not installed in this environment, skip the runtime-log commands and continue with the agent work normally. Do not let missing CLI block execution.',
    '',
    `**1. On activation — run before any other action:**`,
    '```bash',
    `aioson runtime-log ${targetDir} --agent=${agent.command} --title="${agent.displayName} stage" --message="Starting ${agent.command}"`,
    '```',
    '',
    '**2. After each significant step — run to keep the dashboard in sync:**',
    '```bash',
    `aioson runtime-log ${targetDir} --agent=${agent.command} --message="<what was just done>"`,
    '```',
    '',
    '**3. On completion — run before any handoff message:**',
    '```bash',
    `aioson runtime-log ${targetDir} --agent=${agent.command} --message="<completion summary>" --finish --status=completed --summary="<one-line summary>"`,
    `aioson workflow:next ${targetDir} --complete`,
    '```',
    '',
    `**Scope boundary:** You operate exclusively as ${agent.command}. Do not perform work that belongs to another agent. When your work is complete, output only the handoff — which agent is next and why. Do not continue into that agent\'s territory.`,
  ].join('\n');

  if (safeTool === 'claude') {
    return `Read ${instructionPath} and execute ${agent.command}. ${dependencyText} Write output to ${agent.output}.${lifecycleBlock}`;
  }

  if (safeTool === 'gemini') {
    return `Run the Gemini command mapped to ${instructionPath} and execute ${agent.command}. ${dependencyText} Save result to ${agent.output}.${lifecycleBlock}`;
  }

  if (safeTool === 'opencode') {
    return `Use agent "${agent.id}" from ${instructionPath}. ${dependencyText} Save output to ${agent.output}.${lifecycleBlock}`;
  }

  return `Read AGENTS.md and execute ${agent.command} using ${instructionPath}. ${dependencyText} Save output to ${agent.output}.${lifecycleBlock}`;
}

module.exports = {
  normalizeAgentName,
  getAgentDefinition,
  listAgentDefinitions,
  resolveInstructionPath,
  buildAgentPrompt
};
