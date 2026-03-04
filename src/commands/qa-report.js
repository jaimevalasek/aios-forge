'use strict';

const path = require('node:path');
const fs = require('node:fs/promises');
const { readTextIfExists, exists } = require('../utils');

async function runQaReport({ args, options = {}, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const mdPath = path.join(targetDir, 'aios-qa-report.md');
  const jsonPath = path.join(targetDir, 'aios-qa-report.json');

  if (options.json) {
    if (!(await exists(jsonPath))) {
      return { ok: false, error: 'report_not_found', path: jsonPath };
    }
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      return { ok: true, ...JSON.parse(raw) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  const content = await readTextIfExists(mdPath);
  if (!content) {
    logger.error(t('qa_report.not_found'));
    process.exitCode = 1;
    return { ok: false, error: 'report_not_found' };
  }

  logger.log(content);
  return { ok: true, path: mdPath };
}

module.exports = { runQaReport };
