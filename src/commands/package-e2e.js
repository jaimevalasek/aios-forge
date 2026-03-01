'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ensureDir } = require('../utils');

function toArg(value) {
  return typeof value === 'string' ? value : String(value);
}

async function runCommand(cmd, args, options = {}) {
  const cwd = options.cwd || process.cwd();
  const env = { ...process.env, ...(options.env || {}) };
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args.map((arg) => toArg(arg)), {
      cwd,
      env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        code: Number(code || 0),
        stdout,
        stderr
      });
    });
  });
}

function parsePackResult(stdout) {
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  return lines[lines.length - 1];
}

async function resolveTarballFromDir(packDir) {
  const files = await fs.readdir(packDir);
  const tgz = files.filter((file) => file.endsWith('.tgz'));
  if (tgz.length === 0) return '';

  let latestName = '';
  let latestTime = -1;
  for (const file of tgz) {
    const stat = await fs.stat(path.join(packDir, file));
    if (stat.mtimeMs >= latestTime) {
      latestTime = stat.mtimeMs;
      latestName = file;
    }
  }
  return latestName;
}

async function runPackageTest({ args, options = {}, logger, t }) {
  const sourceDir = path.resolve(process.cwd(), args[0] || '.');
  const keep = Boolean(options.keep);
  const dryRun = Boolean(options['dry-run']);
  const jsonMode = Boolean(options.json);

  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aios-lite-package-test-'));
  const projectName = 'sample-app';
  const projectDir = path.join(workspaceRoot, projectName);
  const packDir = path.join(workspaceRoot, 'dist');
  const npmCacheDir = path.join(workspaceRoot, '.npm-cache');
  await ensureDir(packDir);
  await ensureDir(npmCacheDir);

  const steps = [];
  let tarballName = '';
  let tarballPath = '';
  let doctorResult = null;
  let mcpResult = null;

  try {
    if (dryRun) {
      steps.push('dry-run:plan-only');
      return {
        ok: true,
        dryRun: true,
        keep,
        sourceDir,
        workspaceRoot,
        projectDir,
        steps
      };
    }

    const pack = await runCommand('npm', ['pack', '--silent', '--pack-destination', packDir], {
      cwd: sourceDir,
      env: {
        NPM_CONFIG_CACHE: npmCacheDir,
        npm_config_cache: npmCacheDir
      }
    });
    if (pack.code !== 0) {
      throw new Error(`npm pack failed: ${pack.stderr || pack.stdout || 'unknown error'}`);
    }
    tarballName = parsePackResult(pack.stdout);
    if (!tarballName) {
      tarballName = await resolveTarballFromDir(packDir);
    }
    if (!tarballName) {
      throw new Error('npm pack did not return tarball name');
    }
    tarballPath = path.join(packDir, tarballName);
    steps.push('pack');

    const init = await runCommand(
      'npx',
      ['--yes', '--package', tarballPath, 'aios-lite', 'init', projectName, '--locale=en'],
      {
        cwd: workspaceRoot,
        env: {
          NPM_CONFIG_CACHE: npmCacheDir,
          npm_config_cache: npmCacheDir
        }
      }
    );
    if (init.code !== 0) {
      throw new Error(`npx init failed: ${init.stderr || init.stdout || 'unknown error'}`);
    }
    steps.push('npx:init');

    const setup = await runCommand(
      'npx',
      [
        '--yes',
        '--package',
        tarballPath,
        'aios-lite',
        'setup:context',
        projectDir,
        '--defaults',
        '--project-name=sample-app',
        '--project-type=web_app',
        '--profile=developer',
        '--framework=Node/Express',
        '--framework-installed=true',
        '--language=en',
        '--backend-choice=4',
        '--database-choice=3'
      ],
      {
        cwd: workspaceRoot,
        env: {
          NPM_CONFIG_CACHE: npmCacheDir,
          npm_config_cache: npmCacheDir
        }
      }
    );
    if (setup.code !== 0) {
      throw new Error(`npx setup:context failed: ${setup.stderr || setup.stdout || 'unknown error'}`);
    }
    steps.push('npx:setup-context');

    const doctor = await runCommand(
      'npx',
      ['--yes', '--package', tarballPath, 'aios-lite', 'doctor', projectDir, '--json'],
      {
        cwd: workspaceRoot,
        env: {
          NPM_CONFIG_CACHE: npmCacheDir,
          npm_config_cache: npmCacheDir
        }
      }
    );
    if (doctor.code !== 0) {
      throw new Error(`npx doctor failed: ${doctor.stderr || doctor.stdout || 'unknown error'}`);
    }
    doctorResult = JSON.parse(doctor.stdout);
    if (!doctorResult.ok) {
      throw new Error('doctor returned ok=false during package test');
    }
    steps.push('npx:doctor');

    const mcp = await runCommand(
      'npx',
      ['--yes', '--package', tarballPath, 'aios-lite', 'mcp:init', projectDir, '--json'],
      {
        cwd: workspaceRoot,
        env: {
          NPM_CONFIG_CACHE: npmCacheDir,
          npm_config_cache: npmCacheDir
        }
      }
    );
    if (mcp.code !== 0) {
      throw new Error(`npx mcp:init failed: ${mcp.stderr || mcp.stdout || 'unknown error'}`);
    }
    mcpResult = JSON.parse(mcp.stdout);
    if (!mcpResult.ok) {
      throw new Error('mcp:init returned ok=false during package test');
    }
    steps.push('npx:mcp-init');

    const output = {
      ok: true,
      dryRun: false,
      keep,
      sourceDir,
      workspaceRoot,
      projectDir,
      tarballName,
      tarballPath,
      steps,
      doctorOk: doctorResult.ok,
      mcpServerCount: mcpResult.serverCount
    };

    if (jsonMode) {
      return output;
    }

    logger.log(t('package_test.start', { sourceDir }));
    logger.log(t('package_test.pack_done', { tarball: tarballName }));
    logger.log(t('package_test.completed', { count: steps.length }));
    logger.log(t('package_test.workspace', { path: workspaceRoot }));

    return output;
  } finally {
    if (!keep && !dryRun) {
      await fs.rm(workspaceRoot, { recursive: true, force: true });
    }
  }
}

module.exports = {
  runPackageTest,
  runCommand,
  parsePackResult,
  resolveTarballFromDir
};
