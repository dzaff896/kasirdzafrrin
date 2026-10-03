'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import Toast from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      addToast('Harap masukkan username dan password', 'warning');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addToast(data.message || 'Login gagal, periksa username dan password', 'error');
        setLoading(false);
        return;
      }

      addToast(`Selamat datang, ${data.user.username}! Mengalihkan ke ${data.user.role === 'Admin' ? 'Dashboard Admin' : 'Halaman Kasir'}...`, 'success');

      setTimeout(() => {
        router.push(data.redirect);
        router.refresh();
      }, 700);
    } catch (err) {
      addToast('Terjadi kesalahan koneksi ke server atau database', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-slate-950 relative overflow-x-hidden select-none">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle showLabel={true} />
      </div>

      {/* Animated Lively Floating Orbs in Background */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 bg-emerald-500/20 rounded-full animate-float-slow animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-28 w-[420px] h-[420px] bg-teal-500/20 rounded-full animate-float-reverse animate-pulse-glow pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-cyan-600/15 rounded-full animate-float-slow pointer-events-none blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full animate-float-reverse pointer-events-none blur-3xl" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Animated Brand Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-70 animate-pulse pointer-events-none" />
            <div className="relative inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 shadow-2xl text-slate-950 transition-transform duration-500 hover:scale-105 hover:rotate-3 cursor-default">
              <ShoppingBag className="w-9 h-9 text-slate-950 stroke-[2.2]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Sistem Kasir Aktif & Siap Digunakan</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            SuperPOS Modern
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Terminal POS Supermarket &bull; MySQL phpMyAdmin
          </p>
        </div>

        {/* Interactive Glassmorphism Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl shadow-black/70 border border-slate-700/60 transition-all duration-300 hover:border-slate-600/80">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                ID / Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username anda"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-transparent transition-all shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password anda"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-transparent transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl shadow-xl shadow-emerald-500/30 transition-all duration-300 transform active:scale-98 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>MASUK KE SISTEM</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <section
            aria-label="Informasi akun"
            className="mt-6 border-t border-slate-700/60 pt-5 select-text"
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Akun untuk masuk
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUsername('marcha');
                  setPassword('petugas123');
                }}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 p-3 text-left transition hover:border-emerald-500/60 hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 cursor-pointer"
                aria-label="Isi username dan password akun kasir"
              >
                <h3 className="text-sm font-semibold text-emerald-300 mb-2">Akun Kasir</h3>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Username</dt>
                    <dd className="font-mono text-slate-200">marcha</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Password</dt>
                    <dd className="font-mono text-slate-200">petugas123</dd>
                  </div>
                </dl>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 p-3 text-left transition hover:border-cyan-500/60 hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/70 cursor-pointer"
                aria-label="Isi username dan password akun admin"
              >
                <h3 className="text-sm font-semibold text-cyan-300 mb-2">Akun Admin</h3>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Username</dt>
                    <dd className="font-mono text-slate-200">admin</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-400">Password</dt>
                    <dd className="font-mono text-slate-200">admin123</dd>
                  </div>
                </dl>
              </button>
            </div>
          </section>

        </div>

        {/* Database indicator */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>MySQL Database: <strong className="text-emerald-400 font-mono">kasir_db</strong></span>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
