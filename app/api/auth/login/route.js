import { NextResponse } from 'next/navigation';
import { query } from '@/lib/db';
import { signToken, createSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const rows = await query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!rows || rows.length === 0) {
      return Response.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const user = rows[0];
    let isMatch = false;

    // Check bcrypt hash
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Fallback if plain text was entered in phpMyAdmin, and update to hash
      isMatch = (password === user.password);
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await query('UPDATE users SET password = ? WHERE id_user = ?', [newHash, user.id_user]);
      }
    }

    if (!isMatch) {
      return Response.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const token = signToken({
      id_user: user.id_user,
      username: user.username,
      role: user.role
    });

    const cookieHeader = createSessionCookie(token);

    const redirectUrl = user.role === 'Admin' ? '/admin' : '/kasir';

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login berhasil',
        user: {
          id_user: user.id_user,
          username: user.username,
          role: user.role
        },
        redirect: redirectUrl
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server saat login. Periksa konfigurasi database.' },
      { status: 500 }
    );
  }
}
