'use strict';

const path = require('node:path');
const { validateProjectContextFile } = require('../context');

const WORKFLOW_BY_CLASSIFICATION = {
  MICRO: ['setup', 'dev'],
  SMALL: ['setup', 'analyst', 'architect', 'dev', 'qa'],
  MEDIUM: ['setup', 'analyst', 'architect', 'pm', 'orchestrator', 'dev', 'qa']
};

function normalizeClassification(value, fallback = 'MICRO') {
  const text = String(value || '').trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(WORKFLOW_BY_CLASSIFICATION, text)) return text;
  return fallback;
}

function withAgentPrefix(sequence) {
  return sequence.map((id) => `@${id}`);
}

function buildWorkflowPlan(input = {}) {
  const classification = normalizeClassification(input.classification, 'MICRO');
  const projectType = String(input.projectType || 'web_app');
  const frameworkInstalled = Boolean(input.frameworkInstalled);
  const sequence = WORKFLOW_BY_CLASSIFICATION[classification] || WORKFLOW_BY_CLASSIFICATION.MICRO;
  const notes = [];

  if (!frameworkInstalled) {
    notes.push('Framework is not installed yet; complete stack installation before @dev.');
  }
  if (projectType === 'dapp' || Boolean(input.web3Enabled)) {
    notes.push('dApp context detected; include Web3 skills during @architect and @dev.');
  }
  if (classification === 'MICRO') {
    notes.push('Keep implementation scope minimal and avoid optional agents.');
  }

  return {
    classification,
    sequence,
    commands: withAgentPrefix(sequence),
    notes
  };
}

async function runWorkflowPlan({ args, options = {}, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const jsonMode = Boolean(options.json);
  const context = await validateProjectContextFile(targetDir);
  const contextData = context.parsed && context.data ? context.data : {};

  const plan = buildWorkflowPlan({
    classification: options.classification || contextData.classification || 'MICRO',
    projectType: contextData.project_type || options['project-type'] || 'web_app',
    frameworkInstalled:
      contextData.framework_installed !== undefined
        ? contextData.framework_installed
        : options['framework-installed'] === 'true',
    web3Enabled:
      contextData.web3_enabled !== undefined
        ? contextData.web3_enabled
        : options['web3-enabled'] === 'true'
  });

  const output = {
    ok: true,
    targetDir,
    contextExists: context.exists,
    contextParsed: context.parsed,
    classification: plan.classification,
    sequence: plan.sequence,
    commands: plan.commands,
    notes: plan.notes
  };

  if (jsonMode) {
    return output;
  }

  if (!context.exists) {
    logger.log(t('workflow_plan.context_missing'));
  }
  logger.log(t('workflow_plan.title', { classification: plan.classification }));
  for (const command of plan.commands) {
    logger.log(`- ${command}`);
  }
  if (plan.notes.length > 0) {
    logger.log(t('workflow_plan.notes'));
    for (const note of plan.notes) {
      logger.log(`- ${note}`);
    }
  }

  return output;
}

module.exports = {
  runWorkflowPlan,
  normalizeClassification,
  buildWorkflowPlan,
  WORKFLOW_BY_CLASSIFICATION
};
