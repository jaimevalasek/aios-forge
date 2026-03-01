'use strict';

const path = require('node:path');
const { runDoctor } = require('../doctor');

async function runDoctorCommand({ args, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const report = await runDoctor(targetDir);

  for (const check of report.checks) {
    const icon = check.ok ? t('doctor.ok') : t('doctor.fail');
    logger.log(`[${icon}] ${t(check.key, check.params)}`);
    if (!check.ok && check.hintKey) {
      logger.log(`  ${t('doctor.hint_prefix', { hint: t(check.hintKey) })}`);
    }
  }

  if (!report.ok) {
    logger.log(`\n${t('doctor.diagnosis_fail', { count: report.failedCount })}`);
  } else {
    logger.log(`\n${t('doctor.diagnosis_ok')}`);
  }

  return report;
}

module.exports = {
  runDoctorCommand
};
