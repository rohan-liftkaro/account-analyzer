import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';
import { UPLOAD_DIR } from '@/lib/paths';

export async function DELETE(request, { params }) {
  const filename = path.basename(params.filename); // prevent path traversal
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  unlinkSync(filePath);
  return NextResponse.json({ success: true });
}
