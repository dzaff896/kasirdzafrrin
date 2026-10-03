-- Database: kasir_db
-- Dibuat untuk Sistem Kasir Berbasis Next.js & MySQL

CREATE DATABASE IF NOT EXISTS `kasir_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kasir_db`;

-- 1. Table users
DROP TABLE IF EXISTS `transaction_details`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id_user` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Petugas') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table products
CREATE TABLE `products` (
  `id_barang` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_barang` VARCHAR(50) NOT NULL UNIQUE,
  `nama_barang` VARCHAR(150) NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL,
  `stok` INT NOT NULL DEFAULT 0,
  `type` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table members
CREATE TABLE `members` (
  `id_member` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_member` VARCHAR(100) NOT NULL,
  `nomor_telepon` VARCHAR(25) NOT NULL UNIQUE,
  `email` VARCHAR(100) DEFAULT NULL,
  `alamat` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table transactions
CREATE TABLE `transactions` (
  `id_transaksi` INT AUTO_INCREMENT PRIMARY KEY,
  `no_transaksi` VARCHAR(50) NOT NULL UNIQUE,
  `id_user` INT NOT NULL,
  `id_member` INT DEFAULT NULL,
  `total` DECIMAL(12,2) NOT NULL,
  `pembayaran` DECIMAL(12,2) NOT NULL,
  `metode_pembayaran` ENUM('cash', 'qris', 'debit') NOT NULL DEFAULT 'cash',
  `kembalian` DECIMAL(12,2) NOT NULL,
  `tanggal_transaksi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transaksi_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_member` FOREIGN KEY (`id_member`) REFERENCES `members` (`id_member`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table transaction_details
CREATE TABLE `transaction_details` (
  `id_detail` INT AUTO_INCREMENT PRIMARY KEY,
  `id_transaksi` INT NOT NULL,
  `id_barang` INT NOT NULL,
  `jumlah` INT NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  CONSTRAINT `fk_detail_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transactions` (`id_transaksi`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_barang` FOREIGN KEY (`id_barang`) REFERENCES `products` (`id_barang`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- DATA AWAL / SEED DATA
-- Password default admin: admin123 (bcrypt hash)
-- Password default petugas: petugas123 (bcrypt hash)
-- ========================================================

INSERT INTO `users` (`id_user`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2b$10$wKkSvdj7P6v9y72l5V7a/.8fO3w9R34l5m7p9U6j0mY4iH.Cq1L1O', 'Admin'),
(2, 'marcha', '$2b$10$tZ2E7/zGf2m7wJpS2G8IqOdHkY2A6I9V4cT5p3eL2Q1w8X9m4b3yO', 'Petugas');

-- Sample Produk Supermarket Lengkap dengan Kode Barcode
INSERT INTO `products` (`id_barang`, `kode_barang`, `nama_barang`, `harga`, `stok`, `type`) VALUES
(1, '8999999195047', 'Indomie Goreng Spesial 85g', 3500.00, 150, 'Makanan'),
(2, '8999999195054', 'Indomie Kuah Ayam Bawang 75g', 3500.00, 120, 'Makanan'),
(3, '8991389221016', 'Ultra Milk Cokelat 250ml', 7000.00, 80, 'Minuman'),
(4, '8991389221023', 'Ultra Milk Full Cream 250ml', 7000.00, 65, 'Minuman'),
(5, '8992388112101', 'Aqua Botol 600ml', 4000.00, 200, 'Minuman'),
(6, '8998866100234', 'Pocari Sweat Can 330ml', 8500.00, 50, 'Minuman'),
(7, '8996001301124', 'Chitato Sapi Panggang 68g', 12500.00, 45, 'Snack'),
(8, '8992775211029', 'Oreo Vanilla 133g', 10500.00, 60, 'Snack'),
(9, '8991002105121', 'Rinso Anti Noda Deterjen 770g', 24000.00, 30, 'Kebutuhan Rumah'),
(10, '8992753221019', 'Lifebuoy Sabun Cair Total 10 450ml', 26000.00, 40, 'Kebutuhan Pribadi'),
(11, '8993175538221', 'Pepsodent Pencegah Gigi Berlubang 190g', 15500.00, 75, 'Kebutuhan Pribadi'),
(12, '8992770014013', 'Minyak Goreng Sania 2L', 38000.00, 35, 'Sembako'),
(13, '8999909012011', 'Beras Ramos Super 5kg', 75000.00, 25, 'Sembako'),
(14, '8991001011129', 'Gula Pasir Gulaku Premium 1kg', 18500.00, 90, 'Sembako');

-- Sample Data Member
INSERT INTO `members` (`id_member`, `nama_member`, `nomor_telepon`, `email`, `alamat`) VALUES
(1, 'Budi Santoso', '081234567890', 'budi@gmail.com', 'Jl. Merdeka No. 10, Jakarta'),
(2, 'Siti Nurhaliza', '085712345678', 'siti@yahoo.com', 'Jl. Sudirman No. 45, Bandung'),
(3, 'Ahmad Fauzi', '089876543210', 'ahmad@outlook.com', 'Jl. Diponegoro No. 12, Surabaya');
