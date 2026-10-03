import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengedit member.' }, { status: 403 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ success: false, message: 'ID member tidak valid' }, { status: 400 });
    }

    const { nama_member, nomor_telepon, email, alamat } = await request.json();
    const nama = typeof nama_member === 'string' ? nama_member.trim() : '';
    const telepon = typeof nomor_telepon === 'string' ? nomor_telepon.trim() : '';

    if (!nama || !telepon) {
      return Response.json({ success: false, message: 'Nama dan nomor telepon wajib diisi' }, { status: 400 });
    }

    const member = await query('SELECT id_member FROM members WHERE id_member = ?', [id]);
    if (member.length === 0) {
      return Response.json({ success: false, message: 'Member tidak ditemukan' }, { status: 404 });
    }

    const existing = await query(
      'SELECT id_member FROM members WHERE nomor_telepon = ? AND id_member != ?',
      [telepon, id]
    );
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Nomor telepon member sudah terdaftar' }, { status: 400 });
    }

    await query(
      'UPDATE members SET nama_member = ?, nomor_telepon = ?, email = ?, alamat = ? WHERE id_member = ?',
      [nama, telepon, typeof email === 'string' && email.trim() ? email.trim() : null, typeof alamat === 'string' && alamat.trim() ? alamat.trim() : null, id]
    );

    return Response.json({ success: true, message: 'Data member berhasil diperbarui' });
  } catch (error) {
    console.error('Update member error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus member.' }, { status: 403 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ success: false, message: 'ID member tidak valid' }, { status: 400 });
    }

    const member = await query('SELECT id_member FROM members WHERE id_member = ?', [id]);
    if (member.length === 0) {
      return Response.json({ success: false, message: 'Member tidak ditemukan' }, { status: 404 });
    }

    await query('DELETE FROM members WHERE id_member = ?', [id]);
    return Response.json({ success: true, message: 'Member berhasil dihapus' });
  } catch (error) {
    console.error('Delete member error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}