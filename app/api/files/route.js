import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'input');
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

export async function GET() {
  if (!existsSync(UPLOAD_DIR)) {
    return NextResponse.json({ files: [] });
  }

  const files = readdirSync(UPLOAD_DIR)
    .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => {
      const stats = statSync(path.join(UPLOAD_DIR, f));
      return { name: f, size: stats.size, modified: stats.mtime };
    });

  return NextResponse.json({ files });
}
