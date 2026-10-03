// Regression tests for the current React, Next.js, Lucide, and MySQL package APIs.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextResponse } from 'next/server.js';
import { ShoppingCart } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getDbPool } from '../lib/db.js';

describe('runtime dependency compatibility', () => {
  it('renders Lucide icons with React server rendering', () => {
    const markup = renderToStaticMarkup(React.createElement(ShoppingCart));
    assert.match(markup, /<svg/);
    assert.match(markup, /lucide-shopping-cart/);
  });

  it('renders the QRIS demo as an accessible QR image', () => {
    const markup = renderToStaticMarkup(React.createElement(QRCodeSVG, {
      value: 'https://example.com/demo-qris',
      size: 144,
      title: 'QR contoh, bukan QR pembayaran aktif'
    }));
    assert.match(markup, /<svg/);
    assert.match(markup, /<path/);
    assert.match(markup, /QR contoh, bukan QR pembayaran aktif/);
  });

  it('creates JSON responses using the Next.js server API', async () => {
    const response = NextResponse.json({ success: true });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
  });

  it('creates and closes the configured MySQL pool without connecting', async () => {
    const pool = getDbPool();
    assert.equal(typeof pool.query, 'function');
    await pool.end();
  });
});