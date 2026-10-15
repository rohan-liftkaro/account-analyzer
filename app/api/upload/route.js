import { NextResponse } from 'next/server';
import path from 'path';
import { ALLOWED_EXTENSIONS } from '@/lib/paths';
import { saveUpload } from '@/lib/storage';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('statements');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      // Duck-type check — `instanceof File` is unreliable in Node.js 18 runtime
      if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') continue;

      const ext = path.extname(file.name || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: 'Only CSV, Excel, and PDF files (.csv, .xlsx, .xls, .pdf) are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 50MB limit` }, { status: 400 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._\-()[\] ]/g, '_');
      const bytes = await file.arrayBuffer();
      const saved = await saveUpload(safeName, bytes);

      uploaded.push({ name: file.name, savedAs: safeName, size: file.size, ...saved });
    }

    if (uploaded.length === 0) {
      return NextResponse.json({ error: 'No valid files received. Check file type.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, files: uploaded });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
