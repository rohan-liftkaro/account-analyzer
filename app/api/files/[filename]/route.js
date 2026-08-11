import { NextResponse } from 'next/server';
import path from 'path';
import { deleteUpload } from '@/lib/storage';

export async function DELETE(request, { params }) {
  const filename = path.basename(params.filename); // prevent path traversal
  const deleted = await deleteUpload(filename);

  if (!deleted) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
