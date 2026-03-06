'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUAD_FILE = '.aios-lite/squads/active/squad.md';

function extractField(content, label) {
  const regex = new RegExp(`^(?:${label}):\\s*(.+)$`, 'im');
  const match = String(content || '').match(regex);
  return match ? String(match[1]).trim() : null;
}

function countPerspectives(content) {
  const matches = String(content || '').match(/^###\s+.+$/gm);
  return matches ? matches.length : 0;
}

async function runSquadStatus({ args, options, logger, t }) {
  const targetDir = args[0] || process.cwd();
  const squadFile = path.join(targetDir, SQUAD_FILE);

  let content;
  try {
    content = await fs.readFile(squadFile, 'utf8');
  } catch {
    logger.log(t('squad_status.no_squad'));
    logger.log(t('squad_status.hint'));
    return { ok: true, active: false };
  }

  // Check if the file has actual squad content (not just the empty template)
  const trimmed = content.trim();
  if (!trimmed || trimmed.startsWith('<!--')) {
    logger.log(t('squad_status.no_squad'));
    logger.log(t('squad_status.hint'));
    return { ok: true, active: false };
  }

  const domain = extractField(content, 'Active Squad|Squad Ativo|Squad Activo|Squad Actif') ||
    extractField(content, 'Domínio|Dominio|Domain') ||
    '—';
  const mode = extractField(content, 'Mode|Modo') || '—';
  const goal = extractField(content, 'Goal|Objetivo|Objectif') || '—';
  const perspectives = countPerspectives(content);

  // Extract created date from frontmatter or first heading area
  const dateMatch = content.match(/generated:\s*(\d{4}-\d{2}-\d{2})/i) ||
    content.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '—';

  logger.log(t('squad_status.squad_found', { path: squadFile }));
  logger.log(t('squad_status.domain', { value: domain }));
  logger.log(t('squad_status.mode', { value: mode }));
  logger.log(t('squad_status.goal', { value: goal }));
  logger.log(t('squad_status.perspectives', { count: perspectives }));
  if (date !== '—') {
    logger.log(t('squad_status.created', { value: date }));
  }

  return {
    ok: true,
    active: true,
    domain,
    mode,
    goal,
    perspectives,
    path: squadFile
  };
}

module.exports = { runSquadStatus };
