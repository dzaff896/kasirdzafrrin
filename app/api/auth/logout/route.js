import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const cookieHeader = clearSessionCookie();
  return new Response(
    JSON.stringify({ success: true, message: 'Logout berhasil' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader
      }
    }
  );
}
