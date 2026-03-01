'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ensureDir } = require('../utils');
const { runInstall } = require('./install');
const { runSetupContext } = require('./setup-context');
const { runLocaleApply } = require('./locale-apply');
const { runAgentsList, runAgentPrompt } = require('./agents');
const { runContextValidate } = require('./context-validate');
const { runDoctor } = require('../doctor');
const { runUpdate } = require('./update');

function createQuietLogger() {
  return {
    log() {},
    error() {}
  };
}

function assertStep(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeTest({ args, options, logger, t }) {
  const language = String(options.language || options.lang || 'en');
  const keep = Boolean(options.keep);
  const baseDir = path.resolve(process.cwd(), args[0] || os.tmpdir());
  await ensureDir(baseDir);

  const workspaceRoot = await fs.mkdtemp(path.join(baseDir, 'aios-lite-smoke-'));
  const projectDir = path.join(workspaceRoot, 'demo');
  await ensureDir(projectDir);

  const steps = [];
  const quietLogger = createQuietLogger();

  try {
    logger.log(t('smoke.start', { projectDir }));

    const installResult = await runInstall({
      args: [projectDir],
      options: {},
      logger: quietLogger,
      t
    });
    assertStep(installResult.copied.length > 0, 'install copied zero files');
    steps.push('install');
    logger.log(t('smoke.step_ok', { step: 'install' }));

    const setupResult = await runSetupContext({
      args: [projectDir],
      options: {
        defaults: true,
        'project-name': 'demo',
        'project-type': 'web_app',
        profile: 'developer',
        framework: 'Node',
        'framework-installed': true,
        language
      },
      logger: quietLogger,
      t
    });
    assertStep(Boolean(setupResult.filePath), 'setup:context did not write context file');
    steps.push('setup:context');
    logger.log(t('smoke.step_ok', { step: 'setup:context' }));

    const localeResult = await runLocaleApply({
      args: [projectDir],
      options: { lang: language },
      logger: quietLogger,
      t
    });
    assertStep(localeResult.copied.length > 0, 'locale:apply copied zero files');
    steps.push('locale:apply');
    logger.log(t('smoke.step_ok', { step: 'locale:apply' }));

    const agentsResult = await runAgentsList({
      args: [projectDir],
      options: { lang: language },
      logger: quietLogger,
      t
    });
    assertStep(agentsResult.count >= 7, 'agents command returned unexpected agent count');
    steps.push('agents');
    logger.log(t('smoke.step_ok', { step: 'agents' }));

    const promptResult = await runAgentPrompt({
      args: ['setup', projectDir],
      options: { tool: 'codex', lang: language },
      logger: quietLogger,
      t
    });
    assertStep(
      promptResult.prompt.includes('.aios-lite'),
      'agent:prompt did not include expected path information'
    );
    steps.push('agent:prompt');
    logger.log(t('smoke.step_ok', { step: 'agent:prompt' }));

    const contextResult = await runContextValidate({
      args: [projectDir],
      options: {},
      logger: quietLogger,
      t
    });
    assertStep(contextResult.ok, 'context:validate failed');
    steps.push('context:validate');
    logger.log(t('smoke.step_ok', { step: 'context:validate' }));

    const doctorResult = await runDoctor(projectDir);
    assertStep(doctorResult.ok, 'doctor check failed');
    steps.push('doctor');
    logger.log(t('smoke.step_ok', { step: 'doctor' }));

    await runUpdate({
      args: [projectDir],
      options: {},
      logger: quietLogger,
      t
    });
    steps.push('update');
    logger.log(t('smoke.step_ok', { step: 'update' }));

    logger.log(t('smoke.completed'));
    logger.log(t('smoke.steps_count', { count: steps.length }));

    return {
      ok: true,
      steps,
      workspaceRoot,
      projectDir,
      kept: keep
    };
  } finally {
    if (!keep) {
      await fs.rm(workspaceRoot, { recursive: true, force: true });
      logger.log(t('smoke.workspace_removed', { path: workspaceRoot }));
    } else {
      logger.log(t('smoke.workspace_kept', { path: workspaceRoot }));
    }
  }
}

module.exports = {
  runSmokeTest
};
