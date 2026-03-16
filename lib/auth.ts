import { cookies } from 'next/headers';

const COOKIE_NAME = 'ct-session';
const SESSION_VALUE = 'authenticated';

export function setAuthCookie() {
  cookies().set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export function checkAuthCookie(): boolean {
  const cookie = cookies().get(COOKIE_NAME);
  return cookie?.value === SESSION_VALUE;
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}
