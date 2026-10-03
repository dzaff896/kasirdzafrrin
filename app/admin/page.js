'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PackageCheck,
  PackageX,
  X,
  Printer,
  Download,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  UserPlus
} from 'lucide-react';
import Toast from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'products', 'members', 'staff', 'transactions', 'reports'

  // Data states
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Filter & Search states
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('Semua');
  const [memberSearch, setMemberSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffForm, setStaffForm] = useState({ username: '', password: '' });
  const [editingStaff, setEditingStaff] = useState(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(false);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    id_barang: null,
    kode_barang: '',
    nama_barang: '',
    harga: '',
    stok: '',
    type: 'Makanan'
  });

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    nama_member: '',
    nomor_telepon: '',
    email: '',
    alamat: ''
  });

  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Toast
  const [toasts, setToasts] = useState([]);

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

  useEffect(() => {
    fetchUser();
    loadDashboardData();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role !== 'Admin') {
          router.push('/kasir');
          return;
        }
        setCurrentUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  const loadDashboardData = async () => {
    fetchProducts();
    fetchReports();
    fetchMembers();
    fetchStaff();
    fetchTransactions();
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch {
      addToast('Gagal memuat produk dari database', 'error');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch {
      addToast('Gagal memuat data member', 'error');
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffAccounts(data.users || []);
      } else {
        addToast(data.message || 'Gagal memuat akun petugas', 'error');
      }
    } catch {
      addToast('Gagal memuat akun petugas', 'error');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions?limit=100');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch {
      addToast('Gagal memuat riwayat transaksi', 'error');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReportsData(data);
        setStats(data.summary);
      }
    } catch {
      addToast('Gagal memuat laporan statistik', 'error');
    }
  };

  const handleDownloadSalesReport = async () => {
    if (!reportsData) {
      addToast('Data laporan belum siap diunduh', 'warning');
      return;
    }

    setDownloadingReport(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = { left: 14, right: 14 };
      const contentWidth = pageWidth - margin.left - margin.right;
      const formatCurrency = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
      const generatedAt = reportsData.generatedAt ? new Date(reportsData.generatedAt) : new Date();
      let cursorY = 18;

      doc.setProperties({
        title: 'Laporan Penjualan SuperPOS',
        subject: 'Rekapitulasi transaksi dan performa penjualan'
      });
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('SUPERPOS SUPERMARKET', margin.left, cursorY);
      doc.setFontSize(8);
      doc.text('DOKUMEN INTERNAL', pageWidth - margin.right, cursorY, { align: 'right' });

      cursorY += 9;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(19);
      doc.text('LAPORAN PENJUALAN', margin.left, cursorY);
      cursorY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Rekapitulasi transaksi dan performa penjualan', margin.left, cursorY);
      cursorY += 5;
      doc.setDrawColor(148, 163, 184);
      doc.line(margin.left, cursorY, pageWidth - margin.right, cursorY);

      cursorY += 6;
      const metadata = [
        ['Periode', 'Seluruh transaksi tercatat'],
        ['Tanggal cetak', generatedAt.toLocaleString('id-ID')],
        ['Disusun oleh', currentUser?.username || 'Administrator']
      ];
      const metadataWidth = contentWidth / metadata.length;
      metadata.forEach(([label, value], index) => {
        const x = margin.left + metadataWidth * index;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, x, cursorY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(doc.splitTextToSize(value, metadataWidth - 4), x, cursorY + 4);
      });

      cursorY += 14;
      const metrics = [
        ['TOTAL OMZET', formatCurrency(reportsData.summary?.total_pendapatan)],
        ['TRANSAKSI', Number(reportsData.summary?.total_transaksi || 0).toLocaleString('id-ID')],
        ['ITEM TERJUAL', `${Number(reportsData.summary?.total_item_terjual || 0).toLocaleString('id-ID')} pcs`],
        ['RATA-RATA', formatCurrency(reportsData.summary?.rata_rata_transaksi)]
      ];
      const metricGap = 3;
      const metricWidth = (contentWidth - metricGap * (metrics.length - 1)) / metrics.length;
      metrics.forEach(([label, value], index) => {
        const x = margin.left + (metricWidth + metricGap) * index;
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, cursorY, metricWidth, 19, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(label, x + 3, cursorY + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(doc.splitTextToSize(value, metricWidth - 6), x + 3, cursorY + 13);
      });

      cursorY += 26;
      const drawSectionTitle = (title) => {
        if (cursorY > pageHeight - 28) {
          doc.addPage();
          cursorY = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin.left, cursorY);
        cursorY += 2;
      };
      const drawTable = ({ head, body, foot, columnStyles }) => {
        autoTable(doc, {
          startY: cursorY,
          head: [head],
          body,
          ...(foot ? { foot: [foot] } : {}),
          margin,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2.2,
            textColor: [30, 41, 59],
            lineColor: [203, 213, 225],
            lineWidth: 0.15,
            overflow: 'linebreak'
          },
          headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontStyle: 'bold' },
          footStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
          columnStyles
        });
        cursorY = doc.lastAutoTable.finalY + 7;
      };

      const paymentRows = (reportsData.paymentMethodStats || []).map((method) => [
        method.metode_pembayaran === 'qris' ? 'QRIS' : method.metode_pembayaran === 'debit' ? 'Kartu Debit' : 'Cash',
        Number(method.total_transaksi || 0).toLocaleString('id-ID'),
        formatCurrency(method.total_omset)
      ]);
      const paymentTotals = (reportsData.paymentMethodStats || []).reduce((totals, method) => ({
        transactions: totals.transactions + Number(method.total_transaksi || 0),
        revenue: totals.revenue + Number(method.total_omset || 0)
      }), { transactions: 0, revenue: 0 });
      drawSectionTitle('1. Ringkasan Metode Pembayaran');
      drawTable({
        head: ['Metode', 'Transaksi', 'Omzet'],
        body: paymentRows.length ? paymentRows : [['Belum ada data pembayaran', '', '']],
        foot: paymentRows.length ? ['TOTAL', paymentTotals.transactions.toLocaleString('id-ID'), formatCurrency(paymentTotals.revenue)] : null,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
      });

      const categoryRows = (reportsData.categoryStats || []).map((category) => [
        category.kategori || '-',
        Number(category.frekuensi || 0).toLocaleString('id-ID'),
        `${Number(category.total_terjual || 0).toLocaleString('id-ID')} pcs`,
        formatCurrency(category.total_omset)
      ]);
      const categoryTotals = (reportsData.categoryStats || []).reduce((totals, category) => ({
        items: totals.items + Number(category.total_terjual || 0),
        revenue: totals.revenue + Number(category.total_omset || 0)
      }), { items: 0, revenue: 0 });
      drawSectionTitle('2. Performa Penjualan Berdasarkan Kategori');
      drawTable({
        head: ['Kategori Produk', 'Transaksi', 'Item Terjual', 'Total Omzet'],
        body: categoryRows.length ? categoryRows : [['Belum ada transaksi kategori', '', '', '']],
        foot: categoryRows.length ? ['TOTAL', '', `${categoryTotals.items.toLocaleString('id-ID')} pcs`, formatCurrency(categoryTotals.revenue)] : null,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
      });

      const dailyRows = (reportsData.dailySales || []).map((day) => [
        new Date(day.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        Number(day.transaksi_count || 0).toLocaleString('id-ID'),
        formatCurrency(day.total_omset)
      ]);
      const dailyTotals = (reportsData.dailySales || []).reduce((totals, day) => ({
        transactions: totals.transactions + Number(day.transaksi_count || 0),
        revenue: totals.revenue + Number(day.total_omset || 0)
      }), { transactions: 0, revenue: 0 });
      drawSectionTitle('3. Penjualan Harian - 7 Hari Terakhir');
      drawTable({
        head: ['Tanggal', 'Transaksi', 'Omzet'],
        body: dailyRows.length ? dailyRows : [['Belum ada transaksi dalam periode ini', '', '']],
        foot: dailyRows.length ? ['TOTAL 7 HARI', dailyTotals.transactions.toLocaleString('id-ID'), formatCurrency(dailyTotals.revenue)] : null,
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
      });

      const productRows = (reportsData.topProducts || []).map((product, index) => [
        String(index + 1),
        product.nama_barang,
        product.type || '-',
        `${Number(product.terjual || 0).toLocaleString('id-ID')} pcs`,
        formatCurrency(product.total_rupiah)
      ]);
      drawSectionTitle('4. Lima Produk Terlaris');
      drawTable({
        head: ['No.', 'Produk', 'Kategori', 'Terjual', 'Omzet'],
        body: productRows.length ? productRows : [['', 'Belum ada data produk', '', '', '']],
        columnStyles: { 0: { halign: 'right', cellWidth: 12 }, 3: { halign: 'right' }, 4: { halign: 'right' } }
      });

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(203, 213, 225);
        doc.line(margin.left, pageHeight - 13, pageWidth - margin.right, pageHeight - 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Dicetak ${generatedAt.toLocaleString('id-ID')}`, margin.left, pageHeight - 8);
        doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - margin.right, pageHeight - 8, { align: 'right' });
      }

      doc.save(`laporan-penjualan-${generatedAt.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Generate sales report PDF error:', error);
      addToast('Gagal membuat PDF laporan penjualan', 'error');
    } finally {
      setDownloadingReport(false);
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

  // PRODUCT ACTIONS
  const openAddProduct = () => {
    setIsEditingProduct(false);
    setProductForm({
      id_barang: null,
      kode_barang: '',
      nama_barang: '',
      harga: '',
      stok: '',
      type: 'Makanan'
    });
    setShowProductModal(true);
  };

  const openEditProduct = (prod) => {
    setIsEditingProduct(true);
    setProductForm({
      id_barang: prod.id_barang,
      kode_barang: prod.kode_barang,
      nama_barang: prod.nama_barang,
      harga: prod.harga.toString(),
      stok: prod.stok.toString(),
      type: prod.type
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.kode_barang || !productForm.nama_barang || !productForm.harga || productForm.stok === '') {
      addToast('Lengkapi seluruh input produk', 'warning');
      return;
    }

    try {
      const url = isEditingProduct ? `/api/products/${productForm.id_barang}` : '/api/products';
      const method = isEditingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast(isEditingProduct ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!', 'success');
        setShowProductModal(false);
        fetchProducts();
        fetchReports();
      } else {
        addToast(data.message || 'Gagal menyimpan produk', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan koneksi database', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;

    try {
      const res = await fetch(`/api/products/${deleteConfirmProduct.id_barang}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        addToast('Produk berhasil dihapus!', 'success');
        setDeleteConfirmProduct(null);
        fetchProducts();
        fetchReports();
      } else {
        addToast(data.message || 'Gagal menghapus produk', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan server saat menghapus produk', 'error');
    }
  };

  // MEMBER ACTIONS
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ nama_member: '', nomor_telepon: '', email: '', alamat: '' });
    setShowMemberModal(true);
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      nama_member: member.nama_member,
      nomor_telepon: member.nomor_telepon,
      email: member.email || '',
      alamat: member.alamat || ''
    });
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.nama_member || !memberForm.nomor_telepon) {
      addToast('Nama dan No. HP wajib diisi', 'warning');
      return;
    }

    try {
      const res = await fetch(editingMember ? `/api/members/${editingMember.id_member}` : '/api/members', {
        method: editingMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        addToast(editingMember ? 'Data member berhasil diperbarui!' : 'Member berhasil didaftarkan!', 'success');
        setShowMemberModal(false);
        setEditingMember(null);
        setMemberForm({ nama_member: '', nomor_telepon: '', email: '', alamat: '' });
        fetchMembers();
      } else {
        addToast(data.message || 'Gagal menyimpan data member', 'error');
      }
    } catch {
      addToast('Kesalahan database saat menyimpan member', 'error');
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteConfirmMember) return;

    try {
      const res = await fetch(`/api/members/${deleteConfirmMember.id_member}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        addToast('Member berhasil dihapus!', 'success');
        setDeleteConfirmMember(null);
        fetchMembers();
      } else {
        addToast(data.message || 'Gagal menghapus member', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan server saat menghapus member', 'error');
    }
  };

  const openAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({ username: '', password: '' });
    setShowStaffModal(true);
  };

  const openEditStaff = (account) => {
    setEditingStaff(account);
    setStaffForm({ username: account.username, password: '' });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setSavingStaff(true);
    const isEditing = Boolean(editingStaff);

    try {
      const res = await fetch(isEditing ? `/api/staff/${editingStaff.id_user}` : '/api/staff', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        addToast(`Akun petugas ${data.user.username} berhasil ${isEditing ? 'diperbarui' : 'dibuat'}`, 'success');
        setStaffForm({ username: '', password: '' });
        setEditingStaff(null);
        setShowStaffModal(false);
        fetchStaff();
      } else {
        addToast(data.message || `Gagal ${isEditing ? 'memperbarui' : 'mendaftarkan'} akun petugas`, 'error');
      }
    } catch {
      addToast(`Terjadi kesalahan saat ${isEditing ? 'memperbarui' : 'mendaftarkan'} akun petugas`, 'error');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    setDeletingStaff(true);

    try {
      const res = await fetch(`/api/staff/${deleteConfirmStaff.id_user}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        addToast(`Akun petugas ${deleteConfirmStaff.username} berhasil dihapus`, 'success');
        setDeleteConfirmStaff(null);
        fetchStaff();
      } else {
        addToast(data.message || 'Gagal menghapus akun petugas', 'error');
      }
    } catch {
      addToast('Terjadi kesalahan saat menghapus akun petugas', 'error');
    } finally {
      setDeletingStaff(false);
    }
  };

  // TRANSACTION DETAIL VIEWER
  const viewTransactionDetail = async (id_transaksi) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/transactions/${id_transaksi}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTransactionDetail(data.transaction);
      } else {
        addToast('Gagal memuat detail transaksi', 'error');
      }
    } catch {
      addToast('Kesalahan saat mengambil data transaksi', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Products filter
  const categoriesList = ['Semua', ...Array.from(new Set(products.map((p) => p.type).filter(Boolean)))];
  const filteredProducts = products.filter((p) => {
    const matchCategory = productCategory === 'Semua' || p.type === productCategory;
    const matchSearch =
      productSearch === '' ||
      p.nama_barang.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.kode_barang.includes(productSearch);
    return matchCategory && matchSearch;
  });

  const filteredMembers = members.filter(
    (m) =>
      memberSearch === '' ||
      m.nama_member.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.nomor_telepon.includes(memberSearch) ||
      m.id_member.toString() === memberSearch
  );
  const filteredStaffAccounts = staffAccounts.filter(
    (account) =>
      staffSearch === '' ||
      account.username.toLowerCase().includes(staffSearch.toLowerCase()) ||
      account.id_user.toString() === staffSearch
  );
  const paymentMethodTotals = (reportsData?.paymentMethodStats || []).reduce(
    (totals, method) => ({
      transactions: totals.transactions + Number(method.total_transaksi || 0),
      revenue: totals.revenue + Number(method.total_omset || 0)
    }),
    { transactions: 0, revenue: 0 }
  );
  const categoryTotals = (reportsData?.categoryStats || []).reduce(
    (totals, category) => ({
      items: totals.items + Number(category.total_terjual || 0),
      revenue: totals.revenue + Number(category.total_omset || 0)
    }),
    { items: 0, revenue: 0 }
  );
  const dailySalesTotals = (reportsData?.dailySales || []).reduce(
    (totals, day) => ({
      transactions: totals.transactions + Number(day.transaksi_count || 0),
      revenue: totals.revenue + Number(day.total_omset || 0)
    }),
    { transactions: 0, revenue: 0 }
  );

  return (
    <div className="admin-dashboard-page min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      {/* Lively Ambient Background Glows */}
      <div className="fixed top-24 -left-28 w-96 h-96 bg-emerald-500/10 rounded-full animate-float-slow pointer-events-none blur-3xl z-0" />

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none relative z-10">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-transform duration-300 hover:scale-105 hover:rotate-3">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">SuperPOS</span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>PANEL ADMIN</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'products'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Package className="w-4 h-4" />
            <span>Kelola Data Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'members'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Member</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'staff'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Akun Petugas</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'transactions'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${activeTab === 'reports'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan Penjualan</span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={() => router.push('/kasir')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>Buka Layar Kasir</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-white">{currentUser?.username || 'Administrator'}</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">Super Admin</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-semibold transition border border-slate-700 hover:border-rose-500/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-slate-900/60 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight capitalize">
              {activeTab === 'dashboard' && 'Dashboard Overview & Statistik'}
              {activeTab === 'products' && 'Manajemen Produk Supermarket'}
              {activeTab === 'members' && 'Kelola Data Member Pelanggan'}
              {activeTab === 'staff' && 'Registrasi Akun Petugas'}
              {activeTab === 'transactions' && 'Riwayat Transaksi Kasir'}
              {activeTab === 'reports' && 'Laporan & Analisis Penjualan'}
            </h1>
            <p className="text-xs text-slate-400">
              Database: <span className="text-emerald-400 font-mono">kasir_db</span> (MySQL Laragon / phpMyAdmin)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <button
              onClick={loadDashboardData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>
          </div>
        </header>

        {/* Tab 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Total Omset Penjualan</span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 tracking-tight">
                  Rp {(stats?.total_pendapatan || 0).toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Akumulasi seluruh transaksi</div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Total Transaksi</span>
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-300 tracking-tight">
                  {stats?.total_transaksi || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Rata-rata: Rp {Math.round(stats?.rata_rata_transaksi || 0).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Total Produk Aktif</span>
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-300 tracking-tight">
                  {stats?.total_produk || products.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Item barang dalam katalog</div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Stok Kritis (&le; 10)</span>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  {stats?.produk_stok_kritis || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Perlu restock segera</div>
              </div>
            </div>

            {/* Two Columns: Top Selling & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">5 Produk Terlaris</h3>
                  </div>
                  <span className="text-xs text-slate-400">Berdasarkan kuantitas terjual</span>
                </div>

                <div className="space-y-3">
                  {reportsData?.topProducts?.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Belum ada data penjualan</div>
                  ) : (
                    reportsData?.topProducts?.map((p, idx) => (
                      <div key={p.id_barang} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{p.nama_barang}</div>
                            <div className="text-[10px] text-slate-500">{p.type} • {p.kode_barang}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-400">{p.terjual} terjual</div>
                          <div className="text-[10px] text-slate-400">Rp {parseFloat(p.total_rupiah).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">Peringatan Stok Menipis</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Kelola Stok &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {reportsData?.lowStockProducts?.length === 0 ? (
                    <div className="py-8 text-center text-emerald-400 text-xs">
                      Semua stok barang dalam kondisi aman (&gt; 10 pcs)!
                    </div>
                  ) : (
                    reportsData?.lowStockProducts?.map((p) => (
                      <div key={p.id_barang} className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{p.nama_barang}</div>
                          <div className="text-[10px] text-slate-500">{p.type} • {p.kode_barang}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                            Sisa: {p.stok} pcs
                          </span>
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit Stok"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MANAJEMEN PRODUK */}
        {activeTab === 'products' && (
          <div className="p-6 space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Cari nama barang atau barcode..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Semua' ? 'Semua Kategori' : c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={openAddProduct}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Barcode</th>
                      <th className="py-3.5 px-4">Nama Barang</th>
                      <th className="py-3.5 px-4">Kategori / Type</th>
                      <th className="py-3.5 px-4 text-right">Harga (Rp)</th>
                      <th className="py-3.5 px-4 text-center">Stok</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500">
                          Tidak ada data produk yang ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id_barang} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                            {p.kode_barang}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {p.nama_barang}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {p.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                            Rp {parseFloat(p.harga).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.stok <= 5
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : p.stok <= 15
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                            >
                              {p.stok}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit Produk (Harga, Stok, dll)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DATA MEMBER */}
        {activeTab === 'members' && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Cari nama member, telepon, atau ID..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={openAddMember}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Member</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">ID Member</th>
                      <th className="py-3.5 px-4">Nama Lengkap</th>
                      <th className="py-3.5 px-4">Nomor Telepon</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Alamat</th>
                      <th className="py-3.5 px-4">Terdaftar Sejak</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-500">
                          Belum ada data member terdaftar
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m) => (
                        <tr key={m.id_member} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                            #{m.id_member}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {m.nama_member}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {m.nomor_telepon}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {m.email || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">
                            {m.alamat || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditMember(m)}
                                title="Edit member"
                                aria-label={`Edit member ${m.nama_member}`}
                                className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmMember(m)}
                                title="Hapus member"
                                aria-label={`Hapus member ${m.nama_member}`}
                                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Cari username atau ID akun..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={openAddStaff}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Petugas</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">ID Akun</th>
                      <th className="py-3.5 px-4">Username</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Terdaftar Sejak</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStaffAccounts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          {staffSearch ? 'Akun petugas tidak ditemukan' : 'Belum ada akun petugas'}
                        </td>
                      </tr>
                    ) : (
                      filteredStaffAccounts.map((account) => (
                        <tr key={account.id_user} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">#{account.id_user}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{account.username}</td>
                          <td className="py-3.5 px-4 text-slate-300">{account.role}</td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditStaff(account)}
                                title="Edit akun petugas"
                                aria-label={`Edit akun petugas ${account.username}`}
                                className="p-2 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmStaff(account)}
                                title="Hapus akun petugas"
                                aria-label={`Hapus akun petugas ${account.username}`}
                                className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: RIWAYAT TRANSAKSI */}
        {activeTab === 'transactions' && (
          <div className="p-6 space-y-5">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">No. Transaksi</th>
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Kasir / Petugas</th>
                      <th className="py-3.5 px-4">Pelanggan</th>
                      <th className="py-3.5 px-4 text-right">Total Belanja</th>
                      <th className="py-3.5 px-4 text-right">Pembayaran</th>
                      <th className="py-3.5 px-4 text-right">Kembalian</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-500">
                          Belum ada transaksi tercatat
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id_transaksi} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {t.no_transaksi}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(t.tanggal_transaksi).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-200">
                            {t.nama_petugas}
                          </td>
                          <td className="py-3.5 px-4">
                            {t.nama_member ? (
                              <span className="text-cyan-300 font-semibold">{t.nama_member}</span>
                            ) : (
                              <span className="text-slate-500 italic">Non-Member</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                            Rp {parseFloat(t.total).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-300">
                            Rp {parseFloat(t.pembayaran).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-teal-400">
                            Rp {parseFloat(t.kembalian).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => viewTransactionDetail(t.id_transaksi)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                            >
                              Lihat Struk
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: LAPORAN PENJUALAN */}
        {activeTab === 'reports' && (
          <div id="sales-report" className="report-print-area p-6 space-y-6">
            <div className="report-print-header hidden border-b-2 border-slate-300 pb-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-600">SuperPOS Supermarket</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">LAPORAN PENJUALAN</h2>
                  <p className="mt-1 text-sm text-slate-600">Rekapitulasi transaksi dan performa penjualan</p>
                </div>
                <div className="report-print-document-label">DOKUMEN INTERNAL</div>
              </div>
              <div className="report-print-metadata mt-4 grid grid-cols-3 gap-4 border-t border-slate-300 pt-3 text-xs">
                <div><span>Periode</span><strong>Seluruh transaksi tercatat</strong></div>
                <div><span>Tanggal cetak</span><strong>{reportsData?.generatedAt ? new Date(reportsData.generatedAt).toLocaleString('id-ID') : '-'}</strong></div>
                <div><span>Disusun oleh</span><strong>{currentUser?.username || 'Administrator'}</strong></div>
              </div>
            </div>

            <div className="report-no-print flex items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Laporan Penjualan Supermarket</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ringkasan omzet, metode pembayaran, dan performa kategori
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSalesReport}
                disabled={downloadingReport || !reportsData}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700 disabled:opacity-50 disabled:cursor-wait"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{downloadingReport ? 'Membuat PDF...' : 'Unduh PDF'}</span>
              </button>
            </div>

            <div className="report-section report-summary-grid grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Total Omzet', value: `Rp ${(reportsData?.summary?.total_pendapatan || 0).toLocaleString('id-ID')}` },
                { label: 'Transaksi', value: (reportsData?.summary?.total_transaksi || 0).toLocaleString('id-ID') },
                { label: 'Item Terjual', value: `${(reportsData?.summary?.total_item_terjual || 0).toLocaleString('id-ID')} pcs` },
                { label: 'Rata-rata Transaksi', value: `Rp ${(reportsData?.summary?.rata_rata_transaksi || 0).toLocaleString('id-ID')}` }
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-medium text-slate-400">{metric.label}</p>
                  <p className="mt-1 text-lg font-black text-white">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="report-section rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h4 className="mb-3 text-sm font-bold text-white">1. Ringkasan Metode Pembayaran</h4>
              <div className="overflow-x-auto">
                <table className="report-table w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3 text-right">Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportsData?.paymentMethodStats?.length ? reportsData.paymentMethodStats.map((method) => (
                      <tr key={method.metode_pembayaran}>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {method.metode_pembayaran === 'qris' ? 'QRIS' : method.metode_pembayaran === 'debit' ? 'Kartu Debit' : 'Cash'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{Number(method.total_transaksi).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">Rp {Number(method.total_omset).toLocaleString('id-ID')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="py-5 text-center text-slate-500">Belum ada data pembayaran</td></tr>
                    )}
                  </tbody>
                  {reportsData?.paymentMethodStats?.length > 0 && (
                    <tfoot>
                      <tr className="font-bold">
                        <td className="py-2.5 px-3">TOTAL</td>
                        <td className="py-2.5 px-3 text-right">{paymentMethodTotals.transactions.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right">Rp {paymentMethodTotals.revenue.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Performance by Category */}
            <div className="report-section bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>2. Performa Penjualan Berdasarkan Kategori</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="report-table w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Kategori Produk</th>
                      <th className="py-3 px-4 text-right">Transaksi</th>
                      <th className="py-3 px-4 text-right">Item Terjual</th>
                      <th className="py-3 px-4 text-right">Total Omset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportsData?.categoryStats?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500">
                          Belum ada transaksi kategori
                        </td>
                      </tr>
                    ) : (
                      reportsData?.categoryStats?.map((c) => (
                        <tr key={c.kategori} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-bold text-white">{c.kategori}</td>
                          <td className="py-3 px-4 text-right text-slate-300">{Number(c.frekuensi).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right font-bold text-cyan-300">{Number(c.total_terjual).toLocaleString('id-ID')} pcs</td>
                          <td className="py-3 px-4 text-right font-black text-emerald-400">
                            Rp {parseFloat(c.total_omset).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportsData?.categoryStats?.length > 0 && (
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan="2" className="py-3 px-4">TOTAL ITEM / OMZET</td>
                        <td className="py-3 px-4 text-right">{categoryTotals.items.toLocaleString('id-ID')} pcs</td>
                        <td className="py-3 px-4 text-right">Rp {categoryTotals.revenue.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="report-section bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h4 className="font-bold text-sm text-white mb-3">3. Penjualan Harian · 7 Hari Terakhir</h4>
              <div className="overflow-x-auto">
                <table className="report-table w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3 text-right">Transaksi</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportsData?.dailySales?.length ? reportsData.dailySales.map((day) => (
                      <tr key={day.tanggal}>
                        <td className="py-2.5 px-3 text-white">
                          {new Date(day.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{Number(day.transaksi_count).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">Rp {Number(day.total_omset).toLocaleString('id-ID')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="py-5 text-center text-slate-500">Belum ada transaksi dalam periode ini</td></tr>
                    )}
                  </tbody>
                  {reportsData?.dailySales?.length > 0 && (
                    <tfoot>
                      <tr className="font-bold">
                        <td className="py-2.5 px-3">TOTAL 7 HARI</td>
                        <td className="py-2.5 px-3 text-right">{dailySalesTotals.transactions.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right">Rp {dailySalesTotals.revenue.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="report-section bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h4 className="font-bold text-sm text-white mb-3">4. Lima Produk Terlaris</h4>
              <div className="overflow-x-auto">
                <table className="report-table w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-right">No.</th>
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Terjual</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportsData?.topProducts?.length ? reportsData.topProducts.map((product, index) => (
                      <tr key={product.id_barang}>
                        <td className="py-2.5 px-3 text-right">{index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold">{product.nama_barang}</td>
                        <td className="py-2.5 px-3">{product.type}</td>
                        <td className="py-2.5 px-3 text-right">{Number(product.terjual).toLocaleString('id-ID')} pcs</td>
                        <td className="py-2.5 px-3 text-right font-bold">Rp {Number(product.total_rupiah).toLocaleString('id-ID')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="py-5 text-center text-slate-500">Belum ada data produk</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-print-footer hidden border-t border-slate-300 pt-2 text-[10px] text-slate-500">
              Laporan dibuat dari data transaksi SuperPOS · {reportsData?.generatedAt ? new Date(reportsData.generatedAt).toLocaleString('id-ID') : ''}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Package className="w-5 h-5" />
                <span>{isEditingProduct ? 'Edit / Perbarui Produk' : 'Tambah Produk Baru'}</span>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Barcode *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.kode_barang}
                  onChange={(e) => setProductForm({ ...productForm, kode_barang: e.target.value })}
                  placeholder="Contoh: 8999999195047"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.nama_barang}
                  onChange={(e) => setProductForm({ ...productForm, nama_barang: e.target.value })}
                  placeholder="Contoh: Indomie Goreng Spesial 85g"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={productForm.harga}
                    onChange={(e) => setProductForm({ ...productForm, harga: e.target.value })}
                    placeholder="3500"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stok Barang *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stok}
                    onChange={(e) => setProductForm({ ...productForm, stok: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori / Type *
                </label>
                <select
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Snack">Snack</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  <option value="Kebutuhan Pribadi">Kebutuhan Pribadi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {isEditingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS PRODUK */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Hapus Produk?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus produk <strong className="text-white">"{deleteConfirmProduct.nama_barang}"</strong>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Hapus Akun Petugas?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Hapus akun <strong className="text-white">{deleteConfirmStaff.username}</strong>? Akun yang memiliki riwayat transaksi tidak dapat dihapus.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                disabled={deletingStaff}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={deletingStaff}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {deletingStaff ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MEMBER */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Users className="w-5 h-5" />
                <span>{editingMember ? 'Edit Data Member' : 'Tambah Member Baru'}</span>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={memberForm.nama_member}
                  onChange={(e) => setMemberForm({ ...memberForm, nama_member: e.target.value })}
                  placeholder="Nama member..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon *</label>
                <input
                  type="tel"
                  required
                  value={memberForm.nomor_telepon}
                  onChange={(e) => setMemberForm({ ...memberForm, nomor_telepon: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat</label>
                <textarea
                  rows="2"
                  value={memberForm.alamat}
                  onChange={(e) => setMemberForm({ ...memberForm, alamat: e.target.value })}
                  placeholder="Alamat domisili member..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Simpan Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span>Hapus Member?</span>
            </div>
            <p className="text-xs text-slate-300 mb-5">
              Hapus data <strong className="text-white">{deleteConfirmMember.nama_member}</strong>? Riwayat transaksi tetap tersimpan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                {editingStaff ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <span>{editingStaff ? 'Edit Akun Petugas' : 'Daftarkan Petugas Baru'}</span>
              </div>
              <button type="button" onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              {editingStaff ? 'Kosongkan password jika tidak ingin mengubahnya.' : 'Akun ini hanya mendapat akses ke layar kasir.'}
            </p>
            <form onSubmit={handleSaveStaff} className="mt-4 space-y-4">
              <div>
                <label htmlFor="staff-username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  id="staff-username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  placeholder="Contoh: kasir02"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  required={!editingStaff}
                  minLength={editingStaff && !staffForm.password ? undefined : 8}
                  autoComplete="new-password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder={editingStaff ? 'Kosongkan jika tetap sama' : 'Minimal 8 karakter'}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  {savingStaff ? 'Menyimpan...' : editingStaff ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL TRANSAKSI & STRUK VIEW */}
      {selectedTransactionDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Receipt className="w-5 h-5" />
                <span>Detail Transaksi #{selectedTransactionDetail.no_transaksi}</span>
              </div>
              <button
                onClick={() => setSelectedTransactionDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt */}
            <div className="bg-white text-slate-900 font-mono p-4 rounded-xl shadow-inner text-xs border border-slate-300 space-y-2 select-text my-4">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm">SUPERPOS SUPERMARKET</div>
                <div className="text-[10px] text-slate-600">Jl. Raya Utama No. 88, Telp: 021-5551234</div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>No. Trx:</span>
                  <span className="font-bold">{selectedTransactionDetail.no_transaksi}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(selectedTransactionDetail.tanggal_transaksi).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedTransactionDetail.nama_petugas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{selectedTransactionDetail.nama_member ? `${selectedTransactionDetail.nama_member} (Member)` : 'Non-Member'}</span>
                </div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-400">
                {selectedTransactionDetail.items?.map((item) => (
                  <div key={item.id_detail} className="text-[11px]">
                    <div className="font-medium text-slate-900">{item.nama_barang}</div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{item.jumlah} x Rp {parseFloat(item.harga).toLocaleString('id-ID')}</span>
                      <span className="font-semibold text-slate-900">Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs space-y-1 pt-1">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rp {parseFloat(selectedTransactionDetail.total).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>BAYAR:</span>
                  <span>Rp {parseFloat(selectedTransactionDetail.pembayaran).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>KEMBALIAN:</span>
                  <span>Rp {parseFloat(selectedTransactionDetail.kembalian).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTransactionDetail(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
