import path from 'path';

// Vercel serverless functions only have write access to /tmp
export const USE_BLOB = !!process.env.VERCEL;
const WRITABLE_ROOT = USE_BLOB ? '/tmp' : process.cwd();

export const UPLOAD_DIR = path.join(WRITABLE_ROOT, 'data', 'input');
export const OUTPUT_DIR = path.join(WRITABLE_ROOT, 'output');
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
