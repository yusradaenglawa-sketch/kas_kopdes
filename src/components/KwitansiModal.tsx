import React from 'react';
import { X, Printer, CheckCircle, Download } from 'lucide-react';
import { TransaksiKas } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';

interface KwitansiModalProps {
  transaction: TransaksiKas | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to convert number to Indonesian words (terbilang)
function terbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  if (angka < 12) {
    return ' ' + bilangan[angka];
  } else if (angka < 20) {
    return terbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    return terbilang(Math.floor(angka / 10)) + ' Puluh' + terbilang(angka % 10);
  } else if (angka < 200) {
    return ' Seratus' + terbilang(angka - 100);
  } else if (angka < 1000) {
    return terbilang(Math.floor(angka / 100)) + ' Ratus' + terbilang(angka % 100);
  } else if (angka < 2000) {
    return ' Seribu' + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    return terbilang(Math.floor(angka / 1000)) + ' Ribu' + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    return terbilang(Math.floor(angka / 1000000)) + ' Juta' + terbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    return terbilang(Math.floor(angka / 1000000000)) + ' Milyar' + terbilang(angka % 1000000000);
  }
  return '';
}

export const KwitansiModal: React.FC<KwitansiModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const kwitansiNo = `KW-${transaction.tanggal.replace(/-/g, '')}-${transaction.id.slice(-4).toUpperCase()}`;
  const kalimatTerbilang = terbilang(transaction.nominal).trim() + ' Rupiah';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0D0D0F] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden my-auto print:border-none print:shadow-none print:bg-white">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-black text-white border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Bukti Kuitansi Kas Kopdes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-6 sm:p-8 bg-zinc-900/50 border border-zinc-800 m-4 rounded-xl text-zinc-100 print:bg-white print:border-4 print:border-double print:border-black print:m-0 print:text-black">
          {/* Header Kopdes */}
          <div className="border-b-2 border-zinc-700 pb-3 mb-4 text-center print:border-black">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white print:text-black">
              KAS KOPDES - KOPERASI & PERKUMPULAN DESA
            </h2>
            <p className="text-xs text-zinc-400 font-medium print:text-zinc-700">
              Sistem Pembukuan Kas Komunitas & Pengelolaan Keuangan Warga
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-zinc-800 rounded-md border border-zinc-700 text-[11px] font-mono font-bold text-zinc-200 print:bg-zinc-100 print:text-black print:border-zinc-300">
              {transaction.tipe === 'masuk' ? 'KWITANSI PENERIMAAN KAS' : 'BUKTI PENGELUARAN KAS'}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mb-4 text-zinc-400 print:text-zinc-600">
            <span>No: <strong className="text-zinc-100 font-mono print:text-black">{kwitansiNo}</strong></span>
            <span>Tanggal: <strong className="text-zinc-100 print:text-black">{formatTanggal(transaction.tanggal)}</strong></span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 border-b border-zinc-800 print:border-zinc-200">
              <span className="w-36 text-zinc-400 font-semibold shrink-0 print:text-zinc-600">
                {transaction.tipe === 'masuk' ? 'Telah Terima Dari' : 'Dibayarkan Kepada'}
              </span>
              <span className="font-bold text-zinc-100 text-sm sm:text-base print:text-black">
                : {transaction.namaPihak || (transaction.tipe === 'masuk' ? 'Anggota' : 'Pihak Terkait')}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 border-b border-zinc-800 print:border-zinc-200">
              <span className="w-36 text-zinc-400 font-semibold shrink-0 print:text-zinc-600">
                Uang Sejumlah
              </span>
              <span className="font-bold italic text-zinc-200 bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700 flex-1 print:bg-zinc-100 print:text-black print:border-zinc-300">
                # {kalimatTerbilang} #
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 border-b border-zinc-800 print:border-zinc-200">
              <span className="w-36 text-zinc-400 font-semibold shrink-0 print:text-zinc-600">
                Untuk Keperluan
              </span>
              <span className="font-medium text-zinc-200 flex-1 print:text-black">
                : {transaction.judul} ({transaction.kategori})
              </span>
            </div>

            {(transaction.alokasiDana === 'tabungan_target' || transaction.namaTabungan) && (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 border-b border-zinc-800 print:border-zinc-200">
                <span className="w-36 text-zinc-400 font-semibold shrink-0 print:text-zinc-600">
                  Alokasi Dana
                </span>
                <span className="font-semibold text-amber-300 text-xs sm:text-sm flex-1 print:text-amber-900">
                  : Tabungan Target {transaction.namaTabungan ? `(${transaction.namaTabungan})` : ''}
                </span>
              </div>
            )}

            {transaction.keterangan && (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-1.5 border-b border-zinc-800 print:border-zinc-200">
                <span className="w-36 text-zinc-400 font-semibold shrink-0 print:text-zinc-600">
                  Catatan / Keterangan
                </span>
                <span className="text-zinc-300 text-xs flex-1 print:text-zinc-800">
                  : {transaction.keterangan}
                </span>
              </div>
            )}
          </div>

          {/* Nominal Box & Signatures */}
          <div className="mt-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="inline-block p-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl text-emerald-300 print:bg-emerald-50 print:border-emerald-600 print:text-emerald-950">
              <span className="text-[10px] uppercase font-bold tracking-wider block text-emerald-400 print:text-emerald-800">
                Jumlah Terbilang:
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400 print:text-emerald-900">
                {formatRupiah(transaction.nominal)}
              </span>
            </div>

            <div className="flex justify-between sm:justify-end gap-8 text-center text-xs">
              <div>
                <p className="text-zinc-400 font-medium print:text-zinc-600">Yang Menyerahkan,</p>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-zinc-600 w-28 print:border-black" />
                </div>
                <p className="font-bold text-zinc-200 mt-1 print:text-black">
                  ( {transaction.tipe === 'masuk' ? transaction.namaPihak : 'Bendahara Kas'} )
                </p>
              </div>

              <div>
                <p className="text-zinc-400 font-medium print:text-zinc-600">
                  {transaction.tipe === 'masuk' ? 'Bendahara Kas Kopdes,' : 'Penerima Pembayaran,'}
                </p>
                <div className="h-16 flex items-end justify-center">
                  <div className="border-b border-zinc-600 w-28 print:border-black" />
                </div>
                <p className="font-bold text-zinc-200 mt-1 print:text-black">
                  ( {transaction.tipe === 'masuk' ? 'Bendahara Desa' : transaction.namaPihak} )
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
