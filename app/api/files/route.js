import { NextResponse } from 'next/server';
import { listUploads } from '@/lib/storage';

export async function GET() {
  const files = await listUploads();
  return NextResponse.json({ files });
}
