/**
 * Storage abstraction: Vercel Blob on Vercel, local filesystem elsewhere.
 * All routes import from here instead of using fs/blob directly.
 */

import path from 'path';
import {
  existsSync, mkdirSync, readdirSync, statSync,
  unlinkSync, writeFileSync, readFileSync,
} from 'fs';
import { UPLOAD_DIR, OUTPUT_DIR, ALLOWED_EXTENSIONS } from './paths.js';

export const USE_BLOB = !!process.env.VERCEL;

// ─── Upload storage ───────────────────────────────────────────

export async function saveUpload(filename, buffer) {
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${filename}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { name: filename, url: blob.url, size: buffer.byteLength };
  }

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(buffer));
  return { name: filename, size: buffer.byteLength };
}

export async function listUploads() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'uploads/' });
    return blobs
      .filter(b => ALLOWED_EXTENSIONS.includes(path.extname(b.pathname).toLowerCase()))
      .map(b => ({ name: path.basename(b.pathname), size: b.size, url: b.url, modified: b.uploadedAt }));
  }

  if (!existsSync(UPLOAD_DIR)) return [];
  return readdirSync(UPLOAD_DIR)
    .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => {
      const stats = statSync(path.join(UPLOAD_DIR, f));
      return { name: f, size: stats.size, modified: stats.mtime };
    });
}

export async function deleteUpload(filename) {
  if (USE_BLOB) {
    const { list, del } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: `uploads/${filename}` });
    const match = blobs.find(b => path.basename(b.pathname) === filename);
    if (!match) return false;
    await del(match.url);
    return true;
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!existsSync(filePath)) return false;
  unlinkSync(filePath);
  return true;
}

// Download all uploaded blobs to /tmp so the parsers can read them as local files
export async function getUploadPaths() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'uploads/' });
    const filtered = blobs.filter(b =>
      ALLOWED_EXTENSIONS.includes(path.extname(b.pathname).toLowerCase())
    );

    const tmpDir = '/tmp/uploads';
    mkdirSync(tmpDir, { recursive: true });

    const paths = [];
    for (const blob of filtered) {
      const localPath = path.join(tmpDir, path.basename(blob.pathname));
      const res = await fetch(blob.url);
      writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
      paths.push(localPath);
    }
    return paths;
  }

  if (!existsSync(UPLOAD_DIR)) return [];
  return readdirSync(UPLOAD_DIR)
    .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(UPLOAD_DIR, f));
}

// ─── Report storage ───────────────────────────────────────────

export async function saveReport(localFilePath) {
  const filename = path.basename(localFilePath);
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    const buffer = readFileSync(localFilePath);
    const blob = await put(`reports/${filename}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return { name: filename, url: blob.url };
  }
  return { name: filename, url: `/downloads/${encodeURIComponent(filename)}` };
}

export async function listReports() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'reports/' });
    return blobs.map(b => ({ name: path.basename(b.pathname), size: b.size, url: b.url }));
  }

  if (!existsSync(OUTPUT_DIR)) return [];
  return readdirSync(OUTPUT_DIR)
    .filter(f => /\.(xlsx|csv)$/i.test(f))
    .map(f => {
      const stats = statSync(path.join(OUTPUT_DIR, f));
      return { name: f, size: stats.size, url: `/downloads/${encodeURIComponent(f)}` };
    });
}

// ─── Download (local only — on Vercel the URL is a direct blob link) ─────────

export function getReportBuffer(filename) {
  const filePath = path.join(OUTPUT_DIR, path.basename(filename));
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath);
}
