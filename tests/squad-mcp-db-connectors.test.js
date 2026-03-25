'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const {
  BUILT_IN_CONNECTORS,
  getBuiltInConnector,
  listBuiltInConnectors,
  runAction
} = require('../src/mcp-connectors/registry');

// --- BUILT_IN_CONNECTORS presence ---

test('BUILT_IN_CONNECTORS has mysql', () => {
  assert.ok(BUILT_IN_CONNECTORS['mysql']);
});

test('BUILT_IN_CONNECTORS has postgres', () => {
  assert.ok(BUILT_IN_CONNECTORS['postgres']);
});

test('BUILT_IN_CONNECTORS has sqlite-external', () => {
  assert.ok(BUILT_IN_CONNECTORS['sqlite-external']);
});

// --- getBuiltInConnector ---

test('getBuiltInConnector mysql has 4 actions', () => {
  const c = getBuiltInConnector('mysql');
  assert.ok(c);
  assert.ok(c.actions.query);
  assert.ok(c.actions.query_one);
  assert.ok(c.actions.execute);
  assert.ok(c.actions.table_schema);
});

test('getBuiltInConnector postgres has 4 actions', () => {
  const c = getBuiltInConnector('postgres');
  assert.ok(c);
  assert.ok(c.actions.query);
  assert.ok(c.actions.query_one);
  assert.ok(c.actions.execute);
  assert.ok(c.actions.table_schema);
});

test('getBuiltInConnector sqlite-external has 4 actions', () => {
  const c = getBuiltInConnector('sqlite-external');
  assert.ok(c);
  assert.ok(c.actions.query);
  assert.ok(c.actions.query_one);
  assert.ok(c.actions.execute);
  assert.ok(c.actions.table_schema);
});

// --- listBuiltInConnectors includes new connectors ---

test('listBuiltInConnectors includes mysql, postgres, sqlite-external', () => {
  const list = listBuiltInConnectors();
  const ids = list.map(c => c.id);
  assert.ok(ids.includes('mysql'), 'mysql not in list');
  assert.ok(ids.includes('postgres'), 'postgres not in list');
  assert.ok(ids.includes('sqlite-external'), 'sqlite-external not in list');
});

// --- mysql/postgres: error when package absent ---

test('runAction mysql query returns error when mysql2 not installed', async () => {
  const result = await runAction('mysql', 'query', { sql: 'SELECT 1', params: [] }, {
    host: 'localhost', database: 'test', user: 'root', password: 'x'
  });
  // Either mysql2 is not installed (error about npm install) or connection refused
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('runAction postgres query returns error when pg not installed', async () => {
  const result = await runAction('postgres', 'query', { sql: 'SELECT 1', params: [] }, {
    host: 'localhost', database: 'test', user: 'postgres', password: 'x'
  });
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

// --- sqlite-external: real execution ---

function makeTempDb() {
  const tmpFile = path.join(os.tmpdir(), `aioson-sqlite-test-${Date.now()}.db`);
  const db = new Database(tmpFile);
  db.prepare('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL)').run();
  db.prepare('INSERT INTO t (id, name, score) VALUES (1, \'alice\', 9.5)').run();
  db.close();
  return tmpFile;
}

test('runAction sqlite-external query returns rows', async () => {
  const dbPath = makeTempDb();
  try {
    const result = await runAction('sqlite-external', 'query', { sql: 'SELECT * FROM t' }, { path: dbPath });
    assert.equal(result.ok, true);
    assert.equal(result.result.rows.length, 1);
    assert.equal(result.result.rowCount, 1);
    assert.equal(result.result.rows[0].name, 'alice');
  } finally {
    fs.unlinkSync(dbPath);
  }
});

test('runAction sqlite-external query_one returns single row', async () => {
  const dbPath = makeTempDb();
  try {
    const result = await runAction('sqlite-external', 'query_one', { sql: 'SELECT * FROM t WHERE id = ?', params: [1] }, { path: dbPath });
    assert.equal(result.ok, true);
    assert.ok(result.result.row);
    assert.equal(result.result.row.name, 'alice');
  } finally {
    fs.unlinkSync(dbPath);
  }
});

test('runAction sqlite-external execute inserts row', async () => {
  const dbPath = makeTempDb();
  try {
    const result = await runAction('sqlite-external', 'execute', {
      sql: 'INSERT INTO t (id, name, score) VALUES (?, ?, ?)',
      params: [2, 'bob', 7.0]
    }, { path: dbPath });
    assert.equal(result.ok, true);
    assert.equal(result.result.affectedRows, 1);
  } finally {
    fs.unlinkSync(dbPath);
  }
});

test('runAction sqlite-external table_schema returns columns', async () => {
  const dbPath = makeTempDb();
  try {
    const result = await runAction('sqlite-external', 'table_schema', { table: 't' }, { path: dbPath });
    assert.equal(result.ok, true);
    const cols = result.result.columns;
    assert.ok(Array.isArray(cols));
    const id = cols.find(c => c.name === 'id');
    assert.ok(id);
    assert.equal(id.pk, true);
    const name = cols.find(c => c.name === 'name');
    assert.ok(name);
    assert.equal(name.nullable, false);
  } finally {
    fs.unlinkSync(dbPath);
  }
});

test('runAction sqlite-external SELECT 1 as n returns n=1', async () => {
  const tmpFile = path.join(os.tmpdir(), `aioson-sqlite-mem-test-${Date.now()}.db`);
  // better-sqlite3 doesn't support :memory: as a file path via path config reliably,
  // so we use a temp file
  const db = new Database(tmpFile);
  db.close();
  try {
    const result = await runAction('sqlite-external', 'query', { sql: 'SELECT 1 as n' }, { path: tmpFile });
    assert.equal(result.ok, true);
    assert.equal(result.result.rows[0].n, 1);
  } finally {
    fs.unlinkSync(tmpFile);
  }
});
