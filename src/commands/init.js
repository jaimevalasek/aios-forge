'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { installTemplate } = require('../installer');

async function directoryIsEmpty(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length === 0;
  } catch (error) {
    if (error && error.code === 'ENOENT') return true;
    throw error;
  }
}

async function runInit({ args, options, logger, t }) {
  const projectName = args[0];
  if (!projectName) {
    throw new Error(t('init.usage_error'));
  }

  const targetDir = path.resolve(process.cwd(), projectName);
  const force = Boolean(options.force);
  const dryRun = Boolean(options['dry-run']);

  await fs.mkdir(targetDir, { recursive: true });

  if (!(await directoryIsEmpty(targetDir)) && !force) {
    throw new Error(t('init.non_empty_dir', { targetDir }));
  }

  const result = await installTemplate(targetDir, {
    overwrite: true,
    dryRun,
    mode: 'init'
  });

  logger.log(t('init.created_at', { targetDir }));
  logger.log(t('init.files_copied', { count: result.copied.length }));
  if (result.skipped.length > 0) {
    logger.log(t('init.files_skipped', { count: result.skipped.length }));
  }
  logger.log(t('init.next_steps'));
  logger.log(t('init.step_cd', { projectName }));
  logger.log(t('init.step_setup'));

  return result;
}

module.exports = {
  runInit,
  directoryIsEmpty
};
