import { NextResponse } from 'next/server';
import { getScanState } from '@/lib/services/scan-state';

// Reflects the in-memory scan status so the UI can show progress across
// navigation and reloads. Always per-request.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getScanState());
}
