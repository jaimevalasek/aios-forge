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
  return AGENT_DEFINITIONS.find((agent) => agent.id === normalized) || null;
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
  const dependencyText =
    agent.dependsOn.length > 0
      ? `Check required context files first: ${agent.dependsOn.join(', ')}.`
      : 'No prerequisite context files are required.';

  if (safeTool === 'claude') {
    return `Read ${instructionPath} and execute ${agent.command}. ${dependencyText} Write output to ${agent.output}.`;
  }

  if (safeTool === 'gemini') {
    return `Run the Gemini command mapped to ${instructionPath} and execute ${agent.command}. ${dependencyText} Save result to ${agent.output}.`;
  }

  if (safeTool === 'opencode') {
    return `Use agent "${agent.id}" from ${instructionPath}. ${dependencyText} Save output to ${agent.output}.`;
  }

  return `Read AGENTS.md and execute ${agent.command} using ${instructionPath}. ${dependencyText} Save output to ${agent.output}.`;
}

module.exports = {
  normalizeAgentName,
  getAgentDefinition,
  listAgentDefinitions,
  resolveInstructionPath,
  buildAgentPrompt
};
