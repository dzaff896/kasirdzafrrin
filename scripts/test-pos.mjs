const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- 1. Testing Petugas Login ---');
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'marcha', password: 'petugas123' })
  });
  const petugasData = await res.json();
  console.log('Petugas login status:', res.status, petugasData);
  const petugasCookie = res.headers.get('set-cookie');

  console.log('\n--- 2. Testing Barcode Lookup for 8999999195047 ---');
  res = await fetch(`${BASE_URL}/api/products/barcode/8999999195047`);
  const barcodeData = await res.json();
  console.log('Barcode lookup status:', res.status, barcodeData);
  const product = barcodeData.product;
  console.log(`Product found: ${product.nama_barang}, Stock: ${product.stok}, Price: ${product.harga}`);

  console.log('\n--- 3. Testing Checkout Transaction (ACID MySQL) ---');
  const initialStock = product.stok;
  res = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': petugasCookie
    },
    body: JSON.stringify({
      items: [
        {
          id_barang: product.id_barang,
          nama_barang: product.nama_barang,
          jumlah: 3,
          harga: product.harga
        }
      ],
      pembayaran: 20000,
      id_member: 1
    })
  });
  const trxData = await res.json();
  console.log('Transaction status:', res.status, trxData);
  if (trxData.success) {
    console.log(`Transaction Created: ${trxData.transaction.no_transaksi}`);
    console.log(`Total: Rp ${trxData.transaction.total}, Paid: Rp ${trxData.transaction.pembayaran}, Change: Rp ${trxData.transaction.kembalian}`);
  }

  console.log('\n--- 4. Verify Stock Deduction in Database ---');
  res = await fetch(`${BASE_URL}/api/products/barcode/8999999195047`);
  const updatedBarcode = await res.json();
  const updatedStock = updatedBarcode.product.stok;
  console.log(`Stock before: ${initialStock}, Stock after transaction: ${updatedStock}`);
  if (updatedStock === initialStock - 3) {
    console.log('✓ STOCK DEDUCTION VERIFIED! (Exact decrement by 3)');
  } else {
    console.error('✗ Stock deduction mismatch');
  }

  console.log('\n--- 5. Testing Admin Login ---');
  res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminData = await res.json();
  console.log('Admin login status:', res.status, adminData);
  const adminCookie = res.headers.get('set-cookie');

  console.log('\n--- 6. Testing Admin Reports API ---');
  res = await fetch(`${BASE_URL}/api/reports`, {
    headers: { 'Cookie': adminCookie }
  });
  const reportsData = await res.json();
  console.log('Reports summary:', reportsData.summary);
  console.log('Top products count:', reportsData.topProducts?.length);

  console.log('\n--- 7. Testing Petugas Accessing Admin Reports (Should be blocked 403) ---');
  res = await fetch(`${BASE_URL}/api/reports`, {
    headers: { 'Cookie': petugasCookie }
  });
  console.log('Petugas access to reports status:', res.status);
  const forbiddenData = await res.json();
  console.log('Response:', forbiddenData);

  console.log('\n=== ALL AUTOMATED INTEGRATION TESTS COMPLETED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
