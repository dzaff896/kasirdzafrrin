import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }
    if (!['Admin', 'Petugas'].includes(user.role)) {
      return Response.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const params = await context.params;
    const id = params.id;
    const ownershipFilter = user.role === 'Admin' ? '' : ' AND t.id_user = ?';
    const transactionParams = user.role === 'Admin' ? [id] : [id, user.id_user];

    const trxRows = await query(
      `SELECT 
        t.id_transaksi,
        t.no_transaksi,
        t.total,
        t.pembayaran,
        t.metode_pembayaran,
        t.kembalian,
        t.tanggal_transaksi,
        u.username AS nama_petugas,
        m.id_member,
        m.nama_member,
        m.nomor_telepon AS no_telp_member
      FROM transactions t
      JOIN users u ON t.id_user = u.id_user
      LEFT JOIN members m ON t.id_member = m.id_member
      WHERE t.id_transaksi = ?${ownershipFilter}`,
      transactionParams
    );

    if (!trxRows || trxRows.length === 0) {
      return Response.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const items = await query(
      `SELECT 
        td.id_detail,
        td.id_barang,
        td.jumlah,
        td.harga,
        td.subtotal,
        p.nama_barang,
        p.kode_barang,
        p.type
      FROM transaction_details td
      JOIN products p ON td.id_barang = p.id_barang
      WHERE td.id_transaksi = ?`,
      [id]
    );

    return Response.json({
      success: true,
      transaction: {
        ...trxRows[0],
        items
      }
    });
  } catch (error) {
    console.error('Fetch transaction detail error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
