import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306');
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'kasir_db';

async function initDB() {
  console.log(`Connecting to MySQL on ${host}:${port} as ${user}...`);
  const rootConn = await mysql.createConnection({ host, port, user, password });

  try {
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${database}' ready.`);
    await rootConn.end();

    const conn = await mysql.createConnection({ host, port, user, password, database });

    console.log('Creating tables...');
    await conn.query(`SET FOREIGN_KEY_CHECKS = 0;`);
    await conn.query(`DROP TABLE IF EXISTS transaction_details;`);
    await conn.query(`DROP TABLE IF EXISTS transactions;`);
    await conn.query(`DROP TABLE IF EXISTS products;`);
    await conn.query(`DROP TABLE IF EXISTS members;`);
    await conn.query(`DROP TABLE IF EXISTS users;`);

    // 1. Users
    await conn.query(`
      CREATE TABLE users (
        id_user INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Petugas') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Products
    await conn.query(`
      CREATE TABLE products (
        id_barang INT AUTO_INCREMENT PRIMARY KEY,
        kode_barang VARCHAR(50) NOT NULL UNIQUE,
        nama_barang VARCHAR(150) NOT NULL,
        harga DECIMAL(12,2) NOT NULL,
        stok INT NOT NULL DEFAULT 0,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Members
    await conn.query(`
      CREATE TABLE members (
        id_member INT AUTO_INCREMENT PRIMARY KEY,
        nama_member VARCHAR(100) NOT NULL,
        nomor_telepon VARCHAR(25) NOT NULL UNIQUE,
        email VARCHAR(100) DEFAULT NULL,
        alamat TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Transactions
    await conn.query(`
      CREATE TABLE transactions (
        id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
        no_transaksi VARCHAR(50) NOT NULL UNIQUE,
        id_user INT NOT NULL,
        id_member INT DEFAULT NULL,
        total DECIMAL(12,2) NOT NULL,
        pembayaran DECIMAL(12,2) NOT NULL,
        metode_pembayaran ENUM('cash', 'qris', 'debit') NOT NULL DEFAULT 'cash',
        kembalian DECIMAL(12,2) NOT NULL,
        tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_transaksi_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON UPDATE CASCADE,
        CONSTRAINT fk_transaksi_member FOREIGN KEY (id_member) REFERENCES members (id_member) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Transaction Details
    await conn.query(`
      CREATE TABLE transaction_details (
        id_detail INT AUTO_INCREMENT PRIMARY KEY,
        id_transaksi INT NOT NULL,
        id_barang INT NOT NULL,
        jumlah INT NOT NULL,
        harga DECIMAL(12,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_detail_transaksi FOREIGN KEY (id_transaksi) REFERENCES transactions (id_transaksi) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_detail_barang FOREIGN KEY (id_barang) REFERENCES products (id_barang) ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log('Tables created successfully.');

    // Seed Users
    const adminHash = await bcrypt.hash('admin123', 10);
    const petugasHash = await bcrypt.hash('petugas123', 10);

    await conn.query(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?), (?, ?, ?)`,
      ['admin', adminHash, 'Admin', 'marcha', petugasHash, 'Petugas']
    );
    console.log('Default users created:');
    console.log(' - Admin: admin / admin123');
    console.log(' - Petugas: marcha / petugas123');

    // Seed Products
    const products = [
      ['8999999195047', 'Indomie Goreng Spesial 85g', 3500, 150, 'Makanan'],
      ['8999999195054', 'Indomie Kuah Ayam Bawang 75g', 3500, 120, 'Makanan'],
      ['8991389221016', 'Ultra Milk Cokelat 250ml', 7000, 80, 'Minuman'],
      ['8991389221023', 'Ultra Milk Full Cream 250ml', 7000, 65, 'Minuman'],
      ['8992388112101', 'Aqua Botol 600ml', 4000, 200, 'Minuman'],
      ['8998866100234', 'Pocari Sweat Can 330ml', 8500, 50, 'Minuman'],
      ['8996001301124', 'Chitato Sapi Panggang 68g', 12500, 45, 'Snack'],
      ['8992775211029', 'Oreo Vanilla 133g', 10500, 60, 'Snack'],
      ['8991002105121', 'Rinso Anti Noda Deterjen 770g', 24000, 30, 'Kebutuhan Rumah'],
      ['8992753221019', 'Lifebuoy Sabun Cair Total 10 450ml', 26000, 40, 'Kebutuhan Pribadi'],
      ['8993175538221', 'Pepsodent Pencegah Gigi Berlubang 190g', 15500, 75, 'Kebutuhan Pribadi'],
      ['8992770014013', 'Minyak Goreng Sania 2L', 38000, 35, 'Sembako'],
      ['8999909012011', 'Beras Ramos Super 5kg', 75000, 25, 'Sembako'],
      ['8991001011129', 'Gula Pasir Gulaku Premium 1kg', 18500, 90, 'Sembako']
    ];

    for (const p of products) {
      await conn.query(
        `INSERT INTO products (kode_barang, nama_barang, harga, stok, type) VALUES (?, ?, ?, ?, ?)`,
        p
      );
    }
    console.log(`Seeded ${products.length} supermarket products.`);

    // Seed Members
    const members = [
      ['Budi Santoso', '081234567890', 'budi@gmail.com', 'Jl. Merdeka No. 10, Jakarta'],
      ['Siti Nurhaliza', '085712345678', 'siti@yahoo.com', 'Jl. Sudirman No. 45, Bandung'],
      ['Ahmad Fauzi', '089876543210', 'ahmad@outlook.com', 'Jl. Diponegoro No. 12, Surabaya']
    ];

    for (const m of members) {
      await conn.query(
        `INSERT INTO members (nama_member, nomor_telepon, email, alamat) VALUES (?, ?, ?, ?)`,
        m
      );
    }
    console.log(`Seeded ${members.length} members.`);

    // Seed a sample transaction so reports have initial preview
    const [userRows] = await conn.query(`SELECT id_user FROM users WHERE username = 'marcha'`);
    const petugasId = userRows[0]?.id_user || 2;
    const [memberRows] = await conn.query(`SELECT id_member FROM members WHERE nomor_telepon = '081234567890'`);
    const memberId = memberRows[0]?.id_member || 1;

    const [trxRes] = await conn.query(
      `INSERT INTO transactions (no_transaksi, id_user, id_member, total, pembayaran, kembalian)
       VALUES ('TRX-INITIAL-0001', ?, ?, 35000.00, 50000.00, 15000.00)`,
      [petugasId, memberId]
    );
    const newTrxId = trxRes.insertId;

    await conn.query(
      `INSERT INTO transaction_details (id_transaksi, id_barang, jumlah, harga, subtotal)
       VALUES (?, 1, 2, 3500.00, 7000.00),
              (?, 3, 4, 7000.00, 28000.00)`,
      [newTrxId, newTrxId]
    );

    console.log('Sample transaction created.');
    await conn.end();
    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

initDB();
