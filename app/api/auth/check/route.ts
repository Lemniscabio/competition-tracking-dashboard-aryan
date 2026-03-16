import { NextResponse } from 'next/server';
import { checkAuthCookie } from '@/lib/auth';

export async function GET() {
  const isAuthed = checkAuthCookie();
  return NextResponse.json({ authenticated: isAuthed });
}
