import { NextResponse } from 'next/server';
import { runCompetitorScan } from '@/lib/services/scan';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runCompetitorScan();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron scan failed:', error);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
