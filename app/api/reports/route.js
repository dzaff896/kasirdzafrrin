import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'Admin') {
      return Response.json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat melihat laporan.' }, { status: 403 });
    }

    // 1. Overall stats
    const [salesStats] = await query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_pendapatan,
        COUNT(id_transaksi) AS total_transaksi,
        COALESCE(AVG(total), 0) AS rata_rata_transaksi
      FROM transactions
    `);

    const [itemsStats] = await query(`
      SELECT COALESCE(SUM(jumlah), 0) AS total_item_terjual FROM transaction_details
    `);

    const [productStats] = await query(`
      SELECT 
        COUNT(id_barang) AS total_produk,
        SUM(CASE WHEN stok <= 10 THEN 1 ELSE 0 END) AS produk_stok_kritis
      FROM products
    `);

    const [memberStats] = await query(`
      SELECT COUNT(id_member) AS total_member FROM members
    `);

    const paymentMethodStats = await query(`
      SELECT
        metode_pembayaran,
        COUNT(id_transaksi) AS total_transaksi,
        COALESCE(SUM(total), 0) AS total_omset
      FROM transactions
      GROUP BY metode_pembayaran
      ORDER BY total_omset DESC
    `);

    // 2. Sales by Category
    const categoryStats = await query(`
      SELECT 
        p.type AS kategori,
        COUNT(DISTINCT td.id_transaksi) AS frekuensi,
        COALESCE(SUM(td.jumlah), 0) AS total_terjual,
        COALESCE(SUM(td.subtotal), 0) AS total_omset
      FROM transaction_details td
      JOIN products p ON td.id_barang = p.id_barang
      GROUP BY p.type
      ORDER BY total_omset DESC
    `);

    // 3. Top 5 Best Selling Products
    const topProducts = await query(`
      SELECT 
        p.id_barang,
        p.kode_barang,
        p.nama_barang,
        p.type,
        COALESCE(SUM(td.jumlah), 0) AS terjual,
        COALESCE(SUM(td.subtotal), 0) AS total_rupiah
      FROM transaction_details td
      JOIN products p ON td.id_barang = p.id_barang
      GROUP BY p.id_barang, p.kode_barang, p.nama_barang, p.type
      ORDER BY terjual DESC
      LIMIT 5
    `);

    // 4. Critical Stock Products
    const lowStockProducts = await query(`
      SELECT id_barang, kode_barang, nama_barang, stok, harga, type
      FROM products
      WHERE stok <= 10
      ORDER BY stok ASC
      LIMIT 10
    `);

    // 5. Daily sales for last 7 days
    const dailySales = await query(`
      SELECT 
        DATE(tanggal_transaksi) AS tanggal,
        COUNT(id_transaksi) AS transaksi_count,
        COALESCE(SUM(total), 0) AS total_omset
      FROM transactions
      WHERE tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(tanggal_transaksi)
      ORDER BY tanggal ASC
    `);

    return Response.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        total_pendapatan: parseFloat(salesStats.total_pendapatan || 0),
        total_transaksi: parseInt(salesStats.total_transaksi || 0),
        rata_rata_transaksi: parseFloat(salesStats.rata_rata_transaksi || 0),
        total_item_terjual: parseInt(itemsStats.total_item_terjual || 0),
        total_produk: parseInt(productStats.total_produk || 0),
        produk_stok_kritis: parseInt(productStats.produk_stok_kritis || 0),
        total_member: parseInt(memberStats.total_member || 0)
      },
      paymentMethodStats,
      categoryStats,
      topProducts,
      lowStockProducts,
      dailySales
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
