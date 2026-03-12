'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ensureDir, exists } = require('../utils');
const { readConfig, writeConfig } = require('./config');

const DEFAULT_DASHBOARD_REPO = 'https://github.com/jaimevalasek/aios-dashboard.git';

function resolveBin(command) {
  if (process.platform === 'win32' && (command === 'npm' || command === 'npx')) {
    return `${command}.cmd`;
  }
  return command;
}

function toArg(value) {
  return typeof value === 'string' ? value : String(value);
}

function slugify(value) {
  return String(value || 'project')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project';
}

function dashboardDataPath(dashboardDir) {
  return path.join(dashboardDir, 'data', 'projects.json');
}

async function ensureDirectory(targetDir, label) {
  const stat = await fs.stat(targetDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`${label}: ${targetDir}`);
  }
}

async function isDirectoryEmpty(targetDir) {
  const entries = await fs.readdir(targetDir).catch(() => []);
  return entries.length === 0;
}

async function runProcess(command, args, options = {}) {
  const cwd = options.cwd || process.cwd();
  const env = { ...process.env, ...(options.env || {}) };
  const stdio = options.stdio || 'pipe';

  return new Promise((resolve, reject) => {
    const child = spawn(resolveBin(command), args.map((arg) => toArg(arg)), {
      cwd,
      env,
      stdio
    });

    if (stdio === 'inherit') {
      child.on('error', reject);
      child.on('close', (code, signal) => {
        resolve({
          code: Number(code || 0),
          signal: signal || null,
          stdout: '',
          stderr: ''
        });
      });
      return;
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      resolve({
        code: Number(code || 0),
        signal: signal || null,
        stdout,
        stderr
      });
    });
  });
}

function commandDetail(result) {
  const stderr = String((result && result.stderr) || '').trim();
  const stdout = String((result && result.stdout) || '').trim();
  return stderr || stdout || 'unknown error';
}

async function readDashboardRegistry(dashboardDir) {
  const filePath = dashboardDataPath(dashboardDir);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid registry');
    if (!Array.isArray(parsed.projects)) throw new Error('invalid registry');
    return parsed;
  } catch {
    return {
      version: 1,
      currentProjectId: '',
      projects: []
    };
  }
}

async function writeDashboardRegistry(dashboardDir, registry) {
  const filePath = dashboardDataPath(dashboardDir);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

async function registerProjectInDashboard(dashboardDir, projectDir, explicitName) {
  const registry = await readDashboardRegistry(dashboardDir);
  const normalizedProjectDir = path.resolve(projectDir);
  const projectName = String(explicitName || path.basename(normalizedProjectDir) || 'AIOS Forge Project').trim();
  const now = new Date().toISOString();

  let project = registry.projects.find((item) => path.resolve(item.rootPath) === normalizedProjectDir) || null;

  if (!project) {
    const baseId = slugify(projectName);
    let nextId = baseId;
    let offset = 1;
    while (registry.projects.some((item) => item.id === nextId)) {
      offset += 1;
      nextId = `${baseId}-${offset}`;
    }

    project = {
      id: nextId,
      name: projectName,
      rootPath: normalizedProjectDir,
      createdAt: now,
      updatedAt: now
    };
    registry.projects.push(project);
  } else {
    project.name = projectName;
    project.rootPath = normalizedProjectDir;
    project.updatedAt = now;
  }

  registry.version = 1;
  registry.currentProjectId = project.id;
  await writeDashboardRegistry(dashboardDir, registry);
  return project;
}

async function resolveProjectDir(args, t) {
  const projectDir = path.resolve(process.cwd(), args[0] || '.');
  await ensureDirectory(projectDir, t('dashboard.project_missing', { path: projectDir }));
  return projectDir;
}

function resolveDashboardDir(projectDir, options, config) {
  const configuredDir = options.dir || config['dashboard.dir'];
  if (configuredDir) {
    return path.resolve(process.cwd(), String(configuredDir));
  }
  return path.resolve(projectDir, '..', 'aios-dashboard');
}

function resolvePort(options, config) {
  return String(options.port || config['dashboard.port'] || '3000');
}

function resolveHost(options, config) {
  return String(options.host || config['dashboard.host'] || '127.0.0.1');
}

function resolveRepo(options, config) {
  return String(options.repo || config['dashboard.repo'] || DEFAULT_DASHBOARD_REPO);
}

async function persistDashboardConfig(values, dependencies = {}) {
  const readConfigFn = dependencies.readConfig || readConfig;
  const writeConfigFn = dependencies.writeConfig || writeConfig;
  const current = await readConfigFn();
  current['dashboard.dir'] = values.dashboardDir;
  current['dashboard.repo'] = values.repo;
  current['dashboard.port'] = values.port;
  current['dashboard.host'] = values.host;
  await writeConfigFn(current);
}

async function runDashboardInit({ args, options = {}, logger, t, dependencies = {} }) {
  const exec = dependencies.runProcess || runProcess;
  const readConfigFn = dependencies.readConfig || readConfig;
  const writeConfigFn = dependencies.writeConfig || writeConfig;
  const projectDir = await resolveProjectDir(args, t);
  const config = await readConfigFn();
  const dashboardDir = resolveDashboardDir(projectDir, options, config);
  const repo = resolveRepo(options, config);
  const port = resolvePort(options, config);
  const host = resolveHost(options, config);
  const dryRun = Boolean(options['dry-run']);
  const skipInstall = Boolean(options['skip-install']);

  const dashboardExists = await exists(path.join(dashboardDir, 'package.json'));
  const shouldClone = !dashboardExists;

  if (shouldClone) {
    const targetExists = await exists(dashboardDir);
    if (targetExists && !(await isDirectoryEmpty(dashboardDir))) {
      throw new Error(t('dashboard.init_dir_not_empty', { path: dashboardDir }));
    }
  }

  const planned = {
    ok: true,
    dryRun,
    projectDir,
    dashboardDir,
    repo,
    host,
    port,
    cloned: shouldClone,
    installed: !skipInstall,
    registered: true
  };

  if (dryRun) {
    logger.log(t('dashboard.dry_run_summary', { path: dashboardDir }));
    return planned;
  }

  await ensureDir(path.dirname(dashboardDir));

  if (shouldClone) {
    logger.log(t('dashboard.clone_start', { repo, path: dashboardDir }));
    const clone = await exec('git', ['clone', repo, dashboardDir], { cwd: process.cwd() });
    if (clone.code !== 0) {
      throw new Error(t('dashboard.clone_failed', { detail: commandDetail(clone) }));
    }
  }

  if (!skipInstall) {
    logger.log(t('dashboard.install_start', { path: dashboardDir }));
    const install = await exec('npm', ['install'], { cwd: dashboardDir });
    if (install.code !== 0) {
      throw new Error(t('dashboard.install_failed', { detail: commandDetail(install) }));
    }
  }

  const project = await registerProjectInDashboard(
    dashboardDir,
    projectDir,
    options['project-name'] || path.basename(projectDir)
  );

  await persistDashboardConfig({ dashboardDir, repo, port, host }, {
    readConfig: readConfigFn,
    writeConfig: writeConfigFn
  });

  logger.log(t('dashboard.init_ok', { path: dashboardDir }));
  logger.log(t('dashboard.project_registered', { name: project.name, path: project.rootPath }));
  logger.log(t('dashboard.next_steps'));
  logger.log(t('dashboard.step_dev', { path: projectDir }));
  logger.log(t('dashboard.step_open', { host, port }));

  return {
    ...planned,
    projectId: project.id,
    projectName: project.name
  };
}

async function runDashboardDev({ args, options = {}, logger, t, dependencies = {} }) {
  const exec = dependencies.runProcess || runProcess;
  const readConfigFn = dependencies.readConfig || readConfig;
  const writeConfigFn = dependencies.writeConfig || writeConfig;
  const projectDir = await resolveProjectDir(args, t);
  const config = await readConfigFn();
  const dashboardDir = resolveDashboardDir(projectDir, options, config);
  const port = resolvePort(options, config);
  const host = resolveHost(options, config);
  const dryRun = Boolean(options['dry-run']);

  if (!(await exists(path.join(dashboardDir, 'package.json')))) {
    throw new Error(t('dashboard.not_initialized', { path: dashboardDir }));
  }

  const project = await registerProjectInDashboard(
    dashboardDir,
    projectDir,
    options['project-name'] || path.basename(projectDir)
  );
  await persistDashboardConfig({
    dashboardDir,
    repo: resolveRepo(options, config),
    port,
    host
  }, {
    readConfig: readConfigFn,
    writeConfig: writeConfigFn
  });

  const payload = {
    ok: true,
    dryRun,
    projectDir,
    dashboardDir,
    host,
    port,
    url: `http://${host}:${port}`,
    projectId: project.id
  };

  if (dryRun) {
    logger.log(t('dashboard.dry_run_summary', { path: dashboardDir }));
    return payload;
  }

  logger.log(t('dashboard.dev_start', { path: dashboardDir, host, port }));
  const result = await exec('npm', ['run', 'dev', '--', '--hostname', host, '--port', port], {
    cwd: dashboardDir,
    env: {
      PORT: port,
      HOSTNAME: host
    },
    stdio: 'inherit'
  });

  return {
    ...payload,
    exitCode: result.code
  };
}

function getOpenCommand(url) {
  if (process.platform === 'darwin') {
    return { command: 'open', args: [url] };
  }

  if (process.platform === 'win32') {
    return { command: 'cmd', args: ['/c', 'start', '', url] };
  }

  if (process.env.WSL_DISTRO_NAME) {
    return { command: 'wslview', args: [url], fallback: { command: 'xdg-open', args: [url] } };
  }

  return { command: 'xdg-open', args: [url] };
}

async function runDashboardOpen({ args, options = {}, logger, t, dependencies = {} }) {
  const exec = dependencies.runProcess || runProcess;
  const readConfigFn = dependencies.readConfig || readConfig;
  const config = await readConfigFn();
  const projectDir = path.resolve(process.cwd(), args[0] || '.');
  const dashboardDir = resolveDashboardDir(projectDir, options, config);
  const port = resolvePort(options, config);
  const host = resolveHost(options, config) === '0.0.0.0' ? '127.0.0.1' : resolveHost(options, config);
  const url = options.url || `http://${host}:${port}`;
  const dryRun = Boolean(options['dry-run']);
  const openCommand = getOpenCommand(url);

  const payload = {
    ok: true,
    dryRun,
    dashboardDir,
    url,
    command: openCommand.command,
    args: openCommand.args
  };

  if (dryRun) {
    logger.log(t('dashboard.open_ready', { url }));
    return payload;
  }

  logger.log(t('dashboard.open_start', { url }));
  let result = await exec(openCommand.command, openCommand.args, { stdio: 'inherit' });

  if (result.code !== 0 && openCommand.fallback) {
    result = await exec(openCommand.fallback.command, openCommand.fallback.args, { stdio: 'inherit' });
    payload.command = openCommand.fallback.command;
    payload.args = openCommand.fallback.args;
  }

  if (result.code !== 0) {
    throw new Error(t('dashboard.open_failed', { detail: commandDetail(result) }));
  }

  return payload;
}

module.exports = {
  DEFAULT_DASHBOARD_REPO,
  runDashboardInit,
  runDashboardDev,
  runDashboardOpen,
  registerProjectInDashboard,
  resolveDashboardDir
};
