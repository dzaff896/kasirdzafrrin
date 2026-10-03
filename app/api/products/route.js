import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (nama_barang LIKE ? OR kode_barang LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'Semua') {
      sql += ' AND type = ?';
      params.push(category);
    }

    sql += ' ORDER BY nama_barang ASC';

    const products = await query(sql, params);
    return Response.json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat menambah produk.' }, { status: 403 });
    }

    const { kode_barang, nama_barang, harga, stok, type } = await request.json();

    if (!kode_barang || !nama_barang || harga === undefined || stok === undefined || !type) {
      return Response.json({ success: false, message: 'Semua field wajib diisi' }, { status: 400 });
    }

    // Check if barcode already exists
    const existing = await query('SELECT id_barang FROM products WHERE kode_barang = ?', [kode_barang.trim()]);
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Kode barcode sudah digunakan produk lain' }, { status: 400 });
    }

    const res = await query(
      'INSERT INTO products (kode_barang, nama_barang, harga, stok, type) VALUES (?, ?, ?, ?, ?)',
      [kode_barang.trim(), nama_barang.trim(), parseFloat(harga), parseInt(stok), type.trim()]
    );

    return Response.json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      id_barang: res.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
