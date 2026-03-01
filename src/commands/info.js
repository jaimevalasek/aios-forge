'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { detectFramework } = require('../detector');
const { detectExistingInstall } = require('../installer');

async function runInfo({ args, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const pkgPath = path.join(__dirname, '../../package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

  const installed = await detectExistingInstall(targetDir);
  const detection = await detectFramework(targetDir);

  logger.log(t('info.cli_version', { version: pkg.version }));
  logger.log(t('info.directory', { targetDir }));
  logger.log(t('info.installed_here', { value: installed ? t('info.yes') : t('info.no') }));
  logger.log(t('info.framework_detected', { framework: detection.framework || t('info.none') }));
  if (detection.evidence) {
    logger.log(t('info.evidence', { evidence: detection.evidence }));
  }

  return {
    version: pkg.version,
    installed,
    detection
  };
}

module.exports = {
  runInfo
};
