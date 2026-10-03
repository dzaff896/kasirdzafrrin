import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengubah akun petugas.' }, { status: 403 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ success: false, message: 'ID akun tidak valid' }, { status: 400 });
    }

    const { username, password } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(normalizedUsername)) {
      return Response.json({ success: false, message: 'Username harus 3-50 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.' }, { status: 400 });
    }
    if (password !== undefined && typeof password !== 'string') {
      return Response.json({ success: false, message: 'Password tidak valid' }, { status: 400 });
    }
    if (password && password.length < 8) {
      return Response.json({ success: false, message: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const staff = await query('SELECT id_user FROM users WHERE id_user = ? AND role = ?', [id, 'Petugas']);
    if (staff.length === 0) {
      return Response.json({ success: false, message: 'Akun petugas tidak ditemukan' }, { status: 404 });
    }

    const duplicate = await query(
      'SELECT id_user FROM users WHERE username = ? AND id_user <> ?',
      [normalizedUsername, id]
    );
    if (duplicate.length > 0) {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 409 });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        'UPDATE users SET username = ?, password = ? WHERE id_user = ? AND role = ?',
        [normalizedUsername, passwordHash, id, 'Petugas']
      );
    } else {
      await query(
        'UPDATE users SET username = ? WHERE id_user = ? AND role = ?',
        [normalizedUsername, id, 'Petugas']
      );
    }

    return Response.json({
      success: true,
      message: 'Akun petugas berhasil diperbarui',
      user: { id_user: id, username: normalizedUsername, role: 'Petugas' }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json({ success: false, message: 'Username sudah digunakan' }, { status: 409 });
    }
    console.error('Update staff account error:', error);
    return Response.json({ success: false, message: 'Terjadi kesalahan saat memperbarui akun petugas' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus akun petugas.' }, { status: 403 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ success: false, message: 'ID akun tidak valid' }, { status: 400 });
    }

    const users = await query('SELECT id_user FROM users WHERE id_user = ? AND role = ?', [id, 'Petugas']);
    if (users.length === 0) {
      return Response.json({ success: false, message: 'Akun petugas tidak ditemukan' }, { status: 404 });
    }

    const transactions = await query('SELECT id_transaksi FROM transactions WHERE id_user = ? LIMIT 1', [id]);
    if (transactions.length > 0) {
      return Response.json({
        success: false,
        message: 'Akun tidak dapat dihapus karena sudah memiliki riwayat transaksi.'
      }, { status: 409 });
    }

    await query('DELETE FROM users WHERE id_user = ? AND role = ?', [id, 'Petugas']);
    return Response.json({ success: true, message: 'Akun petugas berhasil dihapus' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return Response.json({
        success: false,
        message: 'Akun tidak dapat dihapus karena sudah memiliki riwayat transaksi.'
      }, { status: 409 });
    }
    console.error('Delete staff account error:', error);
    return Response.json({ success: false, message: 'Terjadi kesalahan saat menghapus akun petugas' }, { status: 500 });
  }
}