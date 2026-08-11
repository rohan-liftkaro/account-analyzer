import { NextResponse } from 'next/server';
import path from 'path';
import { USE_BLOB, getReportBuffer, listReports } from '@/lib/storage';

const MIME_TYPES = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
};

export async function GET(request, { params }) {
  const filename = path.basename(params.filename); // prevent path traversal

  // On Vercel, redirect to the public blob URL instead of serving from disk
  if (USE_BLOB) {
    const reports = await listReports();
    const report = reports.find(r => r.name === filename);
    if (!report) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    return NextResponse.redirect(report.url);
  }

  const fileBuffer = getReportBuffer(filename);
  if (!fileBuffer) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.length),
    },
  });
}
