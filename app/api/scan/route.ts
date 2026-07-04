import { NextResponse } from 'next/server';
import { runCompetitorScan } from '@/lib/services/scan';
import { getScanState, isScanRunning } from '@/lib/services/scan-state';

// API route backed by Supabase — always evaluate per-request, never prerender at build.
export const dynamic = 'force-dynamic';
// Allow long-running scans (two Gemini calls per competitor). Cloud Run request
// timeout is raised separately; this lifts the framework-level cap.
export const maxDuration = 3600;

export async function POST() {
  // Don't start a second scan on top of a running one — just report status.
  if (isScanRunning()) {
    return NextResponse.json({ alreadyRunning: true, ...getScanState() });
  }

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
