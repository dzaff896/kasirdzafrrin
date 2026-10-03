import mysql from 'mysql2/promise';

let pool;

export function getDbPool() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL must be configured in production.');
      }

      pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kasir_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
      });
    }
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = getDbPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}
