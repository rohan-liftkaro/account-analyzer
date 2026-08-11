import { NextResponse } from 'next/server';
import { listReports } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const files = await listReports();
  return NextResponse.json({ files });
}
