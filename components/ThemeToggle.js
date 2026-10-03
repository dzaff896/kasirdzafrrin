'use client';

import { useTheme } from './ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className={`w-9 h-9 rounded-xl ${className}`} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
      aria-label="Toggle Theme"
      className={`p-2 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 border-slate-700 hover:border-amber-400/40 shadow-sm'
          : 'bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-500 rotate-0 hover:rotate-90" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-500 -rotate-12 hover:rotate-0" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Mode Terang' : 'Mode Gelap'}
        </span>
      )}
    </button>
  );
}
