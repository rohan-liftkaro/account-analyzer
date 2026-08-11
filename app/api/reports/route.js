import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { OUTPUT_DIR } from '@/lib/paths';

export async function GET() {
  if (!existsSync(OUTPUT_DIR)) {
    return NextResponse.json({ files: [] });
  }

  const files = readdirSync(OUTPUT_DIR)
    .filter(f => /\.(xlsx|csv)$/i.test(f))
    .map(f => {
      const stats = statSync(path.join(OUTPUT_DIR, f));
      return { name: f, size: stats.size };
    });

  return NextResponse.json({ files });
}
