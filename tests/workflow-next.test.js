'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const { runWorkflowNext } = require('../src/commands/workflow-next');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-forge-workflow-next-'));
}

function createQuietLogger() {
  return {
    log() {},
    error() {}
  };
}

async function writeFileEnsured(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

async function writeProjectContext(dir, classification = 'SMALL') {
  const contextPath = path.join(dir, '.aios-forge/context/project.context.md');
  await writeFileEnsured(
    contextPath,
    `---\nproject_name: "demo"\nproject_type: "web_app"\nprofile: "developer"\nframework: "Next.js"\nframework_installed: true\nclassification: "${classification}"\nconversation_language: "en"\naios_forge_version: "1.2.1"\n---\n\n# Context\n`
  );
}

test('workflow:next infers project progress from existing artifacts', async () => {
  const dir = await makeTempDir();
  await writeProjectContext(dir, 'SMALL');
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd.md'), '# PRD\n');

  const { t } = createTranslator('en');
  const result = await runWorkflowNext({
    args: [dir],
    options: { tool: 'codex' },
    logger: createQuietLogger(),
    t
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'project');
  assert.equal(result.agent, 'analyst');
  assert.deepEqual(result.completed, ['setup', 'product']);
  assert.equal(result.current, 'analyst');
});

test('workflow:next infers active feature and routes to analyst after product', async () => {
  const dir = await makeTempDir();
  await writeProjectContext(dir, 'SMALL');
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd.md'), '# PRD\n');
  await writeFileEnsured(
    path.join(dir, '.aios-forge/context/features.md'),
    '# Features\n\n| slug | status | started | completed |\n|------|--------|---------|-----------|\n| compact-layout | in_progress | 2026-03-13 | — |\n'
  );
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd-compact-layout.md'), '# Feature PRD\n');

  const { t } = createTranslator('en');
  const result = await runWorkflowNext({
    args: [dir],
    options: { tool: 'codex' },
    logger: createQuietLogger(),
    t
  });

  assert.equal(result.mode, 'feature');
  assert.equal(result.featureSlug, 'compact-layout');
  assert.equal(result.agent, 'analyst');
  assert.deepEqual(result.completed, ['product']);
});

test('workflow:next supports detours and returns to the saved stage', async () => {
  const dir = await makeTempDir();
  await writeProjectContext(dir, 'SMALL');
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd.md'), '# PRD\n');
  await writeFileEnsured(
    path.join(dir, '.aios-forge/context/features.md'),
    '# Features\n\n| slug | status | started | completed |\n|------|--------|---------|-----------|\n| compact-layout | in_progress | 2026-03-13 | — |\n'
  );
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd-compact-layout.md'), '# Feature PRD\n');

  const { t } = createTranslator('en');

  const detour = await runWorkflowNext({
    args: [dir],
    options: { tool: 'codex', agent: 'ux-ui' },
    logger: createQuietLogger(),
    t
  });

  assert.equal(detour.agent, 'ux-ui');
  assert.deepEqual(detour.detour, {
    active: true,
    agent: 'ux-ui',
    returnTo: 'analyst'
  });

  await writeFileEnsured(path.join(dir, '.aios-forge/context/ui-spec.md'), '# UI Spec\n');

  const resumed = await runWorkflowNext({
    args: [dir],
    options: { tool: 'codex', complete: true },
    logger: createQuietLogger(),
    t
  });

  assert.equal(resumed.completedStage, 'ux-ui');
  assert.equal(resumed.agent, 'analyst');
  assert.equal(resumed.detour, null);
});

test('workflow:next allows skip until dev but not past dev', async () => {
  const dir = await makeTempDir();
  await writeProjectContext(dir, 'SMALL');
  await writeFileEnsured(path.join(dir, '.aios-forge/context/prd.md'), '# PRD\n');

  const { t } = createTranslator('en');
  const skipped = await runWorkflowNext({
    args: [dir],
    options: { tool: 'codex', skip: 'dev' },
    logger: createQuietLogger(),
    t
  });

  assert.equal(skipped.agent, 'dev');
  assert.deepEqual(skipped.skipped, ['analyst', 'architect']);

  await assert.rejects(
    () =>
      runWorkflowNext({
        args: [dir],
        options: { tool: 'codex', skip: 'qa' },
        logger: createQuietLogger(),
        t
      }),
    /Cannot skip past @dev/
  );
});
