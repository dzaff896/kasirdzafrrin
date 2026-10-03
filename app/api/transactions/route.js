import { getDbPool, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }
    if (!['Admin', 'Petugas'].includes(user.role)) {
      return Response.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = `
      SELECT 
        t.id_transaksi,
        t.no_transaksi,
        t.total,
        t.pembayaran,
        t.metode_pembayaran,
        t.kembalian,
        t.tanggal_transaksi,
        u.username AS nama_petugas,
        u.role AS user_role,
        m.id_member,
        m.nama_member,
        m.nomor_telepon AS no_telp_member
      FROM transactions t
      JOIN users u ON t.id_user = u.id_user
      LEFT JOIN members m ON t.id_member = m.id_member
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND DATE(t.tanggal_transaksi) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATE(t.tanggal_transaksi) <= ?';
      params.push(endDate);
    }

    if (user.role === 'Petugas') {
      sql += ' AND t.id_user = ?';
      params.push(user.id_user);
    }

    sql += ' ORDER BY t.tanggal_transaksi DESC LIMIT ?';
    params.push(limit);

    const pool = getDbPool();
    const [transactions] = await pool.query(sql, params);

    return Response.json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    const { items, pembayaran, id_member, metode_pembayaran = 'cash' } = await request.json();

    if (!['cash', 'qris', 'debit'].includes(metode_pembayaran)) {
      return Response.json({ success: false, message: 'Metode pembayaran tidak valid' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ success: false, message: 'Keranjang belanja masih kosong' }, { status: 400 });
    }

    const manualPaymentAmount = parseFloat(pembayaran);
    if (isNaN(manualPaymentAmount) || manualPaymentAmount < 0) {
      return Response.json({ success: false, message: 'Nominal pembayaran tidak valid' }, { status: 400 });
    }

    // Start Database Transaction
    await connection.beginTransaction();

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const qty = parseInt(item.jumlah);
      if (isNaN(qty) || qty <= 0) {
        await connection.rollback();
        return Response.json({ success: false, message: `Jumlah barang "${item.nama_barang || ''}" tidak valid` }, { status: 400 });
      }

      // Lock row FOR UPDATE to prevent race conditions in concurrent transactions
      const [rows] = await connection.query(
        'SELECT id_barang, kode_barang, nama_barang, harga, stok, type FROM products WHERE id_barang = ? FOR UPDATE',
        [item.id_barang]
      );

      if (!rows || rows.length === 0) {
        await connection.rollback();
        return Response.json({ success: false, message: `Barang dengan ID ${item.id_barang} tidak ditemukan` }, { status: 404 });
      }

      const product = rows[0];

      if (product.stok < qty) {
        await connection.rollback();
        return Response.json({
          success: false,
          message: `Stok "${product.nama_barang}" tidak mencukupi! Tersedia: ${product.stok}, diminta: ${qty}`
        }, { status: 400 });
      }

      const itemPrice = parseFloat(product.harga);
      const subtotal = itemPrice * qty;
      calculatedTotal += subtotal;

      validatedItems.push({
        id_barang: product.id_barang,
        kode_barang: product.kode_barang,
        nama_barang: product.nama_barang,
        harga: itemPrice,
        jumlah: qty,
        subtotal
      });
    }

    const paymentAmount = manualPaymentAmount;
    if (metode_pembayaran !== 'cash' && Math.abs(paymentAmount - calculatedTotal) >= 0.01) {
      await connection.rollback();
      const methodName = metode_pembayaran === 'qris' ? 'QRIS' : 'kartu debit';
      return Response.json({
        success: false,
        message: `Nominal ${methodName} harus sama dengan total belanja`
      }, { status: 400 });
    }
    if (paymentAmount < calculatedTotal) {
      await connection.rollback();
      return Response.json({
        success: false,
        message: `Uang pembayaran kurang! Total: Rp ${calculatedTotal.toLocaleString('id-ID')}, Dibayar: Rp ${paymentAmount.toLocaleString('id-ID')}`
      }, { status: 400 });
    }

    const kembalian = metode_pembayaran === 'cash' ? paymentAmount - calculatedTotal : 0;

    // Generate Nomor Transaksi (e.g. TRX-20260928-ABC12)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const no_transaksi = `TRX-${dateStr}-${randomSuffix}`;

    // Insert into transactions
    const [trxResult] = await connection.query(
      `INSERT INTO transactions (no_transaksi, id_user, id_member, total, pembayaran, metode_pembayaran, kembalian, tanggal_transaksi)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [no_transaksi, user.id_user, id_member || null, calculatedTotal, paymentAmount, metode_pembayaran, kembalian]
    );

    const transactionId = trxResult.insertId;

    // Insert details and decrement product stock
    for (const item of validatedItems) {
      // Deduct stock
      await connection.query(
        'UPDATE products SET stok = stok - ? WHERE id_barang = ?',
        [item.jumlah, item.id_barang]
      );

      // Insert detail
      await connection.query(
        `INSERT INTO transaction_details (id_transaksi, id_barang, jumlah, harga, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.id_barang, item.jumlah, item.harga, item.subtotal]
      );
    }

    // Commit Transaction
    await connection.commit();

    // Fetch member details if any
    let memberData = null;
    if (id_member) {
      const [mRows] = await connection.query('SELECT * FROM members WHERE id_member = ?', [id_member]);
      if (mRows.length > 0) memberData = mRows[0];
    }

    return Response.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      transaction: {
        id_transaksi: transactionId,
        no_transaksi,
        tanggal_transaksi: now.toISOString(),
        petugas: user.username,
        member: memberData,
        items: validatedItems,
        total: calculatedTotal,
        pembayaran: paymentAmount,
        metode_pembayaran,
        kembalian
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Transaction failed:', error);
    return Response.json(
      { success: false, message: 'Gagal memproses transaksi: ' + error.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
