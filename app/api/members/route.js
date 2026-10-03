import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (id_member = ? OR nomor_telepon LIKE ? OR nama_member LIKE ?)';
      params.push(isNaN(search) ? -1 : parseInt(search), `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id_member DESC';

    const members = await query(sql, params);
    return Response.json({ success: true, members });
  } catch (error) {
    console.error('Fetch members error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    const { nama_member, nomor_telepon, email, alamat } = await request.json();

    if (!nama_member || !nomor_telepon) {
      return Response.json({ success: false, message: 'Nama dan nomor telepon wajib diisi' }, { status: 400 });
    }

    const existing = await query('SELECT id_member FROM members WHERE nomor_telepon = ?', [nomor_telepon.trim()]);
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Nomor telepon member sudah terdaftar' }, { status: 400 });
    }

    const res = await query(
      'INSERT INTO members (nama_member, nomor_telepon, email, alamat) VALUES (?, ?, ?, ?)',
      [nama_member.trim(), nomor_telepon.trim(), email ? email.trim() : null, alamat ? alamat.trim() : null]
    );

    return Response.json({
      success: true,
      message: 'Member berhasil ditambahkan',
      id_member: res.insertId,
      member: {
        id_member: res.insertId,
        nama_member: nama_member.trim(),
        nomor_telepon: nomor_telepon.trim(),
        email: email ? email.trim() : null,
        alamat: alamat ? alamat.trim() : null
      }
    });
  } catch (error) {
    console.error('Create member error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
