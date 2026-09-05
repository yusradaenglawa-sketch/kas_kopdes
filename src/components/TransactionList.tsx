import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  Trash2,
  Edit2,
  Calendar,
  Eye,
  X,
  ExternalLink,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { TransaksiKas, TipeTransaksi } from '../types';
import { formatRupiah, formatTanggalSingkat } from '../utils/formatters';

interface TransactionListProps {
  transactions: TransaksiKas[];
  onEdit: (tx: TransaksiKas) => void;
  onDelete: (id: string) => void;
  onViewKwitansi: (tx: TransaksiKas) => void;
  onOpenInput: (type: TipeTransaksi) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onViewKwitansi,
  onOpenInput,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [txToDelete, setTxToDelete] = useState<TransaksiKas | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(transactions.map((t) => t.kategori))).filter(Boolean);

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    if (filterType !== 'semua' && tx.tipe !== filterType) return false;
    if (selectedCategory !== 'semua' && tx.kategori !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = tx.judul.toLowerCase().includes(term);
      const matchPihak = tx.namaPihak.toLowerCase().includes(term);
      const matchKet = tx.keterangan?.toLowerCase().includes(term);
      const matchKat = tx.kategori.toLowerCase().includes(term);
      const matchNominal = String(tx.nominal).includes(term);
      return matchTitle || matchPihak || matchKet || matchKat || matchNominal;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-[#0D0D0F] rounded-2xl p-4 shadow-xs border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari transaksi, anggota, toko, atau nominal..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl shrink-0 border border-zinc-800">
            <button
              onClick={() => setFilterType('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'semua'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('masuk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                filterType === 'masuk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Masuk
            </button>
            <button
              onClick={() => setFilterType('keluar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                filterType === 'keluar'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Category Pills if categories exist */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-zinc-400 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-500" /> Kategori:
            </span>
            <button
              onClick={() => setSelectedCategory('semua')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                selectedCategory === 'semua'
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((kat) => (
              <button
                key={kat}
                onClick={() => setSelectedCategory(kat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === kat
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-semibold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction List Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-[#0D0D0F] rounded-2xl p-8 text-center border border-zinc-800">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-300 text-sm">
              Tidak ada transaksi kas yang sesuai
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Coba ubah kata kunci pencarian atau filter yang Anda pilih
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenInput('masuk')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                + Catat Setoran
              </button>
              <button
                onClick={() => onOpenInput('keluar')}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                - Catat Belanja
              </button>
            </div>
          </div>
        ) : (
          filtered.map((tx) => {
            const isMasuk = tx.tipe === 'masuk';
            return (
              <div
                key={tx.id}
                className="bg-[#0D0D0F] rounded-2xl p-3.5 sm:p-4 border border-zinc-800 hover:border-zinc-700/80 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Icon, Title, Party & Metadata */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isMasuk
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isMasuk ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isMasuk
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isMasuk ? 'Uang Masuk' : 'Uang Keluar'}
                      </span>
                      <span className="text-[11px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                        {tx.kategori}
                      </span>
                      {tx.sumberInput === 'scan_ai' && (
                        <span className="text-[10px] font-semibold bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                          Scan AI
                        </span>
                      )}
                      {(tx.alokasiDana === 'tabungan_target' || tx.tabunganId) && (
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <Target className="w-3 h-3 text-amber-400" />
                          {tx.namaTabungan ? `Tabungan: ${tx.namaTabungan}` : 'Tabungan Target'}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-zinc-100 truncate">
                      {tx.judul}
                    </h4>

                    <p className="text-xs text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                      <span className="font-medium text-zinc-300">
                        {tx.namaPihak || (isMasuk ? 'Anggota' : 'Pihak Luar')}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span>{formatTanggalSingkat(tx.tanggal)}</span>
                      {tx.waktu && <span>{tx.waktu}</span>}
                    </p>

                    {tx.keterangan && (
                      <p className="text-[11px] text-zinc-500 italic line-clamp-1 mt-1">
                        "{tx.keterangan}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Nominal & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                  {/* Photo thumbnail button if exists */}
                  {tx.buktiFotoUrl && (
                    <button
                      onClick={() =>
                        setPreviewPhoto({
                          url: tx.buktiFotoUrl!,
                          title: tx.judul,
                        })
                      }
                      className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 hover:border-emerald-500 shadow-xs shrink-0 group/photo cursor-pointer"
                      title="Lihat foto bukti transfer / struk"
                    >
                      <img
                        src={tx.buktiFotoUrl}
                        alt="Bukti"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  )}

                  {/* Nominal Badge */}
                  <div className="text-right">
                    <p
                      className={`text-base sm:text-lg font-extrabold tracking-tight ${
                        isMasuk ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isMasuk ? '+' : '-'} {formatRupiah(tx.nominal)}
                    </p>
                  </div>

                  {/* Action Drop/Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onViewKwitansi(tx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Lihat / Cetak Kwitansi Resmi"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Transaksi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTxToDelete(tx)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-xl w-full bg-[#0D0D0F] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 text-zinc-200">
              <span className="font-semibold text-xs sm:text-sm truncate">
                Bukti Foto: {previewPhoto.title}
              </span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewPhoto.url}
                alt="Foto Bukti Struk"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Transaksi (Elegant Dark Dialog) */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0D0D0F] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Transaksi?</h4>
                <p className="text-xs text-zinc-400">Konfirmasi penghapusan kas</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p className="font-semibold text-white truncate">{txToDelete.judul}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Nominal:</span>
                <span
                  className={`font-bold ${
                    txToDelete.tipe === 'masuk' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {txToDelete.tipe === 'masuk' ? '+' : '-'} {formatRupiah(txToDelete.nominal)}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Transaksi ini akan dihapus dari buku kas dan saldo akan dihitung ulang secara otomatis.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
