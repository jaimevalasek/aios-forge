'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 8000]; // ms — exponential-ish backoff

function resolveEnvPlaceholders(value) {
  return String(value || '').replace(/\{\{ENV:(\w+)\}\}/g, (_, varName) => {
    return process.env[varName] || '';
  });
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

function logDelivery(db, entry) {
  db.prepare(`
    INSERT INTO delivery_log (squad_slug, content_key, webhook_slug, trigger_type, url, status_code, response_body, error_message, attempt, created_at)
    VALUES (@squad_slug, @content_key, @webhook_slug, @trigger_type, @url, @status_code, @response_body, @error_message, @attempt, @created_at)
  `).run({
    squad_slug: entry.squadSlug,
    content_key: entry.contentKey || null,
    webhook_slug: entry.webhookSlug || null,
    trigger_type: entry.triggerType,
    url: entry.url,
    status_code: entry.statusCode ?? null,
    response_body: entry.responseBody ? String(entry.responseBody).slice(0, 2000) : null,
    error_message: entry.errorMessage || null,
    attempt: entry.attempt || 1,
    created_at: nowIso()
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWebhookHttp(url, headers, payload) {
  const body = JSON.stringify(payload);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
      signal: controller.signal
    });

    const responseBody = await response.text().catch(() => '');
    return {
      statusCode: response.status,
      responseBody,
      ok: response.status >= 200 && response.status < 300
    };
  } catch (err) {
    return {
      statusCode: null,
      responseBody: null,
      ok: false,
      errorMessage: err.name === 'AbortError' ? 'Request timeout (15s)' : err.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function executeWorkerScript(workerPath, payload) {
  return new Promise((resolve) => {
    const child = spawn('python3', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();

    child.on('close', (code) => {
      resolve({
        statusCode: code === 0 ? 200 : 500,
        responseBody: stdout.slice(0, 2000),
        ok: code === 0,
        errorMessage: code !== 0 ? (stderr.slice(0, 500) || `Worker exited with code ${code}`) : null
      });
    });

    child.on('error', (err) => {
      resolve({
        statusCode: null,
        responseBody: null,
        ok: false,
        errorMessage: err.message
      });
    });
  });
}

function isRetryable(result) {
  if (result.errorMessage) return true; // network error, timeout
  if (!result.statusCode) return true;
  // Retry on 5xx and 429 (rate limit)
  return result.statusCode >= 500 || result.statusCode === 429;
}

async function deliverWebhook(db, { squadSlug, contentKey, webhook, triggerType, payload, projectDir }) {
  const resolvedUrl = resolveEnvPlaceholders(webhook.url);
  if (!resolvedUrl) {
    logDelivery(db, {
      squadSlug,
      contentKey,
      webhookSlug: webhook.slug,
      triggerType,
      url: webhook.url || '(empty)',
      errorMessage: 'URL resolved to empty — check ENV variable',
      attempt: 1
    });
    return { ok: false, error: 'URL resolved to empty' };
  }

  const resolvedHeaders = {};
  if (webhook.headers && typeof webhook.headers === 'object') {
    for (const [key, value] of Object.entries(webhook.headers)) {
      resolvedHeaders[key] = resolveEnvPlaceholders(value);
    }
  }

  // Decide execution path: worker script or direct HTTP
  const hasWorker = webhook.worker && typeof webhook.worker === 'string';
  let workerAbsPath = null;
  if (hasWorker) {
    workerAbsPath = path.resolve(projectDir, webhook.worker);
    try {
      await fs.access(workerAbsPath);
    } catch {
      workerAbsPath = null; // Worker not found, fall back to HTTP
    }
  }

  let lastResult = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      await sleep(RETRY_DELAYS[attempt - 2] || 8000);
    }

    if (workerAbsPath) {
      lastResult = await executeWorkerScript(workerAbsPath, payload);
    } else {
      lastResult = await executeWebhookHttp(resolvedUrl, resolvedHeaders, payload);
    }

    logDelivery(db, {
      squadSlug,
      contentKey,
      webhookSlug: webhook.slug,
      triggerType,
      url: resolvedUrl,
      statusCode: lastResult.statusCode,
      responseBody: lastResult.responseBody,
      errorMessage: lastResult.errorMessage || null,
      attempt
    });

    if (lastResult.ok) {
      return { ok: true, statusCode: lastResult.statusCode, attempts: attempt };
    }

    if (!isRetryable(lastResult)) {
      return { ok: false, statusCode: lastResult.statusCode, error: lastResult.errorMessage, attempts: attempt };
    }
  }

  return {
    ok: false,
    statusCode: lastResult?.statusCode ?? null,
    error: lastResult?.errorMessage || `Failed after ${MAX_RETRIES} attempts`,
    attempts: MAX_RETRIES
  };
}

async function readSquadManifestJson(projectDir, squadSlug) {
  const paths = [
    path.join(projectDir, '.aioson', 'squads', squadSlug, 'squad.manifest.json'),
    path.join(projectDir, 'agents', squadSlug, 'squad.manifest.json')
  ];

  for (const manifestPath of paths) {
    try {
      const raw = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      continue;
    }
  }

  return null;
}

function getOutputStrategy(manifest) {
  if (manifest.outputStrategy && typeof manifest.outputStrategy === 'object') {
    return manifest.outputStrategy;
  }
  return null;
}

function getWebhooksForTrigger(outputStrategy, triggerType) {
  if (!outputStrategy || !outputStrategy.delivery) return [];
  const webhooks = Array.isArray(outputStrategy.delivery.webhooks) ? outputStrategy.delivery.webhooks : [];
  return webhooks.filter((wh) => wh.trigger === triggerType || wh.trigger === 'on-create');
}

/**
 * Main entry point — called after content item is upserted.
 * Checks if auto-publish is enabled and fires matching webhooks.
 */
async function runAutoDelivery(db, { projectDir, squadSlug, contentKey, contentPayload }) {
  const manifest = await readSquadManifestJson(projectDir, squadSlug);
  if (!manifest) return { delivered: false, reason: 'no_manifest' };

  const strategy = getOutputStrategy(manifest);
  if (!strategy) return { delivered: false, reason: 'no_output_strategy' };

  const delivery = strategy.delivery && typeof strategy.delivery === 'object' ? strategy.delivery : {};
  if (!delivery.autoPublish) return { delivered: false, reason: 'auto_publish_disabled' };

  const webhooks = getWebhooksForTrigger(strategy, 'on-publish');
  if (webhooks.length === 0) return { delivered: false, reason: 'no_matching_webhooks' };

  const payload = {
    squadSlug,
    contentKey,
    timestamp: new Date().toISOString(),
    content: contentPayload || null
  };

  const results = [];
  for (const webhook of webhooks) {
    const result = await deliverWebhook(db, {
      squadSlug,
      contentKey,
      webhook,
      triggerType: 'auto',
      payload,
      projectDir
    });
    results.push({ webhookSlug: webhook.slug, ...result });
  }

  return {
    delivered: true,
    results,
    allOk: results.every((r) => r.ok)
  };
}

/**
 * Manual delivery — triggered by CLI command or dashboard action.
 * Fires all webhooks matching the given trigger type for a content item.
 */
async function runManualDelivery(db, { projectDir, squadSlug, contentKey, triggerType = 'manual', contentPayload }) {
  const manifest = await readSquadManifestJson(projectDir, squadSlug);
  if (!manifest) return { delivered: false, reason: 'no_manifest' };

  const strategy = getOutputStrategy(manifest);
  if (!strategy) return { delivered: false, reason: 'no_output_strategy' };

  const delivery = strategy.delivery && typeof strategy.delivery === 'object' ? strategy.delivery : {};
  const webhooks = Array.isArray(delivery.webhooks) ? delivery.webhooks : [];

  const matching = triggerType === 'manual'
    ? webhooks
    : webhooks.filter((wh) => wh.trigger === triggerType);

  if (matching.length === 0) return { delivered: false, reason: 'no_matching_webhooks' };

  const payload = {
    squadSlug,
    contentKey,
    timestamp: new Date().toISOString(),
    content: contentPayload || null
  };

  const results = [];
  for (const webhook of matching) {
    const result = await deliverWebhook(db, {
      squadSlug,
      contentKey,
      webhook,
      triggerType,
      payload,
      projectDir
    });
    results.push({ webhookSlug: webhook.slug, ...result });
  }

  return {
    delivered: true,
    results,
    allOk: results.every((r) => r.ok)
  };
}

module.exports = {
  runAutoDelivery,
  runManualDelivery,
  deliverWebhook,
  resolveEnvPlaceholders
};
