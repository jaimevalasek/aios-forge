'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  loadSession,
  saveSession,
  appendTurn,
  buildContextualInput,
  cleanExpiredSessions,
  sanitizeSessionId
} = require('../src/squad/external-session');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aioson-ext-session-'));
}

// --- sanitizeSessionId ---

test('sanitizeSessionId replaces colons with dashes', () => {
  assert.equal(sanitizeSessionId('wa:5511999'), 'wa-5511999');
});

test('sanitizeSessionId collapses consecutive special chars into single dash', () => {
  assert.equal(sanitizeSessionId('wa:+5511999'), 'wa-5511999');
});

test('sanitizeSessionId preserves hyphens and underscores', () => {
  assert.equal(sanitizeSessionId('slack_C01-234'), 'slack_C01-234');
});

test('sanitizeSessionId strips leading and trailing dashes', () => {
  assert.equal(sanitizeSessionId(':id:'), 'id');
});

test('sanitizeSessionId truncates to 128 characters', () => {
  const long = 'a'.repeat(200);
  assert.equal(sanitizeSessionId(long).length, 128);
});

// --- loadSession ---

test('loadSession returns null for nonexistent session', async () => {
  const tmp = await makeTempDir();
  try {
    const result = await loadSession(tmp, 'ghost');
    assert.equal(result, null);
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('loadSession returns null and deletes file for expired session', async () => {
  const tmp = await makeTempDir();
  try {
    const pastTime = new Date(Date.now() - 25 * 3_600_000).toISOString();
    await saveSession(tmp, {
      session_id: 'old-sess',
      channel: 'webhook',
      created_at: pastTime,
      last_active: pastTime,
      turns: [],
      metadata: {}
    });

    const result = await loadSession(tmp, 'old-sess', 24);
    assert.equal(result, null);

    // File should be deleted
    const dir = path.join(tmp, '.aioson', 'sessions');
    const files = await fs.readdir(dir).catch(() => []);
    assert.ok(!files.some(f => f.includes('old-sess')));
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('loadSession returns session that is within TTL', async () => {
  const tmp = await makeTempDir();
  try {
    const now = new Date().toISOString();
    await saveSession(tmp, {
      session_id: 'fresh',
      channel: 'webhook',
      created_at: now,
      last_active: now,
      turns: [{ role: 'user', content: 'hello', ts: now }],
      metadata: {}
    });

    const result = await loadSession(tmp, 'fresh', 24);
    assert.ok(result !== null);
    assert.equal(result.session_id, 'fresh');
    assert.equal(result.turns.length, 1);
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

// --- saveSession ---

test('saveSession creates .aioson/sessions directory if missing', async () => {
  const tmp = await makeTempDir();
  try {
    const now = new Date().toISOString();
    await saveSession(tmp, {
      session_id: 'new-sess',
      channel: 'telegram',
      created_at: now,
      last_active: now,
      turns: [],
      metadata: {}
    });

    const dir = path.join(tmp, '.aioson', 'sessions');
    const stat = await fs.stat(dir);
    assert.ok(stat.isDirectory());
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

// --- appendTurn ---

test('appendTurn creates new session on first call', async () => {
  const tmp = await makeTempDir();
  try {
    const session = await appendTurn(tmp, 'wa:111', 'user', 'oi', { channel: 'whatsapp', phone: '+111' });
    assert.equal(session.session_id, 'wa:111');
    assert.equal(session.channel, 'whatsapp');
    assert.equal(session.turns.length, 1);
    assert.equal(session.turns[0].role, 'user');
    assert.equal(session.turns[0].content, 'oi');
    assert.ok(session.turns[0].ts);
    assert.equal(session.metadata.phone, '+111');
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('appendTurn accumulates turns across calls', async () => {
  const tmp = await makeTempDir();
  try {
    await appendTurn(tmp, 'wa:222', 'user', 'quero dipirona');
    await appendTurn(tmp, 'wa:222', 'assistant', 'Temos dipirona 500mg');
    const session = await appendTurn(tmp, 'wa:222', 'user', 'qual o preco?');

    assert.equal(session.turns.length, 3);
    assert.equal(session.turns[0].role, 'user');
    assert.equal(session.turns[1].role, 'assistant');
    assert.equal(session.turns[2].content, 'qual o preco?');
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('appendTurn updates last_active on each call', async () => {
  const tmp = await makeTempDir();
  try {
    const s1 = await appendTurn(tmp, 'wa:333', 'user', 'first');
    await new Promise(r => setTimeout(r, 10));
    const s2 = await appendTurn(tmp, 'wa:333', 'assistant', 'reply');

    assert.ok(new Date(s2.last_active) >= new Date(s1.last_active));
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('appendTurn does not overwrite existing metadata fields', async () => {
  const tmp = await makeTempDir();
  try {
    await appendTurn(tmp, 'wa:444', 'user', 'hi', { channel: 'whatsapp', phone: '+444' });
    const s = await appendTurn(tmp, 'wa:444', 'user', 'again', { channel: 'slack', phone: '+999' });

    // channel and phone set on first call must not be overwritten
    assert.equal(s.metadata.channel, 'whatsapp');
    assert.equal(s.metadata.phone, '+444');
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('appendTurn persists to disk (loadSession returns same data)', async () => {
  const tmp = await makeTempDir();
  try {
    await appendTurn(tmp, 'wa:555', 'user', 'hello');
    await appendTurn(tmp, 'wa:555', 'assistant', 'world');

    const loaded = await loadSession(tmp, 'wa:555', 24);
    assert.ok(loaded !== null);
    assert.equal(loaded.turns.length, 2);
    assert.equal(loaded.turns[1].content, 'world');
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

// --- buildContextualInput ---

test('buildContextualInput returns plain input when session is null', () => {
  const result = buildContextualInput(null, 'hello');
  assert.equal(result, 'hello');
});

test('buildContextualInput returns plain input when session has no turns', () => {
  const result = buildContextualInput({ turns: [] }, 'hello');
  assert.equal(result, 'hello');
});

test('buildContextualInput injects conversation history before current message', () => {
  const session = {
    turns: [
      { role: 'user', content: 'quero dipirona' },
      { role: 'assistant', content: 'Temos dipirona 500mg' }
    ]
  };
  const result = buildContextualInput(session, 'qual o preco?');
  assert.ok(result.includes('[Conversation history]'));
  assert.ok(result.includes('user: quero dipirona'));
  assert.ok(result.includes('assistant: Temos dipirona 500mg'));
  assert.ok(result.includes('[Current message]'));
  assert.ok(result.includes('qual o preco?'));
  // History must appear before current message
  assert.ok(result.indexOf('[Conversation history]') < result.indexOf('[Current message]'));
});

// --- cleanExpiredSessions ---

test('cleanExpiredSessions removes sessions inactive beyond TTL', async () => {
  const tmp = await makeTempDir();
  try {
    const past = new Date(Date.now() - 25 * 3_600_000).toISOString();
    await saveSession(tmp, { session_id: 'expired', channel: 'test', created_at: past, last_active: past, turns: [], metadata: {} });
    await saveSession(tmp, { session_id: 'fresh', channel: 'test', created_at: new Date().toISOString(), last_active: new Date().toISOString(), turns: [], metadata: {} });

    const deleted = await cleanExpiredSessions(tmp, 24);
    assert.equal(deleted, 1);

    const still = await loadSession(tmp, 'fresh', 24);
    assert.ok(still !== null, 'fresh session should survive cleanup');
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('cleanExpiredSessions returns 0 when no sessions directory exists', async () => {
  const tmp = await makeTempDir();
  try {
    const deleted = await cleanExpiredSessions(tmp, 24);
    assert.equal(deleted, 0);
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('cleanExpiredSessions with ttl=0 removes all sessions', async () => {
  const tmp = await makeTempDir();
  try {
    const now = new Date().toISOString();
    await saveSession(tmp, { session_id: 'a', channel: 'x', created_at: now, last_active: now, turns: [], metadata: {} });
    await saveSession(tmp, { session_id: 'b', channel: 'x', created_at: now, last_active: now, turns: [], metadata: {} });

    const deleted = await cleanExpiredSessions(tmp, 0);
    assert.equal(deleted, 2);
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});

test('cleanExpiredSessions removes corrupt JSON files', async () => {
  const tmp = await makeTempDir();
  try {
    const sessDir = path.join(tmp, '.aioson', 'sessions');
    await fs.mkdir(sessDir, { recursive: true });
    await fs.writeFile(path.join(sessDir, 'corrupt.json'), 'not valid json');

    const deleted = await cleanExpiredSessions(tmp, 24);
    assert.equal(deleted, 1);
  } finally {
    await fs.rm(tmp, { recursive: true });
  }
});
