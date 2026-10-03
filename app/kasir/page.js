'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserCheck,
  UserX,
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle,
  Printer,
  ArrowLeft,
  LogOut,
  History,
  Clock,
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react';
import Toast from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';
import { QRCodeSVG } from 'qrcode.react';

export default function KasirPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [time, setTime] = useState('');

  // Scanner & Products state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Semua']);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);

  // Member state
  const [isMember, setIsMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ nama_member: '', nomor_telepon: '', email: '', alamat: '' });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [uangDibayar, setUangDibayar] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [staffTransactions, setStaffTransactions] = useState([]);
  const [loadingTransactionHistory, setLoadingTransactionHistory] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const barcodeInputRef = useRef(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current user and products on mount
  useEffect(() => {
    fetchUser();
    fetchProducts();
    focusScanner();
  }, []);

  const focusScanner = () => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        const cats = Array.from(new Set(data.products.map((p) => p.type).filter(Boolean)));
        setCategories(['Semua', ...cats]);
      } else {
        addToast(data.message || 'Gagal mengambil data produk', 'error');
      }
    } catch (err) {
      addToast('Gagal terhubung ke database produk', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const openTransactionHistory = async () => {
    setShowTransactionHistory(true);
    setLoadingTransactionHistory(true);

    try {
      const res = await fetch('/api/transactions?limit=100', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffTransactions(data.transactions || []);
      } else {
        addToast(data.message || 'Gagal memuat riwayat transaksi', 'error');
      }
    } catch {
      addToast('Gagal terhubung saat memuat riwayat transaksi', 'error');
    } finally {
      setLoadingTransactionHistory(false);
    }
  };

  // Barcode Scan Handler
  const handleBarcodeSubmit = async (e) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (res.ok && data.success && data.product) {
        addProductToCart(data.product);
        setBarcodeInput('');
      } else {
        addToast(data.message || `Produk dengan barcode "${code}" tidak ditemukan di database!`, 'error');
        setBarcodeInput('');
        focusScanner();
      }
    } catch (err) {
      addToast('Terjadi kesalahan saat memeriksa barcode', 'error');
    }
  };

  const addProductToCart = (product) => {
    if (product.stok <= 0) {
      addToast(`Stok "${product.nama_barang}" habis!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.id_barang === product.id_barang);
    const inCartQty = existingIndex >= 0 ? cart[existingIndex].jumlah : 0;
    if (inCartQty >= product.stok) {
      addToast(`Seluruh stok "${product.nama_barang}" (${product.stok} pcs) sudah ada di keranjang!`, 'warning');
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].jumlah += 1;
      updated[existingIndex].subtotal = updated[existingIndex].jumlah * updated[existingIndex].harga;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id_barang: product.id_barang,
          kode_barang: product.kode_barang,
          nama_barang: product.nama_barang,
          harga: parseFloat(product.harga),
          stok: product.stok,
          type: product.type,
          jumlah: 1,
          subtotal: parseFloat(product.harga)
        }
      ]);
    }

    addToast(`"${product.nama_barang}" ditambahkan ke keranjang`, 'success');
    focusScanner();
  };

  const updateCartQty = (id_barang, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id_barang === id_barang) {
            const newQty = item.jumlah + delta;
            if (newQty > item.stok) {
              addToast(`Stok "${item.nama_barang}" hanya tersisa ${item.stok}`, 'warning');
              return item;
            }
            if (newQty <= 0) {
              return null;
            }
            return {
              ...item,
              jumlah: newQty,
              subtotal: newQty * item.harga
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id_barang) => {
    setCart((prev) => prev.filter((item) => item.id_barang !== id_barang));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedMember(null);
    setIsMember(false);
    setPaymentMethod('cash');
    setUangDibayar('');
    focusScanner();
  };

  // Member search
  const handleSearchMember = async (e) => {
    if (e) e.preventDefault();
    if (!memberQuery.trim()) return;

    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(memberQuery.trim())}`);
      const data = await res.json();

      if (data.success && data.members && data.members.length > 0) {
        setSelectedMember(data.members[0]);
        addToast(`Member ditemukan: ${data.members[0].nama_member}`, 'success');
      } else {
        addToast(`Member dengan ID/No. HP "${memberQuery}" tidak ditemukan`, 'warning');
        setSelectedMember(null);
      }
    } catch {
      addToast('Gagal mencari data member', 'error');
    }
  };

  // Add Member
  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!newMemberForm.nama_member || !newMemberForm.nomor_telepon) {
      addToast('Nama dan No. HP wajib diisi', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Member baru berhasil didaftarkan!', 'success');
        setSelectedMember(data.member);
        setShowAddMemberModal(false);
        setNewMemberForm({ nama_member: '', nomor_telepon: '', email: '', alamat: '' });
      } else {
        addToast(data.message || 'Gagal mendaftarkan member', 'error');
      }
    } catch {
      addToast('Kesalahan server saat membuat member', 'error');
    }
  };

  // Totals & Calculations
  const totalBelanja = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const nominalUang = paymentMethod === 'cash' ? parseFloat(uangDibayar) || 0 : totalBelanja;
  const electronicAmountMatchesTotal = Math.abs(nominalUang - totalBelanja) < 0.01;
  const kembalian = paymentMethod === 'cash' ? nominalUang - totalBelanja : 0;

  const selectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method !== paymentMethod) setUangDibayar('');
  };

  const appendPaymentDigit = (digit) => {
    setUangDibayar((current) => {
      const digits = current.replace(/\D/g, '');
      if (digits.length >= 10) return digits;
      return `${digits}${digit}`.replace(/^0+(?=\d)/, '');
    });
  };

  const removePaymentDigit = () => {
    setUangDibayar((current) => current.replace(/\D/g, '').slice(0, -1));
  };

  // Process Checkout
  const handleProcessPayment = async () => {
    if (cart.length === 0) {
      addToast('Keranjang masih kosong', 'warning');
      return;
    }
    if (paymentMethod !== 'cash' && !electronicAmountMatchesTotal) {
      addToast(`Nominal ${paymentMethod === 'qris' ? 'QRIS' : 'kartu debit'} harus sama dengan total belanja`, 'error');
      return;
    }
    if (paymentMethod === 'cash' && nominalUang < totalBelanja) {
      addToast('Uang pembayaran masih kurang!', 'error');
      return;
    }

    setSubmittingPayment(true);

    try {
      const payload = {
        items: cart.map((c) => ({
          id_barang: c.id_barang,
          nama_barang: c.nama_barang,
          jumlah: c.jumlah,
          harga: c.harga
        })),
        pembayaran: nominalUang,
        metode_pembayaran: paymentMethod,
        id_member: isMember && selectedMember ? selectedMember.id_member : null
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('Transaksi berhasil diproses!', 'success');
        setCompletedTransaction(data.transaction);
        // Refresh product stock
        fetchProducts();
      } else {
        addToast(data.message || 'Transaksi gagal diproses', 'error');
      }
    } catch (err) {
      addToast('Terjadi kesalahan database saat memproses transaksi', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleStartNewTransaction = () => {
    setCompletedTransaction(null);
    clearCart();
    focusScanner();
  };

  // Filter products for catalog shelf
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'Semua' || p.type === selectedCategory;
    const matchSearch =
      searchCatalog === '' ||
      p.nama_barang.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      p.kode_barang.includes(searchCatalog);
    return matchCat && matchSearch;
  });

  return (
    <div className="cashier-page min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Lively Ambient Background Glows */}
      <div className="fixed top-20 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full animate-float-slow pointer-events-none blur-3xl z-0" />
      <div className="fixed bottom-20 -right-24 w-80 h-80 bg-teal-500/10 rounded-full animate-float-reverse pointer-events-none blur-3xl z-0" />

      {/* Top Navigation */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 hover:rotate-3 duration-300">
            <ShoppingBag className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">SuperPOS</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span>KASIR</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Terminal Kasir Supermarket</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{time || 'Memuat jam...'}</span>
          </div>

          <button
            type="button"
            onClick={openTransactionHistory}
            title="Riwayat transaksi"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer text-xs font-semibold"
          >
            <History className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">Riwayat</span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-semibold text-white">
                {currentUser?.username || 'Petugas'}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{currentUser?.role === 'Admin' ? 'Admin' : 'Petugas Kasir'}</span>
              </div>
            </div>

            {currentUser?.role === 'Admin' && (
              <button
                type="button"
                onClick={() => router.push('/admin')}
                title="Kembali ke halaman admin"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Admin</span>
              </button>
            )}

            <ThemeToggle />

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 transition-all duration-200 hover:scale-105 border border-slate-700 hover:border-rose-500/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main POS Interface Grid */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto relative z-10">
        {/* Left Column: Barcode Scanner & Product Catalog (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Scanner Barcode Box with Animated Laser Line */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanner-line pointer-events-none opacity-80" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ScanBarcode className="w-5 h-5 animate-pulse" />
                <span>SCANNER BARCODE PRODUK</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Arahkan scanner atau tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700 font-semibold">Enter</kbd>
              </span>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode fisik atau ketik kode barang di sini..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition shadow-inner"
                  autoComplete="off"
                />
                <ScanBarcode className="w-5 h-5 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer text-sm shrink-0 flex items-center gap-1.5"
              >
                <span>Cari / Scan</span>
              </button>
            </form>
          </div>

          {/* Product Catalog shelf */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col flex-1 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-400" />
                <h2 className="font-bold text-white text-base">Katalog Produk Supermarket</h2>
              </div>

              {/* Search catalog */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  placeholder="Cari nama atau barcode..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mt-4 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
              {loadingProducts ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                  Memuat daftar produk...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                  Tidak ada produk yang sesuai kriteria
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stok <= 0;
                  return (
                    <div
                      key={p.id_barang}
                      onClick={() => !isOutOfStock && addProductToCart(p)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                        isOutOfStock
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950/70 border-slate-800 hover:border-teal-400/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/15 cursor-pointer active:scale-95'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {p.type}
                          </span>
                          <span
                            className={`font-semibold ${
                              p.stok <= 5 ? 'text-rose-400' : p.stok <= 15 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            Stok: {p.stok}
                          </span>
                        </div>
                        <h3 className="font-semibold text-xs text-white line-clamp-2 mb-1">
                          {p.nama_barang}
                        </h3>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {p.kode_barang}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">
                          Rp {parseFloat(p.harga).toLocaleString('id-ID')}
                        </span>
                        <span className="p-1 rounded-md bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-slate-950 transition">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Keranjang & Pembayaran (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Cart Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-white text-base">Keranjang Belanja</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {cart.length} item
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[290px] py-2 space-y-2.5 pr-1 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-slate-700 mb-2 stroke-[1.2]" />
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-600 mt-0.5">Scan barcode atau pilih barang dari katalog</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id_barang}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-xs text-white truncate">{item.nama_barang}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">({item.type})</span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        Rp {item.harga.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-700/60 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQty(item.id_barang, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white">
                        {item.jumlah}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id_barang, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[70px] shrink-0">
                      <div className="text-xs font-bold text-white">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeFromCart(item.id_barang)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Member Section */}
            <div className="pt-3 border-t border-slate-800 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  Status Pelanggan
                </span>

                <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    onClick={() => {
                      setIsMember(false);
                      setSelectedMember(null);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      !isMember ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Non-Member
                  </button>
                  <button
                    onClick={() => setIsMember(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                      isMember ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Member
                  </button>
                </div>
              </div>

              {isMember && (
                <div className="mt-2 space-y-2">
                  {selectedMember ? (
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-cyan-300">{selectedMember.nama_member}</div>
                        <div className="text-[10px] text-slate-400">
                          ID: #{selectedMember.id_member} • Telp: {selectedMember.nomor_telepon}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 underline"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <form onSubmit={handleSearchMember} className="flex gap-1.5">
                        <input
                          type="text"
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                          placeholder="Cari ID Member atau No. Telepon..."
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Cari
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberModal(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Member belum terdaftar? Tambah Member Baru</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Details Section */}
            <div className="pt-3 border-t border-slate-800 mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Total Belanja:</span>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  Rp {totalBelanja.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Metode pembayaran">
                  {[
                    { value: 'cash', label: 'Cash', Icon: Banknote },
                    { value: 'qris', label: 'QRIS', Icon: QrCode },
                    { value: 'debit', label: 'Kartu Debit', Icon: CreditCard }
                  ].map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={paymentMethod === value}
                      onClick={() => selectPaymentMethod(value)}
                      className={`min-h-11 px-2 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        paymentMethod === value
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <>
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUangDibayar(totalBelanja.toString())}
                      disabled={totalBelanja === 0}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setUangDibayar('50000')}
                      disabled={totalBelanja === 0}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Rp 50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setUangDibayar('100000')}
                      disabled={totalBelanja === 0}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                    >
                      Rp 100.000
                    </button>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Uang Diterima (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="none"
                        min="0"
                        maxLength={10}
                        value={uangDibayar}
                        onChange={(e) => setUangDibayar(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="0"
                        aria-label="Nominal uang diterima"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid w-full max-w-md grid-cols-3 gap-2 mt-3 mx-auto" role="group" aria-label="Keypad nominal pembayaran">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => appendPaymentDigit(digit)}
                          aria-label={`Angka ${digit}`}
                          className="min-h-14 rounded-xl border border-slate-700 bg-slate-800 text-xl font-bold text-white hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 transition cursor-pointer touch-manipulation"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setUangDibayar('')}
                        aria-label="Kosongkan nominal"
                        className="min-h-14 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 transition cursor-pointer touch-manipulation flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendPaymentDigit('0')}
                        aria-label="Angka 0"
                        className="min-h-14 rounded-xl border border-slate-700 bg-slate-800 text-xl font-bold text-white hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 transition cursor-pointer touch-manipulation"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={removePaymentDigit}
                        aria-label="Hapus satu digit"
                        className="min-h-14 rounded-xl border border-slate-700 bg-slate-950 text-2xl font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer touch-manipulation"
                      >
                        ⌫
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'qris' && (
                  totalBelanja > 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                      <div className="rounded-lg bg-white p-2.5">
                        <QRCodeSVG
                          value={`https://example.com/demo-qris?amount=${nominalUang}`}
                          size={160}
                          level="M"
                          title="QR contoh, bukan QR pembayaran aktif"
                        />
                      </div>
                      <p className="text-xl font-black tracking-wide text-emerald-300">
                        Rp {nominalUang.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-slate-400">
                        Contoh QRIS saja, bukan kode pembayaran aktif.
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      Tambahkan produk ke keranjang untuk menampilkan nominal QRIS.
                    </div>
                  )
                )}
                {paymentMethod === 'debit' && (
                  totalBelanja > 0 ? (
                    <div className="px-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Nominal pada mesin kartu debit</p>
                      <p className="mt-1 text-xl font-black text-emerald-300">
                        Rp {nominalUang.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      Tambahkan produk ke keranjang untuk menentukan nominal kartu debit.
                    </div>
                  )
              )}
              </>

              {/* Kembalian */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Kembalian:</span>
                <span
                  className={`text-lg font-extrabold ${
                    kembalian < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  Rp {nominalUang > 0 ? kembalian.toLocaleString('id-ID') : '0'}
                </span>
              </div>

              {/* Bayar Button */}
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={cart.length === 0 || (paymentMethod === 'cash' ? nominalUang < totalBelanja : !electronicAmountMatchesTotal) || submittingPayment}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-base tracking-wide shadow-xl shadow-emerald-500/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>{submittingPayment ? 'Memproses Transaksi...' : 'SELESAIKAN PEMBAYARAN (BAYAR)'}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL: DAFTAR MEMBER BARU */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <UserPlus className="w-5 h-5" />
                <span>Daftarkan Member Baru</span>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Member *</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.nama_member}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, nama_member: e.target.value })}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon *</label>
                <input
                  type="tel"
                  required
                  value={newMemberForm.nomor_telepon}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, nomor_telepon: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="Contoh: rian@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat</label>
                <textarea
                  rows="2"
                  value={newMemberForm.alamat}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, alamat: e.target.value })}
                  placeholder="Alamat domisili..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Simpan & Pilih Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransactionHistory && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Riwayat Transaksi</h2>
                  <p className="text-xs text-slate-400">
                    {currentUser?.role === 'Admin' ? 'Semua transaksi' : `Transaksi milik ${currentUser?.username || 'akun petugas'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransactionHistory(false)}
                title="Tutup riwayat transaksi"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-auto">
              {loadingTransactionHistory ? (
                <div className="py-12 text-center text-sm text-slate-400">Memuat riwayat transaksi...</div>
              ) : staffTransactions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Belum ada transaksi untuk akun ini.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">No. Transaksi</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Pelanggan</th>
                        <th className="px-4 py-3">Metode</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {staffTransactions.map((transaction) => (
                        <tr key={transaction.id_transaksi} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-semibold text-cyan-300">{transaction.no_transaksi}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {new Date(transaction.tanggal_transaksi).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{transaction.nama_member || 'Umum'}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {transaction.metode_pembayaran === 'qris'
                              ? 'QRIS'
                              : transaction.metode_pembayaran === 'debit'
                                ? 'Kartu Debit'
                                : 'Cash'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-300">
                            Rp {Number(transaction.total).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STRUK TRANSAKSI BERHASIL (THERMAL RECEIPT FORMAT) */}
      {completedTransaction && (
        <div className="receipt-print-modal fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="receipt-modal-content bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] overflow-y-auto">
            <div className="text-center mb-4 no-print">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Transaksi Berhasil!</h2>
              <p className="text-xs text-slate-400">Struk telah tercatat dan stok produk berkurang otomatis.</p>
            </div>

            {/* Receipt Preview (Printable Struk) */}
            <div
              id="printable-receipt"
              className="receipt-print-area bg-white text-slate-900 font-mono p-7 rounded-xl shadow-inner text-sm border border-slate-300 space-y-3 select-text"
            >
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <div className="receipt-store-name font-black text-base tracking-wider">SUPERPOS SUPERMARKET</div>
                <div className="text-[10px] text-slate-600">Jl. Raya Utama No. 88, Telp: 021-5551234</div>
                <div className="text-[10px] text-slate-600">www.superpos.co.id</div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>No. Trx:</span>
                  <span className="font-bold">{completedTransaction.no_transaksi}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(completedTransaction.tanggal_transaksi).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{completedTransaction.petugas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>
                    {completedTransaction.member
                      ? `${completedTransaction.member.nama_member} (Member)`
                      : 'Non-Member'}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 py-1 border-b border-dashed border-slate-400">
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="font-medium text-slate-900">{item.nama_barang}</div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.jumlah} x Rp {item.harga.toLocaleString('id-ID')}
                      </span>
                      <span className="font-semibold text-slate-900">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="text-xs space-y-1 pt-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rp {completedTransaction.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>METODE:</span>
                  <span>
                    {completedTransaction.metode_pembayaran === 'qris'
                      ? 'QRIS'
                      : completedTransaction.metode_pembayaran === 'debit'
                        ? 'KARTU DEBIT'
                        : 'CASH'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>DIBAYAR:</span>
                  <span>Rp {completedTransaction.pembayaran.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>KEMBALIAN:</span>
                  <span>Rp {completedTransaction.kembalian.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500">
                <div>*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</div>
                <div>Barang yang sudah dibeli tidak dapat ditukar</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 mt-5 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={handleStartNewTransaction}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
