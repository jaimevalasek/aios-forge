'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { REQUIRED_FILES } = require('./constants');
const { installTemplate } = require('./installer');
const { exists } = require('./utils');
const { validateProjectContextFile } = require('./context');
const { applyAgentLocale, resolveAgentLocale } = require('./locales');

function parseMajor(version) {
  const cleaned = String(version || '').replace(/^v/, '');
  const major = Number(cleaned.split('.')[0]);
  return Number.isFinite(major) ? major : 0;
}

async function fileContainsAll(filePath, patterns) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return patterns.every((pattern) => content.includes(pattern));
  } catch {
    return false;
  }
}

const GEMINI_COMMAND_EXPECTATIONS = [
  { file: '.gemini/commands/aios-setup.toml', agent: 'setup' },
  { file: '.gemini/commands/aios-analyst.toml', agent: 'analyst' },
  { file: '.gemini/commands/aios-architect.toml', agent: 'architect' },
  { file: '.gemini/commands/aios-pm.toml', agent: 'pm' },
  { file: '.gemini/commands/aios-dev.toml', agent: 'dev' },
  { file: '.gemini/commands/aios-qa.toml', agent: 'qa' },
  { file: '.gemini/commands/aios-orchestrator.toml', agent: 'orchestrator' }
];

async function runDoctor(targetDir) {
  const checks = [];

  for (const rel of REQUIRED_FILES) {
    const filePath = path.join(targetDir, rel);
    checks.push({
      id: `file:${rel}`,
      key: 'doctor.required_file',
      params: { rel },
      ok: await exists(filePath)
    });
  }

  const gatewayChecks = [
    {
      id: 'gateway:claude:contract',
      rel: 'CLAUDE.md',
      key: 'doctor.gateway_claude_pointer',
      hintKey: 'doctor.gateway_claude_pointer_hint',
      patterns: ['.aios-lite/config.md', '.aios-lite/agents/setup.md']
    },
    {
      id: 'gateway:codex:contract',
      rel: 'AGENTS.md',
      key: 'doctor.gateway_codex_pointer',
      hintKey: 'doctor.gateway_codex_pointer_hint',
      patterns: ['.aios-lite/config.md', '.aios-lite/agents/']
    },
    {
      id: 'gateway:gemini:contract',
      rel: '.gemini/GEMINI.md',
      key: 'doctor.gateway_gemini_pointer',
      hintKey: 'doctor.gateway_gemini_pointer_hint',
      patterns: ['.gemini/commands/', '.aios-lite/agents/']
    },
    {
      id: 'gateway:opencode:contract',
      rel: 'OPENCODE.md',
      key: 'doctor.gateway_opencode_pointer',
      hintKey: 'doctor.gateway_opencode_pointer_hint',
      patterns: ['.aios-lite/config.md', '.aios-lite/agents/']
    }
  ];

  for (const gatewayCheck of gatewayChecks) {
    const gatewayPath = path.join(targetDir, gatewayCheck.rel);
    if (!(await exists(gatewayPath))) continue;
    checks.push({
      id: gatewayCheck.id,
      key: gatewayCheck.key,
      params: {},
      ok: await fileContainsAll(gatewayPath, gatewayCheck.patterns),
      hintKey: gatewayCheck.hintKey
    });
  }

  for (const expectation of GEMINI_COMMAND_EXPECTATIONS) {
    const commandPath = path.join(targetDir, expectation.file);
    if (!(await exists(commandPath))) continue;
    checks.push({
      id: `gateway:gemini:command:${expectation.agent}`,
      key: 'doctor.gateway_gemini_command_pointer',
      params: { file: expectation.file },
      ok: await fileContainsAll(commandPath, [
        `instruction_file = ".aios-lite/agents/${expectation.agent}.md"`
      ]),
      hintKey: 'doctor.gateway_gemini_command_pointer_hint',
      hintParams: {
        file: expectation.file,
        agent: expectation.agent
      }
    });
  }

  const contextPath = path.join(targetDir, '.aios-lite/context/project.context.md');
  checks.push({
    id: 'context:project',
    key: 'doctor.context_generated',
    params: {},
    ok: await exists(contextPath),
    hintKey: 'doctor.context_hint'
  });

  const contextValidation = await validateProjectContextFile(targetDir);
  if (contextValidation.exists) {
    checks.push({
      id: 'context:frontmatter',
      key: 'doctor.context_frontmatter_valid',
      params: {},
      ok: contextValidation.parsed,
      hintKey: contextValidation.parsed ? undefined : 'doctor.context_frontmatter_valid_hint'
    });

    for (const issue of contextValidation.issues) {
      checks.push({
        id: issue.id,
        key: issue.key,
        params: issue.params || {},
        ok: false,
        hintKey: issue.hintKey,
        hintParams: issue.hintParams || undefined
      });
    }
  }

  const major = parseMajor(process.version);
  checks.push({
    id: 'node:version',
    key: 'doctor.node_version',
    params: { version: process.version },
    ok: major >= 18
  });

  const failed = checks.filter((c) => !c.ok);

  return {
    ok: failed.length === 0,
    checks,
    failedCount: failed.length,
    contextValidation
  };
}

async function applyDoctorFixes(targetDir, report, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const actions = [];
  let changedCount = 0;

  const missingRequiredFiles = report.checks
    .filter((check) => !check.ok && check.id.startsWith('file:'))
    .map((check) => check.params.rel);

  if (missingRequiredFiles.length > 0) {
    const installResult = await installTemplate(targetDir, {
      overwrite: false,
      dryRun,
      mode: 'install'
    });
    const copiedRequired = installResult.copied.filter((rel) => missingRequiredFiles.includes(rel));
    if (copiedRequired.length > 0) changedCount += copiedRequired.length;
    actions.push({
      id: 'required_files',
      applied: copiedRequired.length > 0,
      count: copiedRequired.length,
      missingCount: missingRequiredFiles.length
    });
  } else {
    actions.push({
      id: 'required_files',
      applied: false,
      skipped: true,
      count: 0,
      missingCount: 0
    });
  }

  if (
    report.contextValidation &&
    report.contextValidation.parsed &&
    report.contextValidation.valid &&
    report.contextValidation.data &&
    report.contextValidation.data.conversation_language
  ) {
    const locale = resolveAgentLocale(report.contextValidation.data.conversation_language);
    const localeResult = await applyAgentLocale(targetDir, locale, { dryRun });
    if (localeResult.copied.length > 0) changedCount += localeResult.copied.length;
    actions.push({
      id: 'locale_sync',
      applied: localeResult.copied.length > 0,
      count: localeResult.copied.length,
      locale: localeResult.locale
    });
  } else {
    actions.push({
      id: 'locale_sync',
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

module.exports = {
  runDoctor,
  parseMajor,
  applyDoctorFixes
};
