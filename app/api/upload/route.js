import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'input');
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

export async function POST(request) {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const files = formData.getAll('statements');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: `File ${file.name} exceeds 50MB limit` }, { status: 400 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._\-()[\] ]/g, '_');
      const bytes = await file.arrayBuffer();
      await writeFile(path.join(UPLOAD_DIR, safeName), Buffer.from(bytes));

      uploaded.push({ name: file.name, savedAs: safeName, size: file.size });
    }

    return NextResponse.json({ success: true, files: uploaded });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
