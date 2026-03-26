'use strict';

const http = require('node:http');
const https = require('node:https');
const { randomBytes } = require('node:crypto');

function generateRunId() {
  return randomBytes(8).toString('hex');
}

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function postCallback(url, payload, maxRetries = 3) {
  const delays = [30000, 60000, 120000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        let parsed;
        try { parsed = new URL(url); } catch { return reject(new Error('Invalid callback URL')); }
        const isHttps = parsed.protocol === 'https:';
        const mod = isHttps ? https : http;
        const opts = {
          hostname: parsed.hostname,
          port: parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        };
        const req = mod.request(opts, res => {
          res.resume();
          if (res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`Callback returned HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(new Error('Callback timeout')); });
        req.write(body);
        req.end();
      });
      return; // success — stop retrying
    } catch {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delays[attempt] || 120000));
      }
    }
  }
}

class WebhookServer {
  /**
   * @param {object} options
   * @param {number}   [options.port=3210]
   * @param {string}   [options.token='']       Bearer token (empty = no auth)
   * @param {number}   [options.rateLimit=60]   Max req/min per IP
   * @param {Array}    [options.squads=[]]       [{name, timeout_ms}] — empty = all allowed
   * @param {Function} [options.onTrigger]       async ({squad,input,session_id,metadata,run_id}) -> {response}
   * @param {Function} [options.onQuery]         async ({squad,query,max_results}) -> {results}
   * @param {string}   [options.version='0.0.0']
   */
  constructor(options = {}) {
    this.port = options.port || 3210;
    this.token = options.token || '';
    this.rateLimit = options.rateLimit || 60;
    this.allowedSquads = options.squads || [];
    this.onTrigger = options.onTrigger || null;
    this.onQuery = options.onQuery || null;
    this.version = options.version || '0.0.0';

    this._runs = new Map();       // run_id -> {status, response, error, session_id, metadata}
    this._ipCounters = new Map(); // ip -> {count, windowStart}
    this._server = null;
  }

  _checkRateLimit(ip) {
    const now = Date.now();
    const window = 60_000;
    const entry = this._ipCounters.get(ip) || { count: 0, windowStart: now };
    if (now - entry.windowStart > window) {
      entry.count = 0;
      entry.windowStart = now;
    }
    entry.count++;
    this._ipCounters.set(ip, entry);
    return entry.count <= this.rateLimit;
  }

  _validateToken(req) {
    if (!this.token) return true;
    const auth = req.headers['authorization'] || '';
    const spaceIdx = auth.indexOf(' ');
    if (spaceIdx === -1) return false;
    const scheme = auth.slice(0, spaceIdx);
    const tok = auth.slice(spaceIdx + 1);
    return scheme === 'Bearer' && tok === this.token;
  }

  _getSquadNames() {
    return this.allowedSquads.map(s => (typeof s === 'string' ? s : s.name));
  }

  _isSquadAllowed(squadName) {
    if (this.allowedSquads.length === 0) return true;
    return this._getSquadNames().includes(squadName);
  }

  _getSquadTimeout(squadName) {
    const entry = this.allowedSquads.find(s => (typeof s === 'string' ? s : s.name) === squadName);
    return (entry && entry.timeout_ms) || 120000;
  }

  async _handleTrigger(req, res) {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return sendJSON(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const { squad, input, session_id, callback_url, metadata } = body;

    if (!squad) return sendJSON(res, 400, { ok: false, error: 'squad is required' });
    if (!input) return sendJSON(res, 400, { ok: false, error: 'input is required' });

    if (!this._isSquadAllowed(squad)) {
      return sendJSON(res, 404, {
        ok: false,
        error: `Squad "${squad}" not found`,
        available_squads: this._getSquadNames()
      });
    }

    const run_id = generateRunId();
    this._runs.set(run_id, { status: 'queued', response: null, error: null, session_id, metadata });

    sendJSON(res, 202, { run_id, status: 'queued' });

    setImmediate(async () => {
      const run = this._runs.get(run_id);
      run.status = 'running';

      const timeoutMs = this._getSquadTimeout(squad);

      let timeoutHandle;
      try {
        const execPromise = this.onTrigger
          ? this.onTrigger({ squad, input, session_id, metadata, run_id })
          : Promise.resolve({ response: `Squad ${squad} queued: ${input}` });

        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Squad execution timed out')), timeoutMs);
        });

        const result = await Promise.race([execPromise, timeoutPromise]);
        clearTimeout(timeoutHandle);
        run.status = 'completed';
        run.response = result.response || '';
      } catch (err) {
        clearTimeout(timeoutHandle);
        run.status = 'failed';
        run.error = err.message;
      }

      if (callback_url) {
        const callbackPayload = {
          run_id,
          session_id,
          response: run.response,
          status: run.status,
          metadata
        };
        postCallback(callback_url, callbackPayload).catch(() => {});
      }
    });
  }

  _handleStatus(runId, res) {
    const run = this._runs.get(runId);
    if (!run) return sendJSON(res, 404, { ok: false, error: 'Run not found' });
    return sendJSON(res, 200, {
      run_id: runId,
      status: run.status,
      response: run.response || null,
      error: run.error || null
    });
  }

  async _handleQuery(req, res) {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return sendJSON(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const { squad, query, max_results } = body;

    if (!squad) return sendJSON(res, 400, { ok: false, error: 'squad is required' });
    if (!query) return sendJSON(res, 400, { ok: false, error: 'query is required' });

    if (!this._isSquadAllowed(squad)) {
      return sendJSON(res, 404, {
        ok: false,
        error: `Squad "${squad}" not found`,
        available_squads: this._getSquadNames()
      });
    }

    const t0 = Date.now();
    const QUERY_TIMEOUT_MS = 10_000;

    let timeoutHandle;
    try {
      const execPromise = this.onQuery
        ? this.onQuery({ squad, query, max_results: max_results || 10 })
        : Promise.resolve({ results: [] });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Query timed out')), QUERY_TIMEOUT_MS);
      });

      const result = await Promise.race([execPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);
      const latency_ms = Date.now() - t0;

      return sendJSON(res, 200, {
        results: result.results || [],
        squad,
        latency_ms
      });
    } catch (err) {
      clearTimeout(timeoutHandle);
      const latency_ms = Date.now() - t0;
      return sendJSON(res, 504, { ok: false, error: err.message, squad, latency_ms });
    }
  }

  _handleHealth(res) {
    return sendJSON(res, 200, {
      ok: true,
      version: this.version,
      squads: this._getSquadNames()
    });
  }

  async _handleRequest(req, res) {
    const ip = req.socket.remoteAddress || '0.0.0.0';
    const url = req.url || '/';
    const method = req.method || 'GET';

    if (!this._checkRateLimit(ip)) {
      return sendJSON(res, 429, { ok: false, error: 'Too many requests' });
    }

    // Health check — no auth required
    if (method === 'GET' && url === '/health') {
      return this._handleHealth(res);
    }

    if (!this._validateToken(req)) {
      return sendJSON(res, 401, { ok: false, error: 'Unauthorized' });
    }

    if (method === 'POST' && url === '/trigger') {
      return this._handleTrigger(req, res);
    }

    if (method === 'POST' && url === '/query') {
      return this._handleQuery(req, res);
    }

    const statusMatch = method === 'GET' && url.match(/^\/status\/([^/?]+)/);
    if (statusMatch) {
      return this._handleStatus(statusMatch[1], res);
    }

    return sendJSON(res, 404, { ok: false, error: 'Not found' });
  }

  start() {
    return new Promise((resolve, reject) => {
      this._server = http.createServer((req, res) => {
        this._handleRequest(req, res).catch(() => {
          sendJSON(res, 500, { ok: false, error: 'Internal server error' });
        });
      });
      this._server.listen(this.port, () => resolve(this._server));
      this._server.once('error', reject);
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this._server) return resolve();
      // Close idle keep-alive connections so server.close() callback fires promptly
      if (typeof this._server.closeIdleConnections === 'function') {
        this._server.closeIdleConnections();
      }
      this._server.close(err => (err ? reject(err) : resolve()));
    });
  }
}

module.exports = { WebhookServer, postCallback };
