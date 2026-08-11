import { NextResponse } from 'next/server';
import { listReports } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const files = await listReports();
    return NextResponse.json({ files });
  } catch (err) {
    console.error('listReports error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
