'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const SQUADS_DIR = path.join('.aioson', 'squads');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const MIME_MAP = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain',
  '.md':   'text/markdown',
  '.json': 'application/json'
};

function attachmentsDir(projectDir, squadSlug) {
  return path.join(projectDir, SQUADS_DIR, squadSlug, 'attachments');
}

function safeName(filename) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Save a Buffer or string as an attachment.
 * Returns { ok, filename, filePath, isImage }.
 */
async function saveAttachment(projectDir, squadSlug, filename, buffer) {
  const dir = attachmentsDir(projectDir, squadSlug);
  await fs.mkdir(dir, { recursive: true });
  const safe = safeName(filename);
  const dest = path.join(dir, safe);
  await fs.writeFile(dest, buffer);
  const ext = path.extname(safe).toLowerCase();
  return { ok: true, filePath: dest, filename: safe, isImage: IMAGE_EXTS.has(ext) };
}

/**
 * List all attachments for a squad.
 * Returns array of { filename, filePath, isImage, mime, size }.
 */
async function listAttachments(projectDir, squadSlug) {
  const dir = attachmentsDir(projectDir, squadSlug);
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const result = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    let size = 0;
    try {
      const stat = await fs.stat(path.join(dir, entry.name));
      size = stat.size;
    } catch { /* ignore */ }
    result.push({
      filename: entry.name,
      filePath: path.join(dir, entry.name),
      isImage: IMAGE_EXTS.has(ext),
      mime: MIME_MAP[ext] || 'application/octet-stream',
      size
    });
  }
  return result;
}

/**
 * Read an attachment file for serving (e.g. inline image preview).
 * Returns { ok, buffer, mime, filename } or { ok: false }.
 */
async function readAttachment(projectDir, squadSlug, filename) {
  const safe = safeName(filename);
  const filePath = path.join(attachmentsDir(projectDir, squadSlug), safe);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(safe).toLowerCase();
    return { ok: true, buffer, mime: MIME_MAP[ext] || 'application/octet-stream', filename: safe };
  } catch {
    return { ok: false };
  }
}

module.exports = { saveAttachment, listAttachments, readAttachment, IMAGE_EXTS, MIME_MAP };
