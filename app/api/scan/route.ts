import { NextResponse } from 'next/server';
import { runCompetitorScan } from '@/lib/services/scan';

// API route backed by Supabase — always evaluate per-request, never prerender at build.
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await runCompetitorScan();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan failed:', error);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
