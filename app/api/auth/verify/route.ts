import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const { passcode } = await request.json();

  if (passcode === process.env.APP_PASSCODE) {
    setAuthCookie();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: 'Invalid passcode' },
    { status: 401 }
  );
}
