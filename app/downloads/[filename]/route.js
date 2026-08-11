import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

const MIME_TYPES = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
};

export async function GET(request, { params }) {
  const filename = path.basename(params.filename); // prevent path traversal
  const filePath = path.join(OUTPUT_DIR, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.length),
    },
  });
}
