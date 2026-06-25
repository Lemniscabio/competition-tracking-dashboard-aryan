import { NextResponse } from 'next/server';
import { checkAuthCookie } from '@/lib/auth';

// API route backed by Supabase — always evaluate per-request, never prerender at build.
export const dynamic = 'force-dynamic';

export async function GET() {
  const isAuthed = checkAuthCookie();
  return NextResponse.json({ authenticated: isAuthed });
}
