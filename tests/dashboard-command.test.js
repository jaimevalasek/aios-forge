'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createTranslator } = require('../src/i18n');
const {
  runDashboardInit,
  runDashboardDev,
  runDashboardOpen
} = require('../src/commands/dashboard');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-dashboard-command-'));
}

function createLogger() {
  return {
    lines: [],
    log(line) {
      this.lines.push(String(line));
    },
    error(line) {
      this.lines.push(String(line));
    }
  };
}

test('dashboard:init dry-run returns installation plan', async () => {
  const root = await makeTempDir();
  const projectDir = path.join(root, 'project');
  const dashboardDir = path.join(root, 'dashboard');
  await fs.mkdir(projectDir, { recursive: true });

  const { t } = createTranslator('pt-BR');
  const logger = createLogger();

  const result = await runDashboardInit({
    args: [projectDir],
    options: {
      dir: dashboardDir,
      'dry-run': true,
      repo: 'https://example.com/aios-lite-dashboard.git'
    },
    logger,
    t,
    dependencies: {
      readConfig: async () => ({}),
      writeConfig: async () => {}
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.projectDir, path.resolve(projectDir));
  assert.equal(result.dashboardDir, path.resolve(dashboardDir));
  assert.equal(result.repo, 'https://example.com/aios-lite-dashboard.git');
  assert.equal(result.cloned, true);
  assert.equal(result.installed, true);
});

test('dashboard:init reuses dashboard install and registers active project', async () => {
  const root = await makeTempDir();
  const projectDir = path.join(root, 'project');
  const dashboardDir = path.join(root, 'dashboard');
  await fs.mkdir(projectDir, { recursive: true });
  await fs.mkdir(path.join(dashboardDir, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(dashboardDir, 'package.json'),
    JSON.stringify({ name: 'aios-lite-dashboard' }, null, 2),
    'utf8'
  );

  let savedConfig = {};
  const { t } = createTranslator('pt-BR');
  const logger = createLogger();

  const result = await runDashboardInit({
    args: [projectDir],
    options: {
      dir: dashboardDir,
      'skip-install': true,
      'project-name': 'Projeto YouTube'
    },
    logger,
    t,
    dependencies: {
      readConfig: async () => ({ ...savedConfig }),
      writeConfig: async (next) => {
        savedConfig = { ...next };
      }
    }
  });

  const registryRaw = await fs.readFile(path.join(dashboardDir, 'data', 'projects.json'), 'utf8');
  const registry = JSON.parse(registryRaw);

  assert.equal(result.ok, true);
  assert.equal(result.cloned, false);
  assert.equal(result.installed, false);
  assert.equal(registry.currentProjectId, result.projectId);
  assert.equal(registry.projects[0].name, 'Projeto YouTube');
  assert.equal(registry.projects[0].rootPath, path.resolve(projectDir));
  assert.equal(savedConfig['dashboard.dir'], path.resolve(dashboardDir));
  assert.equal(savedConfig['dashboard.port'], '3000');
});

test('dashboard:dev dry-run returns URL and persists active project in dashboard registry', async () => {
  const root = await makeTempDir();
  const projectDir = path.join(root, 'project');
  const dashboardDir = path.join(root, 'dashboard');
  await fs.mkdir(projectDir, { recursive: true });
  await fs.mkdir(path.join(dashboardDir, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(dashboardDir, 'package.json'),
    JSON.stringify({ name: 'aios-lite-dashboard' }, null, 2),
    'utf8'
  );

  let savedConfig = {};
  const { t } = createTranslator('en');
  const logger = createLogger();

  const result = await runDashboardDev({
    args: [projectDir],
    options: {
      dir: dashboardDir,
      host: '127.0.0.1',
      port: '3010',
      'dry-run': true
    },
    logger,
    t,
    dependencies: {
      readConfig: async () => ({ ...savedConfig }),
      writeConfig: async (next) => {
        savedConfig = { ...next };
      }
    }
  });

  const registryRaw = await fs.readFile(path.join(dashboardDir, 'data', 'projects.json'), 'utf8');
  const registry = JSON.parse(registryRaw);

  assert.equal(result.ok, true);
  assert.equal(result.url, 'http://127.0.0.1:3010');
  assert.equal(registry.currentProjectId, result.projectId);
  assert.equal(savedConfig['dashboard.host'], '127.0.0.1');
  assert.equal(savedConfig['dashboard.port'], '3010');
});

test('dashboard:open dry-run resolves browser target without spawning browser', async () => {
  const root = await makeTempDir();
  const { t } = createTranslator('pt-BR');
  const logger = createLogger();

  const result = await runDashboardOpen({
    args: [root],
    options: {
      'dry-run': true,
      host: '127.0.0.1',
      port: '3456'
    },
    logger,
    t,
    dependencies: {
      readConfig: async () => ({})
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.url, 'http://127.0.0.1:3456');
  assert.equal(Array.isArray(result.args), true);
  assert.equal(typeof result.command, 'string');
});
