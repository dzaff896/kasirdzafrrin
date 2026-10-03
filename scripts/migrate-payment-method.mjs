import { getDbPool } from '../lib/db.js';
import 'dotenv/config';

const pool = getDbPool();

try {
  const [columns] = await pool.query(
    `SELECT COUNT(*) AS column_exists
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'transactions'
       AND column_name = 'metode_pembayaran'`
  );

  if (columns[0].column_exists === 0) {
    await pool.query(
      "ALTER TABLE transactions ADD COLUMN metode_pembayaran ENUM('cash', 'qris', 'debit') NOT NULL DEFAULT 'cash' AFTER pembayaran"
    );
    console.log('Kolom metode_pembayaran berhasil ditambahkan.');
  } else {
    console.log('Kolom metode_pembayaran sudah tersedia.');
  }
} catch (error) {
  console.error('Gagal menambahkan kolom metode_pembayaran:', error);
  throw error;
} finally {
  await pool.end();
}
