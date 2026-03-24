'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

// Approximate USD cost per 1M tokens for a mid-tier model (Sonnet-class)
const COST_PER_M = {
  input_tokens: 3.0,
  output_tokens: 15.0,
  tool_use_input: 3.0,
  tool_outputs: 3.0,
  cache_write: 3.75,
  cache_read: 0.30
};

// Token breakdown categories (6) — order determines stacked bar segment order
const TOKEN_CATEGORIES = [
  'input_tokens',
  'output_tokens',
  'tool_use_input',
  'tool_outputs',
  'cache_write',
  'cache_read'
];

// Waste threshold: tool_outputs > 60% of total tokens
const WASTE_THRESHOLD = 0.60;

function estimateSessionCost(breakdown) {
  if (!breakdown) return 0;
  let cost = 0;
  for (const [key, rate] of Object.entries(COST_PER_M)) {
    cost += ((breakdown[key] || 0) / 1e6) * rate;
  }
  return Math.round(cost * 10000) / 10000;
}

function computeSessionTotal(breakdown) {
  if (!breakdown) return 0;
  return TOKEN_CATEGORIES.reduce((sum, k) => sum + (breakdown[k] || 0), 0);
}

function detectWaste(sessions) {
  if (!sessions || sessions.length === 0) return false;
  let total = 0;
  let toolOutputs = 0;
  for (const session of sessions) {
    const bd = session.breakdown || {};
    total += computeSessionTotal(bd);
    toolOutputs += bd.tool_outputs || 0;
  }
  return total > 0 && toolOutputs / total > WASTE_THRESHOLD;
}

/**
 * Read token-usage.json for a squad and compute cost + waste flags.
 * @param {string} projectDir
 * @param {string} squadSlug
 * @param {boolean} breakdown  — if true, include per-session breakdown
 * @returns {object|null}
 */
async function getTokenUsage(projectDir, squadSlug, breakdown) {
  const filePath = path.join(projectDir, SQUADS_DIR, squadSlug, 'token-usage.json');
  let data;
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  const agents = data.agents || {};
  const result = { squadSlug, updatedAt: data.updatedAt, agents: {} };

  for (const [slug, agent] of Object.entries(agents)) {
    const sessions = agent.sessions || [];
    const enrichedSessions = sessions.map(s => ({
      ...s,
      totalTokens: s.totalTokens != null ? s.totalTokens : computeSessionTotal(s.breakdown),
      estimatedCostUsd: s.estimatedCostUsd != null ? s.estimatedCostUsd : estimateSessionCost(s.breakdown)
    }));

    const totalCostUsd = enrichedSessions.reduce((sum, s) => sum + s.estimatedCostUsd, 0);
    const wasteFlag = detectWaste(enrichedSessions);

    result.agents[slug] = {
      totalTokens: agent.totalTokens || enrichedSessions.reduce((s, e) => s + e.totalTokens, 0),
      totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
      wasteFlag,
      sessions: breakdown ? enrichedSessions : undefined
    };
  }

  return result;
}

module.exports = { getTokenUsage, estimateSessionCost, detectWaste, TOKEN_CATEGORIES, WASTE_THRESHOLD };
