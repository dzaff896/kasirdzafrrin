import { query } from '@/lib/db';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const code = decodeURIComponent(params.code || '').trim();

    if (!code) {
      return Response.json({ success: false, message: 'Kode barcode kosong' }, { status: 400 });
    }

    const rows = await query('SELECT * FROM products WHERE kode_barang = ?', [code]);

    if (!rows || rows.length === 0) {
      return Response.json(
        { success: false, message: `Barang dengan kode barcode "${code}" tidak ditemukan` },
        { status: 404 }
      );
    }

    return Response.json({ success: true, product: rows[0] });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
