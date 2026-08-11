import { NextResponse } from 'next/server';
import { listUploads } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const files = await listUploads();
    return NextResponse.json({ files });
  } catch (err) {
    console.error('listUploads error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
