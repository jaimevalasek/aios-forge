'use strict';

const path = require('node:path');
const { detectFramework } = require('../detector');
const { installTemplate } = require('../installer');

async function runInstall({ args, options, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const force = Boolean(options.force);
  const dryRun = Boolean(options['dry-run']);

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

  logger.log(t('install.done_at', { targetDir }));
  logger.log(t('install.files_copied', { count: result.copied.length }));
  logger.log(t('install.files_skipped', { count: result.skipped.length }));

  return result;
}

module.exports = {
  runInstall
};
