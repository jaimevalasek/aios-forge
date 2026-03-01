'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { validateProjectContextFile } = require('../context');
const { exists, ensureDir } = require('../utils');
const {
  parseWorkers,
  renderSharedDecisions,
  renderAgentStatus,
  PREREQUISITE_FILES
} = require('./parallel-init');

const DEFAULT_FIX_WORKERS = 3;

function makeCheck(id, ok, severity, message, hint = '') {
  return {
    id,
    ok: Boolean(ok),
    severity,
    message: String(message || ''),
    hint: String(hint || '')
  };
}

function buildLaneFilename(index) {
  return `agent-${index}.status.md`;
}

function parseLaneIndex(fileName) {
  const match = String(fileName || '').match(/^agent-(\d+)\.status\.md$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function laneRange(count) {
  const output = [];
  for (let i = 1; i <= count; i += 1) {
    output.push(i);
  }
  return output;
}

function summarizeChecks(checks) {
  const passed = checks.filter((item) => item.ok).length;
  const failed = checks.filter((item) => !item.ok && item.severity === 'error').length;
  const warnings = checks.filter((item) => !item.ok && item.severity === 'warn').length;
  return {
    total: checks.length,
    passed,
    failed,
    warnings
  };
}

function formatCheckPrefix(check) {
  if (check.ok) return 'OK';
  if (check.severity === 'warn') return 'WARN';
  return 'FAIL';
}

async function collectPrerequisites(targetDir) {
  const items = [];
  for (const rel of PREREQUISITE_FILES) {
    items.push({
      path: rel,
      exists: await exists(path.join(targetDir, rel))
    });
  }
  return items;
}

function resolveExpectedWorkers(state, workersOption) {
  if (workersOption !== undefined && workersOption !== null) return workersOption;
  if (state.laneIndices.length > 0) return Math.max(...state.laneIndices);
  return DEFAULT_FIX_WORKERS;
}

async function inspectParallelState(targetDir, workersOption) {
  const parallelDir = path.join(targetDir, '.aios-lite/context/parallel');
  const dirExists = await exists(parallelDir);
  const entries = dirExists ? await fs.readdir(parallelDir) : [];
  const sharedExists = entries.includes('shared-decisions.md');
  const laneIndices = entries
    .map(parseLaneIndex)
    .filter((value) => value !== null)
    .sort((a, b) => a - b);
  const laneFiles = laneIndices.map((index) => buildLaneFilename(index));

  const expectedWorkers = resolveExpectedWorkers(
    {
      laneIndices
    },
    workersOption
  );
  const expectedLaneIndices = laneRange(expectedWorkers);
  const missingLaneIndices = expectedLaneIndices.filter((index) => !laneIndices.includes(index));

  return {
    parallelDir,
    dirExists,
    entries,
    sharedExists,
    laneIndices,
    laneFiles,
    expectedWorkers,
    expectedLaneIndices,
    missingLaneIndices
  };
}

function buildChecks(context, state, prerequisites, workersOption, force) {
  const checks = [];

  checks.push(
    makeCheck(
      'context.exists',
      context.exists,
      'error',
      context.exists ? 'project.context.md exists.' : 'project.context.md is missing.',
      context.exists ? '' : 'Run setup:context before parallel doctor.'
    )
  );

  checks.push(
    makeCheck(
      'context.parsed',
      context.parsed,
      'error',
      context.parsed ? 'project.context.md is parseable.' : 'project.context.md is invalid.',
      context.parsed ? '' : 'Fix context frontmatter before running parallel doctor.'
    )
  );

  const classification = String(context.data && context.data.classification ? context.data.classification : '');
  const isMedium = classification === 'MEDIUM';
  const classificationOk = isMedium || force;
  checks.push(
    makeCheck(
      'context.classification',
      classificationOk,
      'error',
      classificationOk
        ? `Parallel mode allowed for classification ${classification || 'unknown'}.`
        : `Parallel mode requires MEDIUM classification (current: ${classification || 'unknown'}).`,
      classificationOk ? '' : 'Use --force to override classification guard.'
    )
  );

  checks.push(
    makeCheck(
      'parallel.dir',
      state.dirExists,
      'error',
      state.dirExists
        ? '.aios-lite/context/parallel directory exists.'
        : '.aios-lite/context/parallel directory is missing.',
      state.dirExists ? '' : 'Run parallel:init or parallel:doctor --fix.'
    )
  );

  checks.push(
    makeCheck(
      'parallel.shared',
      state.sharedExists,
      'error',
      state.sharedExists
        ? 'shared-decisions.md is present.'
        : 'shared-decisions.md is missing.',
      state.sharedExists ? '' : 'Run parallel:doctor --fix to restore baseline files.'
    )
  );

  checks.push(
    makeCheck(
      'parallel.lanes.present',
      state.laneIndices.length > 0,
      'error',
      state.laneIndices.length > 0
        ? `Detected ${state.laneIndices.length} lane file(s).`
        : 'No agent lane status files found.',
      state.laneIndices.length > 0 ? '' : 'Run parallel:init or parallel:doctor --fix.'
    )
  );

  checks.push(
    makeCheck(
      'parallel.lanes.sequence',
      state.missingLaneIndices.length === 0,
      'error',
      state.missingLaneIndices.length === 0
        ? `Lane sequence is contiguous (1..${state.expectedWorkers}).`
        : `Missing lane files in sequence: ${state.missingLaneIndices.join(', ')}`,
      state.missingLaneIndices.length === 0 ? '' : 'Run parallel:doctor --fix to restore missing lane files.'
    )
  );

  if (workersOption !== undefined && workersOption !== null) {
    checks.push(
      makeCheck(
        'parallel.workers.option',
        state.expectedWorkers === workersOption,
        'info',
        `Workers option requested: ${workersOption}.`
      )
    );
  }

  const missingPrereq = prerequisites.filter((item) => !item.exists).length;
  checks.push(
    makeCheck(
      'parallel.prerequisites',
      missingPrereq === 0,
      missingPrereq === 0 ? 'info' : 'warn',
      missingPrereq === 0
        ? 'All prerequisite context files are present.'
        : `${missingPrereq} prerequisite context file(s) are missing.`,
      missingPrereq === 0 ? '' : 'Create discovery/architecture/prd context files before orchestration.'
    )
  );

  return checks;
}

async function applyParallelFixes(targetDir, context, state, options) {
  const dryRun = Boolean(options.dryRun);
  const generatedAt = new Date().toISOString();
  const projectName =
    String((context.data && context.data.project_name) || '').trim() || path.basename(targetDir) || 'project';
  const classification = String((context.data && context.data.classification) || 'MEDIUM');
  const actions = [];
  let changedCount = 0;

  if (!state.dirExists) {
    if (!dryRun) {
      await ensureDir(state.parallelDir);
    }
    actions.push({
      id: 'parallel_dir',
      applied: true,
      count: 1
    });
    changedCount += 1;
  } else {
    actions.push({
      id: 'parallel_dir',
      applied: false,
      skipped: true,
      count: 0
    });
  }

  if (!state.sharedExists) {
    const sharedPath = path.join(state.parallelDir, 'shared-decisions.md');
    const content = renderSharedDecisions({
      projectName,
      classification,
      workers: state.expectedWorkers,
      generatedAt
    });
    if (!dryRun) {
      await ensureDir(path.dirname(sharedPath));
      await fs.writeFile(sharedPath, content, 'utf8');
    }
    actions.push({
      id: 'shared_decisions',
      applied: true,
      count: 1
    });
    changedCount += 1;
  } else {
    actions.push({
      id: 'shared_decisions',
      applied: false,
      skipped: true,
      count: 0
    });
  }

  if (state.missingLaneIndices.length > 0) {
    for (const index of state.missingLaneIndices) {
      const lanePath = path.join(state.parallelDir, buildLaneFilename(index));
      const content = renderAgentStatus({
        index,
        generatedAt
      });
      if (!dryRun) {
        await ensureDir(path.dirname(lanePath));
        await fs.writeFile(lanePath, content, 'utf8');
      }
    }
    actions.push({
      id: 'lane_files',
      applied: true,
      count: state.missingLaneIndices.length
    });
    changedCount += state.missingLaneIndices.length;
  } else {
    actions.push({
      id: 'lane_files',
      applied: false,
      skipped: true,
      count: 0
    });
  }

  return {
    dryRun,
    actions,
    changedCount
  };
}

async function runParallelDoctor({ args, options = {}, logger, t }) {
  const targetDir = path.resolve(process.cwd(), args[0] || '.');
  const dryRun = Boolean(options['dry-run']);
  const fix = Boolean(options.fix);
  const force = Boolean(options.force);
  const workersOptionRaw = options.workers;
  const workersOption = workersOptionRaw !== undefined ? parseWorkers(workersOptionRaw) : undefined;
  if (workersOptionRaw !== undefined && workersOption === null) {
    throw new Error(
      t('parallel_doctor.invalid_workers', {
        min: 2,
        max: 6
      })
    );
  }

  const context = await validateProjectContextFile(targetDir);
  const prerequisites = await collectPrerequisites(targetDir);
  let state = await inspectParallelState(targetDir, workersOption);
  let checks = buildChecks(context, state, prerequisites, workersOption, force);
  let fixResult = null;

  if (fix) {
    const classification = String((context.data && context.data.classification) || '');
    if (classification !== 'MEDIUM' && !force) {
      throw new Error(
        t('parallel_doctor.requires_medium', {
          classification: classification || 'unknown'
        })
      );
    }
    fixResult = await applyParallelFixes(targetDir, context, state, {
      dryRun
    });

    state = await inspectParallelState(targetDir, workersOption);
    checks = buildChecks(context, state, prerequisites, workersOption, force);
  }

  const summary = summarizeChecks(checks);
  const output = {
    ok: summary.failed === 0,
    targetDir,
    workers: state.expectedWorkers,
    fix: {
      enabled: fix,
      dryRun,
      force,
      ...(fixResult
        ? {
            changedCount: fixResult.changedCount,
            actions: fixResult.actions
          }
        : {})
    },
    state: {
      parallelDir: state.parallelDir,
      dirExists: state.dirExists,
      sharedExists: state.sharedExists,
      laneFiles: state.laneFiles,
      laneIndices: state.laneIndices,
      missingLaneIndices: state.missingLaneIndices
    },
    checks,
    summary
  };

  if (options.json) {
    return output;
  }

  logger.log(t('parallel_doctor.report_title', { path: targetDir }));
  for (const check of checks) {
    logger.log(`[${formatCheckPrefix(check)}] ${check.id} - ${check.message}`);
    if (check.hint) {
      logger.log(`  -> ${check.hint}`);
    }
  }
  logger.log(
    t('parallel_doctor.summary', {
      passed: summary.passed,
      failed: summary.failed,
      warnings: summary.warnings
    })
  );

  if (fixResult) {
    logger.log(
      dryRun
        ? t('parallel_doctor.fix_summary_dry_run', { count: fixResult.changedCount })
        : t('parallel_doctor.fix_summary', { count: fixResult.changedCount })
    );
  }

  return output;
}

module.exports = {
  runParallelDoctor,
  parseLaneIndex,
  summarizeChecks
};
