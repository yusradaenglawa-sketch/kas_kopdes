import React from 'react';
import {
  Wallet,
  BookOpen,
  Users,
  BarChart3,
  Sparkles,
  Camera,
  Calendar,
  Target,
} from 'lucide-react';
import { formatTanggal } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'beranda' | 'transaksi' | 'tabungan' | 'anggota' | 'laporan';
  setActiveTab: (tab: 'beranda' | 'transaksi' | 'tabungan' | 'anggota' | 'laporan') => void;
  onOpenScan: () => void;
  memberCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenScan,
  memberCount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D0F] text-zinc-100 border-b border-zinc-800 shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Kas Kopdes
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                BENDAHARA
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <span>Kas Komunitas & Perkumpulan Desa</span>
              <span className="text-zinc-600">•</span>
              <span className="hidden sm:inline">{memberCount} Anggota</span>
            </p>
          </div>
        </div>

        {/* Quick Scan Action & Date */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatTanggal(todayStr)}</span>
          </div>

          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Struk</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 border-t border-zinc-800">
        <nav className="flex items-center justify-between sm:justify-start sm:gap-2">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`flex-1 sm:flex-initial py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'beranda'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('transaksi')}
            className={`flex-1 sm:flex-initial py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'transaksi'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Buku Kas</span>
          </button>

          <button
            onClick={() => setActiveTab('tabungan')}
            className={`flex-1 sm:flex-initial py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tabungan'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Tabungan Target</span>
          </button>

          <button
            onClick={() => setActiveTab('anggota')}
            className={`flex-1 sm:flex-initial py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'anggota'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anggota ({memberCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex-1 sm:flex-initial py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'laporan'
                ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Laporan Kas</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
