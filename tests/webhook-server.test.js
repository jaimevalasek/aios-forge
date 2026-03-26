'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { WebhookServer } = require('../src/lib/webhook-server');

// --- Helpers ---

function makeRequest(port, method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body !== undefined ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'Connection': 'close'
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    // agent: false creates a new connection per request and closes it after the response,
    // which ensures server.close() resolves cleanly in tests.
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers, agent: false }, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function startServer(options) {
  const server = new WebhookServer({ port: 0, ...options });
  await server.start();
  const port = server._server.address().port;
  return { server, port };
}

// --- GET /health ---

test('GET /health returns ok=true with version and squads', async () => {
  const { server, port } = await startServer({
    squads: [{ name: 'alpha' }, { name: 'beta' }],
    version: '1.2.3'
  });
  try {
    const r = await makeRequest(port, 'GET', '/health', null);
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.version, '1.2.3');
    assert.deepEqual(r.body.squads, ['alpha', 'beta']);
  } finally {
    await server.stop();
  }
});

test('GET /health requires no authentication', async () => {
  const { server, port } = await startServer({ token: 'secret' });
  try {
    const r = await makeRequest(port, 'GET', '/health', null);
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
  } finally {
    await server.stop();
  }
});

test('GET /health returns empty squads array when none configured', async () => {
  const { server, port } = await startServer({ squads: [], version: '0.0.1' });
  try {
    const r = await makeRequest(port, 'GET', '/health', null);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.squads, []);
  } finally {
    await server.stop();
  }
});

// --- Authentication ---

test('POST /trigger without token returns 401', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 's' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', null, { squad: 's', input: 'hi' });
    assert.equal(r.status, 401);
    assert.equal(r.body.error, 'Unauthorized');
  } finally {
    await server.stop();
  }
});

test('POST /trigger with wrong token returns 401', async () => {
  const { server, port } = await startServer({ token: 'real', squads: [{ name: 's' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'wrong', { squad: 's', input: 'hi' });
    assert.equal(r.status, 401);
  } finally {
    await server.stop();
  }
});

test('POST /trigger with no token configured accepts any request', async () => {
  const { server, port } = await startServer({ token: '', squads: [{ name: 's' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', null, { squad: 's', input: 'hi' });
    assert.equal(r.status, 202);
  } finally {
    await server.stop();
  }
});

// --- POST /trigger validation ---

test('POST /trigger without squad returns 400', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 's' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'tok', { input: 'hi' });
    assert.equal(r.status, 400);
    assert.ok(r.body.error.includes('squad'));
  } finally {
    await server.stop();
  }
});

test('POST /trigger without input returns 400', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 's' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's' });
    assert.equal(r.status, 400);
    assert.ok(r.body.error.includes('input'));
  } finally {
    await server.stop();
  }
});

test('POST /trigger with unknown squad returns 404 and available squads', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'known' }] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 'ghost', input: 'hi' });
    assert.equal(r.status, 404);
    assert.ok(r.body.error.includes('ghost'));
    assert.deepEqual(r.body.available_squads, ['known']);
  } finally {
    await server.stop();
  }
});

test('POST /trigger with empty allowlist accepts any squad', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [] });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 'anything', input: 'hi' });
    assert.equal(r.status, 202);
    assert.ok(r.body.run_id);
    assert.equal(r.body.status, 'queued');
  } finally {
    await server.stop();
  }
});

// --- POST /trigger async execution ---

test('POST /trigger returns run_id and queued immediately', async () => {
  const { server, port } = await startServer({
    token: 'tok',
    squads: [{ name: 's' }],
    onTrigger: async () => ({ response: 'done' })
  });
  try {
    const r = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's', input: 'hello' });
    assert.equal(r.status, 202);
    assert.ok(r.body.run_id, 'should have run_id');
    assert.equal(r.body.status, 'queued');
  } finally {
    await server.stop();
  }
});

test('GET /status shows completed after onTrigger resolves', async () => {
  let resolveBarrier;
  const barrier = new Promise(r => { resolveBarrier = r; });

  const { server, port } = await startServer({
    token: 'tok',
    squads: [{ name: 's' }],
    onTrigger: async () => {
      await barrier;
      return { response: 'the answer' };
    }
  });
  try {
    const trigger = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's', input: 'q' });
    const runId = trigger.body.run_id;

    // Status is queued or running before barrier resolves
    const mid = await makeRequest(port, 'GET', `/status/${runId}`, 'tok');
    assert.ok(['queued', 'running'].includes(mid.body.status));

    resolveBarrier();
    await new Promise(r => setTimeout(r, 80));

    const done = await makeRequest(port, 'GET', `/status/${runId}`, 'tok');
    assert.equal(done.body.status, 'completed');
    assert.equal(done.body.response, 'the answer');
  } finally {
    await server.stop();
  }
});

test('GET /status shows failed when onTrigger throws', async () => {
  const { server, port } = await startServer({
    token: 'tok',
    squads: [{ name: 's' }],
    onTrigger: async () => { throw new Error('boom'); }
  });
  try {
    const trigger = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's', input: 'q' });
    const runId = trigger.body.run_id;

    await new Promise(r => setTimeout(r, 80));

    const r = await makeRequest(port, 'GET', `/status/${runId}`, 'tok');
    assert.equal(r.body.status, 'failed');
    assert.equal(r.body.error, 'boom');
  } finally {
    await server.stop();
  }
});

// --- GET /status ---

test('GET /status for unknown run_id returns 404', async () => {
  const { server, port } = await startServer({ token: 'tok' });
  try {
    const r = await makeRequest(port, 'GET', '/status/nonexistent', 'tok');
    assert.equal(r.status, 404);
  } finally {
    await server.stop();
  }
});

// --- POST /query ---

test('POST /query returns results with latency_ms', async () => {
  const { server, port } = await startServer({
    token: 'tok',
    squads: [{ name: 'cat' }],
    onQuery: async ({ max_results }) => ({
      results: [{ name: 'Item A' }, { name: 'Item B' }].slice(0, max_results)
    })
  });
  try {
    const r = await makeRequest(port, 'POST', '/query', 'tok', { squad: 'cat', query: 'item', max_results: 1 });
    assert.equal(r.status, 200);
    assert.equal(r.body.squad, 'cat');
    assert.equal(r.body.results.length, 1);
    assert.ok(typeof r.body.latency_ms === 'number');
  } finally {
    await server.stop();
  }
});

test('POST /query without query field returns 400', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'cat' }] });
  try {
    const r = await makeRequest(port, 'POST', '/query', 'tok', { squad: 'cat' });
    assert.equal(r.status, 400);
    assert.ok(r.body.error.includes('query'));
  } finally {
    await server.stop();
  }
});

test('POST /query without squad returns 400', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'cat' }] });
  try {
    const r = await makeRequest(port, 'POST', '/query', 'tok', { query: 'x' });
    assert.equal(r.status, 400);
  } finally {
    await server.stop();
  }
});

test('POST /query with unknown squad returns 404', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'cat' }] });
  try {
    const r = await makeRequest(port, 'POST', '/query', 'tok', { squad: 'ghost', query: 'x' });
    assert.equal(r.status, 404);
  } finally {
    await server.stop();
  }
});

test('POST /query without auth returns 401', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'cat' }] });
  try {
    const r = await makeRequest(port, 'POST', '/query', null, { squad: 'cat', query: 'x' });
    assert.equal(r.status, 401);
  } finally {
    await server.stop();
  }
});

test('POST /query with no onQuery returns empty results', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 'cat' }] });
  try {
    const r = await makeRequest(port, 'POST', '/query', 'tok', { squad: 'cat', query: 'x' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.results, []);
  } finally {
    await server.stop();
  }
});

// --- Rate limiting ---

test('rate limit returns 429 after exceeding limit', async () => {
  const { server, port } = await startServer({ token: '', rateLimit: 3, squads: [] });
  try {
    for (let i = 0; i < 3; i++) {
      await makeRequest(port, 'GET', '/health', null);
    }
    const r = await makeRequest(port, 'GET', '/health', null);
    assert.equal(r.status, 429);
    assert.ok(r.body.error.includes('Too many requests'));
  } finally {
    await server.stop();
  }
});

// --- Unknown routes ---

test('unknown route returns 404', async () => {
  const { server, port } = await startServer({ token: 'tok' });
  try {
    const r = await makeRequest(port, 'GET', '/does-not-exist', 'tok');
    assert.equal(r.status, 404);
  } finally {
    await server.stop();
  }
});

// --- Invalid JSON body ---

test('POST /trigger with non-JSON body returns 400', async () => {
  const { server, port } = await startServer({ token: '' });
  try {
    await new Promise((resolve, reject) => {
      const data = 'not json';
      const req = http.request({
        hostname: '127.0.0.1', port, path: '/trigger', method: 'POST',
        agent: false,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Connection': 'close'
        }
      }, res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          const body = JSON.parse(raw);
          assert.equal(res.statusCode, 400);
          assert.ok(body.error.toLowerCase().includes('json'));
          resolve();
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  } finally {
    await server.stop();
  }
});

// --- run_id uniqueness ---

test('each POST /trigger generates a unique run_id', async () => {
  const { server, port } = await startServer({ token: 'tok', squads: [{ name: 's' }] });
  try {
    const r1 = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's', input: 'a' });
    const r2 = await makeRequest(port, 'POST', '/trigger', 'tok', { squad: 's', input: 'b' });
    assert.notEqual(r1.body.run_id, r2.body.run_id);
  } finally {
    await server.stop();
  }
});
