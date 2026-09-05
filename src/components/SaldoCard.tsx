import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { RingkasanKas, TipeTransaksi } from '../types';
import { formatRupiah, getNamaBulan } from '../utils/formatters';

interface SaldoCardProps {
  summary: RingkasanKas;
  onOpenInput: (type: TipeTransaksi) => void;
  onOpenScan: () => void;
}

export const SaldoCard: React.FC<SaldoCardProps> = ({
  summary,
  onOpenInput,
  onOpenScan,
}) => {
  const currentMonthName = getNamaBulan(new Date().getMonth() + 1);

  return (
    <div className="bg-[#0D0D0F] rounded-2xl shadow-md border border-zinc-800 overflow-hidden">
      {/* Primary Balance Section */}
      <div className="bg-gradient-to-br from-[#0D0D0F] via-zinc-900 to-black text-white p-5 sm:p-6 relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute -right-6 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-4 w-32 h-32 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Total Saldo Kas Saat Ini
            </span>
            <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Kas Aktif
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatRupiah(summary.totalSaldo)}
            </h2>
            <span className="text-xs text-zinc-400">
              Total {summary.jumlahTransaksi} transaksi tercatat
            </span>
          </div>

          {/* Monthly In/Out Quick Strip */}
          <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-400 font-medium truncate">
                  Uang Masuk ({currentMonthName})
                </p>
                <p className="text-sm sm:text-base font-bold text-emerald-400 truncate">
                  +{formatRupiah(summary.totalMasukBulanIni)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-400 font-medium truncate">
                  Uang Keluar ({currentMonthName})
                </p>
                <p className="text-sm sm:text-base font-bold text-rose-400 truncate">
                  -{formatRupiah(summary.totalKeluarBulanIni)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons for Bendahara */}
      <div className="p-4 sm:p-5 bg-zinc-900/60 border-t border-zinc-800">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Aksi Cepat Bendahara:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Scan Struk Button */}
          <button
            onClick={onOpenScan}
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all active:scale-98 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Bukti / Struk</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-sm ml-0.5">
              AI
            </span>
          </button>

          {/* Button Uang Masuk */}
          <button
            onClick={() => onOpenInput('masuk')}
            className="py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>+ Catat Uang Masuk</span>
          </button>

          {/* Button Uang Keluar */}
          <button
            onClick={() => onOpenInput('keluar')}
            className="py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-rose-500/30 hover:border-rose-500 text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
          >
            <MinusCircle className="w-4 h-4 text-rose-400" />
            <span>- Catat Uang Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
