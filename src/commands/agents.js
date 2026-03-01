'use strict';

const path = require('node:path');
const {
  listAgentDefinitions,
  getAgentDefinition,
  resolveInstructionPath,
  buildAgentPrompt
} = require('../agents');
const { resolveAgentLocale } = require('../locales');
const { validateProjectContextFile } = require('../context');
const { exists } = require('../utils');

async function resolveLocaleForTarget(targetDir, options) {
  const fromOption = options.language || options.lang;
  if (fromOption) return resolveAgentLocale(fromOption);

  const context = await validateProjectContextFile(targetDir);
  if (context.parsed && context.data && context.data.conversation_language) {
    return resolveAgentLocale(context.data.conversation_language);
  }

  return 'en';
}

async function resolveExistingInstructionPath(targetDir, agent, locale) {
  const candidate = resolveInstructionPath(agent, locale);
  const candidateAbs = path.join(targetDir, candidate);
  if (await exists(candidateAbs)) return candidate;
  return agent.path;
}

async function runAgentsList({ args, options, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const locale = await resolveLocaleForTarget(targetDir, options);
  const agents = listAgentDefinitions();
  logger.log(t('agents.list_title', { locale }));
  for (const agent of agents) {
    const deps = agent.dependsOn.length > 0 ? agent.dependsOn.join(', ') : t('agents.none');
    const instructionPath = await resolveExistingInstructionPath(targetDir, agent, locale);
    logger.log(t('agents.agent_line', { command: agent.command, id: agent.id }));
    logger.log(t('agents.path_line', { path: instructionPath }));
    logger.log(t('agents.active_path_line', { path: agent.path }));
    logger.log(t('agents.depends_line', { value: deps }));
    logger.log(t('agents.output_line', { value: agent.output }));
  }

  return { ok: true, targetDir, count: agents.length, agents, locale };
}

async function runAgentPrompt({ args, options, logger, t }) {
  const name = args[0];
  if (!name) {
    throw new Error(t('agents.prompt_usage_error'));
  }

  const agent = getAgentDefinition(name);
  if (!agent) {
    throw new Error(t('agents.prompt_unknown_agent', { agent: name }));
  }

  const targetDir = path.resolve(process.cwd(), args[1] || '.');
  const locale = await resolveLocaleForTarget(targetDir, options);
  const instructionPath = await resolveExistingInstructionPath(targetDir, agent, locale);
  const tool = options.tool || 'codex';
  const prompt = buildAgentPrompt(agent, tool, { instructionPath });

  logger.log(t('agents.prompt_title', { agent: agent.id, tool, locale }));
  logger.log(prompt);

  return { ok: true, targetDir, agent: agent.id, tool, locale, instructionPath, prompt };
}

module.exports = {
  runAgentsList,
  runAgentPrompt
};
