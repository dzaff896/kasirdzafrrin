import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    const rows = await query('SELECT * FROM products WHERE id_barang = ?', [id]);

    if (!rows || rows.length === 0) {
      return Response.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return Response.json({ success: true, product: rows[0] });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengedit produk.' }, { status: 403 });
    }

    const params = await context.params;
    const id = params.id;
    const { kode_barang, nama_barang, harga, stok, type } = await request.json();

    if (!kode_barang || !nama_barang || harga === undefined || stok === undefined || !type) {
      return Response.json({ success: false, message: 'Semua field wajib diisi' }, { status: 400 });
    }

    // Check barcode uniqueness excluding current product
    const existing = await query('SELECT id_barang FROM products WHERE kode_barang = ? AND id_barang != ?', [kode_barang.trim(), id]);
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Kode barcode sudah digunakan produk lain' }, { status: 400 });
    }

    await query(
      'UPDATE products SET kode_barang = ?, nama_barang = ?, harga = ?, stok = ?, type = ? WHERE id_barang = ?',
      [kode_barang.trim(), nama_barang.trim(), parseFloat(harga), parseInt(stok), type.trim(), id]
    );

    return Response.json({ success: true, message: 'Produk berhasil diperbarui' });
  } catch (error) {
    console.error('Update product error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus produk.' }, { status: 403 });
    }

    const params = await context.params;
    const id = params.id;

    // Check if product is in transaction details
    const inUse = await query('SELECT id_detail FROM transaction_details WHERE id_barang = ? LIMIT 1', [id]);
    if (inUse.length > 0) {
      return Response.json({
        success: false,
        message: 'Produk ini sudah ada dalam riwayat transaksi dan tidak bisa dihapus langsung demi menjaga integritas data laporan.'
      }, { status: 400 });
    }

    await query('DELETE FROM products WHERE id_barang = ?', [id]);
    return Response.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Delete product error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
