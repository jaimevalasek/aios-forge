'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

function startLocalServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => new Promise((done) => server.close(() => done()))
      });
    });
    server.on('error', reject);
  });
}

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aioson-web-'));
}

function runCli(args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(process.cwd(), 'bin/aioson.js'), ...args], {
      cwd,
      env: process.env
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('web:map --json discovers same-origin pages', async () => {
  const dir = await makeTempDir();
  const { port, close } = await startLocalServer((req, res) => {
    const pages = {
      '/': `<!doctype html><html><head><title>Home</title><meta name="description" content="Home page"></head><body><main><h1>Home</h1><a href="/docs">Docs</a><a href="/about">About</a><a href="https://example.com/ext">Ext</a></main></body></html>`,
      '/docs': `<!doctype html><html><head><title>Docs</title></head><body><article><h1>Docs</h1><a href="/docs/api">API</a></article></body></html>`,
      '/about': `<!doctype html><html><head><title>About</title></head><body><main><h1>About</h1></main></body></html>`,
      '/docs/api': `<!doctype html><html><head><title>API</title></head><body><main><h1>API</h1></main></body></html>`
    };
    const body = pages[req.url] || 'not found';
    res.writeHead(pages[req.url] ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(body);
  });

  try {
    const cli = await runCli(['web:map', dir, `--url=http://127.0.0.1:${port}`, '--depth=1', '--json']);
    assert.equal(cli.code, 0);
    assert.equal(cli.stderr.trim(), '');
    const parsed = JSON.parse(cli.stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.pageCount, 3);
    assert.deepEqual(parsed.urls.sort(), [
      `http://127.0.0.1:${port}`,
      `http://127.0.0.1:${port}/about`,
      `http://127.0.0.1:${port}/docs`
    ].sort());
  } finally {
    await close();
  }
});

test('web:scrape --json extracts title, content and links', async () => {
  const dir = await makeTempDir();
  const { port, close } = await startLocalServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><head><title>Docs</title><meta name="description" content="Reference page"></head><body><main><h1>Docs</h1><p>Hello <strong>world</strong>.</p><a href="/docs/api">API</a></main></body></html>`);
  });

  try {
    const cli = await runCli(['web:scrape', dir, `--url=http://127.0.0.1:${port}/docs`, '--format=markdown', '--json']);
    assert.equal(cli.code, 0);
    assert.equal(cli.stderr.trim(), '');
    const parsed = JSON.parse(cli.stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.title, 'Docs');
    assert.equal(parsed.description, 'Reference page');
    assert.equal(parsed.format, 'markdown');
    assert.equal(parsed.content.includes('Docs'), true);
    const normalizedContent = parsed.content.replace(/\s+/g, ' ').trim();
    assert.equal(/Hello\s+world/.test(normalizedContent), true);
    assert.deepEqual(parsed.links, [`http://127.0.0.1:${port}/docs/api`]);
  } finally {
    await close();
  }
});
