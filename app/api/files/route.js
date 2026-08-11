import { NextResponse } from 'next/server';
import { listUploads } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const files = await listUploads();
  return NextResponse.json({ files });
}
