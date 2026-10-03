import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat melihat akun petugas.' }, { status: 403 });
    }

    const users = await query(
      'SELECT id_user, username, role, created_at FROM users WHERE role = ? ORDER BY id_user DESC',
      ['Petugas']
    );

    return Response.json({ success: true, users });
  } catch (error) {
    console.error('Fetch staff accounts error:', error);
    return Response.json({ success: false, message: 'Gagal memuat akun petugas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat mendaftarkan petugas.' }, { status: 403 });
    }

    const { username, password } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(normalizedUsername)) {
      return Response.json({ success: false, message: 'Username harus 3-50 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return Response.json({ success: false, message: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const existing = await query('SELECT id_user FROM users WHERE username = ?', [normalizedUsername]);
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [normalizedUsername, passwordHash, 'Petugas']
    );

    return Response.json({
      success: true,
      message: 'Akun petugas berhasil didaftarkan',
      user: { id_user: result.insertId, username: normalizedUsername, role: 'Petugas' }
    }, { status: 201 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 409 });
    }
    console.error('Register staff error:', error);
    return Response.json({ success: false, message: 'Terjadi kesalahan saat mendaftarkan akun petugas' }, { status: 500 });
  }
}