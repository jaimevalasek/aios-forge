'use strict';

const path = require('node:path');
const { detectFramework } = require('../detector');
const { installTemplate } = require('../installer');
const { applyAgentLocale } = require('../locales');
const { resolvePromptTool } = require('../prompt-tool');

async function runInstall({ args, options, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const force = Boolean(options.force);
  const dryRun = Boolean(options['dry-run']);
  const requestedLanguage = options.lang || options.language;
  const promptTool = resolvePromptTool(options.tool);

  const detection = await detectFramework(targetDir);
  if (detection.installed) {
    logger.log(t('install.framework_detected', {
      framework: detection.framework,
      evidence: detection.evidence
    }));
  } else {
    logger.log(t('install.framework_not_detected'));
  }

  const result = await installTemplate(targetDir, {
    overwrite: force,
    dryRun,
    mode: 'install',
    frameworkDetection: detection.framework
  });

  let localeApply = null;
  if (requestedLanguage) {
    localeApply = await applyAgentLocale(targetDir, requestedLanguage, { dryRun });
    if (dryRun) {
      logger.log(t('locale_apply.dry_run_applied', { locale: localeApply.locale }));
    } else {
      logger.log(t('locale_apply.applied', { locale: localeApply.locale }));
    }
  }

  logger.log(t('install.done_at', { targetDir }));
  logger.log(t('install.files_copied', { count: result.copied.length }));
  logger.log(t('install.files_skipped', { count: result.skipped.length }));
  logger.log(t('install.next_steps'));
  logger.log(t('install.step_setup_context'));
  logger.log(t('install.step_agents'));
  logger.log(t('install.step_agent_prompt', { tool: promptTool }));

  return {
    ...result,
    localeApply
  };
}

module.exports = {
  runInstall
};
