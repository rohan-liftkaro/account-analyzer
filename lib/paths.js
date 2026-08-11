import path from 'path';

// Vercel serverless functions only have write access to /tmp
const WRITABLE_ROOT = process.env.VERCEL ? '/tmp' : process.cwd();

export const UPLOAD_DIR = path.join(WRITABLE_ROOT, 'data', 'input');
export const OUTPUT_DIR = path.join(WRITABLE_ROOT, 'output');
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
