import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TransaksiKas, Anggota } from '../types';
import {
  formatRupiah,
  formatTanggal,
  formatTanggalSingkat,
  getNamaBulan,
} from '../utils/formatters';

interface ReportViewProps {
  transactions: TransaksiKas[];
  members: Anggota[];
}

export const ReportView: React.FC<ReportViewProps> = ({ transactions, members }) => {
  const currentDate = new Date();
  const [reportMode, setReportMode] = useState<'bulanan' | 'harian' | 'semua'>('bulanan');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate.toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  // Available years from transactions
  const years = useMemo(() => {
    const ySet = new Set<number>([currentDate.getFullYear()]);
    transactions.forEach((t) => {
      if (t.tanggal) {
        ySet.add(new Date(t.tanggal).getFullYear());
      }
    });
    return Array.from(ySet).sort((a, b) => b - a);
  }, [transactions, currentDate]);

  // Filter transactions based on reportMode & selected dates
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'semua' && t.tipe !== filterType) return false;

      if (reportMode === 'harian') {
        return t.tanggal === selectedDate;
      }

      if (reportMode === 'bulanan') {
        if (!t.tanggal) return false;
        const d = new Date(t.tanggal);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      }

      return true; // 'semua'
    }).sort((a, b) => {
      // ascending for ledger calculation
      return new Date(a.tanggal + 'T' + (a.waktu || '00:00')).getTime() -
             new Date(b.tanggal + 'T' + (b.waktu || '00:00')).getTime();
    });
  }, [transactions, reportMode, selectedDate, selectedYear, selectedMonth, filterType]);

  // Calculate prior balance (saldo awal periode)
  const priorBalance = useMemo(() => {
    if (reportMode === 'semua') return 0;

    let total = 0;
    const isBefore = (t: TransaksiKas) => {
      if (reportMode === 'harian') {
        return t.tanggal < selectedDate;
      }
      if (reportMode === 'bulanan') {
        const d = new Date(t.tanggal);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return y < selectedYear || (y === selectedYear && m < selectedMonth);
      }
      return false;
    };

    transactions.forEach((t) => {
      if (isBefore(t)) {
        if (t.tipe === 'masuk') total += t.nominal;
        else total -= t.nominal;
      }
    });

    return total;
  }, [transactions, reportMode, selectedDate, selectedYear, selectedMonth]);

  // Totals for this period
  const { totalMasuk, totalKeluar } = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    filteredTxs.forEach((t) => {
      if (t.tipe === 'masuk') masuk += t.nominal;
      else keluar += t.nominal;
    });
    return { totalMasuk: masuk, totalKeluar: keluar };
  }, [filteredTxs]);

  const surplusDefisit = totalMasuk - totalKeluar;
  const saldoAkhir = priorBalance + surplusDefisit;

  // Running balance calculation for ledger table
  let currentRunning = priorBalance;
  const ledgerRows = filteredTxs.map((t, idx) => {
    if (t.tipe === 'masuk') {
      currentRunning += t.nominal;
    } else {
      currentRunning -= t.nominal;
    }
    return {
      no: idx + 1,
      ...t,
      runningSaldo: currentRunning,
    };
  });

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Waktu',
      'Tipe',
      'Kategori',
      'Judul Transaksi',
      'Pihak / Anggota / Toko',
      'Keterangan',
      'Uang Masuk (Rp)',
      'Uang Keluar (Rp)',
      'Saldo Berjalan (Rp)',
    ];

    const rows = ledgerRows.map((r) => [
      r.no,
      r.tanggal,
      r.waktu || '-',
      r.tipe === 'masuk' ? 'Uang Masuk' : 'Uang Keluar',
      `"${r.kategori.replace(/"/g, '""')}"`,
      `"${r.judul.replace(/"/g, '""')}"`,
      `"${(r.namaPihak || '').replace(/"/g, '""')}"`,
      `"${(r.keterangan || '').replace(/"/g, '""')}"`,
      r.tipe === 'masuk' ? r.nominal : 0,
      r.tipe === 'keluar' ? r.nominal : 0,
      r.runningSaldo,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const filename =
      reportMode === 'harian'
        ? `Laporan_Kas_Harian_${selectedDate}.csv`
        : reportMode === 'bulanan'
        ? `Laporan_Kas_Bulanan_${selectedYear}_${selectedMonth}.csv`
        : `Laporan_Kas_Kopdes_Semua.csv`;

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Filter and Control Bar (Hidden on print) */}
      <div className="bg-[#0D0D0F] rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-800 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Laporan Keuangan & Saldo Kas
            </h3>
            <p className="text-xs text-zinc-400">
              Pilih mode harian atau bulanan untuk merekap arus kas bendahara
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-zinc-700/80 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export Excel / CSV
            </button>
            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
            >
              <Printer className="w-4 h-4 text-white" />
              Cetak Laporan
            </button>
          </div>
        </div>

        {/* Period Selector Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Mode Periode
            </label>
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setReportMode('bulanan')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportMode === 'bulanan'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setReportMode('harian')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportMode === 'harian'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setReportMode('semua')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  reportMode === 'semua'
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Dynamic Date / Month Pickers */}
          {reportMode === 'bulanan' && (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Pilih Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-hidden focus:border-emerald-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-zinc-900 text-zinc-200">
                      {getNamaBulan(m)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Pilih Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-hidden focus:border-emerald-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-zinc-900 text-zinc-200">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportMode === 'harian' && (
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Pilih Tanggal Laporan
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="bg-[#0D0D0F] rounded-2xl p-4 sm:p-6 shadow-xs border border-zinc-800 space-y-6 print:bg-white print:border-none print:shadow-none print:p-0">
        {/* Printable Header (Visible on print & screen) */}
        <div className="border-b-2 border-zinc-700 pb-4 text-center print:border-black">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white print:text-black">
            BUKU KAS UMUM - KAS KOPDES
          </h2>
          <p className="text-xs text-zinc-400 font-medium print:text-zinc-700">
            Komunitas, Group & Perkumpulan Desa Mandiri
          </p>
          <div className="mt-2 text-xs font-bold text-zinc-200 bg-zinc-900 border border-zinc-700 inline-block px-3 py-1 rounded-md print:bg-zinc-100 print:text-black print:border-zinc-300">
            Periode:{' '}
            {reportMode === 'bulanan'
              ? `${getNamaBulan(selectedMonth)} ${selectedYear}`
              : reportMode === 'harian'
              ? formatTanggal(selectedDate)
              : 'Semua Transaksi Tercatat'}
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {reportMode !== 'semua' && (
            <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 print:bg-zinc-50 print:border-zinc-200">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate print:text-zinc-600">
                Saldo Awal Periode
              </span>
              <p className="text-sm sm:text-base font-extrabold text-zinc-100 mt-1 truncate print:text-black">
                {formatRupiah(priorBalance)}
              </p>
            </div>
          )}

          <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 print:bg-emerald-50 print:border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate flex items-center gap-1 print:text-emerald-700">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Total Penerimaan
            </span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-300 mt-1 truncate print:text-emerald-800">
              +{formatRupiah(totalMasuk)}
            </p>
          </div>

          <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/20 print:bg-rose-50 print:border-rose-200">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block truncate flex items-center gap-1 print:text-rose-700">
              <ArrowUpRight className="w-3.5 h-3.5" /> Total Pengeluaran
            </span>
            <p className="text-sm sm:text-base font-extrabold text-rose-300 mt-1 truncate print:text-rose-800">
              -{formatRupiah(totalKeluar)}
            </p>
          </div>

          <div className="p-3.5 bg-zinc-900 text-white rounded-xl border border-zinc-700 print:bg-zinc-900 print:text-white">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block truncate">
              Saldo Kas Akhir
            </span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1 truncate">
              {formatRupiah(saldoAkhir)}
            </p>
          </div>
        </div>

        {/* VISUAL CASH FLOW BAR COMPARISON */}
        {(totalMasuk > 0 || totalKeluar > 0) && (
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 print:hidden">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-zinc-400">Perbandingan Arus Kas Periode Ini</span>
              <span className="text-zinc-400">
                Surplus/Defisit:{' '}
                <strong
                  className={surplusDefisit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                >
                  {formatRupiah(surplusDefisit)}
                </strong>
              </span>
            </div>

            {/* Proportion Bar */}
            <div className="h-3.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              {totalMasuk + totalKeluar > 0 && (
                <>
                  <div
                    style={{
                      width: `${(totalMasuk / (totalMasuk + totalKeluar)) * 100}%`,
                    }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Penerimaan: ${formatRupiah(totalMasuk)}`}
                  />
                  <div
                    style={{
                      width: `${(totalKeluar / (totalMasuk + totalKeluar)) * 100}%`,
                    }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Pengeluaran: ${formatRupiah(totalKeluar)}`}
                  />
                </>
              )}
            </div>

            <div className="flex justify-between text-[11px] font-medium text-zinc-400 mt-1.5">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Uang Masuk (
                {Math.round((totalMasuk / (totalMasuk + totalKeluar || 1)) * 100)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Uang Keluar (
                {Math.round((totalKeluar / (totalMasuk + totalKeluar || 1)) * 100)}%)
              </span>
            </div>
          </div>
        )}

        {/* GENERAL LEDGER TABLE (Buku Kas Umum) */}
        <div className="overflow-x-auto border border-zinc-800 rounded-xl print:border-zinc-300">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-zinc-300 border-b border-zinc-800 uppercase font-bold text-[11px] print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 w-24">Tanggal</th>
                <th className="py-2.5 px-3">Uraian / Transaksi</th>
                <th className="py-2.5 px-3">Pihak / Toko</th>
                <th className="py-2.5 px-3 text-right">Penerimaan (Rp)</th>
                <th className="py-2.5 px-3 text-right">Pengeluaran (Rp)</th>
                <th className="py-2.5 px-3 text-right">Saldo Kas (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
              {/* Saldo awal row if applicable */}
              {reportMode !== 'semua' && (
                <tr className="bg-zinc-900/50 font-semibold text-zinc-400 italic print:bg-zinc-50 print:text-zinc-700">
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3" colSpan={2}>
                    Saldo Awal Periode
                  </td>
                  <td className="py-2 px-3 text-right">-</td>
                  <td className="py-2 px-3 text-right">-</td>
                  <td className="py-2 px-3 text-right font-bold text-zinc-100 print:text-black">
                    {formatRupiah(priorBalance)}
                  </td>
                </tr>
              )}

              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                ledgerRows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/60 transition-colors print:hover:bg-transparent">
                    <td className="py-2.5 px-3 text-center text-zinc-500 font-mono">
                      {r.no}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-zinc-300 font-medium print:text-black">
                      {formatTanggalSingkat(r.tanggal)}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-100 print:text-black">
                      <div className="font-semibold">{r.judul}</div>
                      <div className="text-[11px] text-zinc-400 print:text-zinc-600">
                        {r.kategori}
                        {r.keterangan ? ` • ${r.keterangan}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 print:text-black">
                      {r.namaPihak || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 whitespace-nowrap print:text-emerald-700">
                      {r.tipe === 'masuk' ? formatRupiah(r.nominal) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400 whitespace-nowrap print:text-rose-700">
                      {r.tipe === 'keluar' ? formatRupiah(r.nominal) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-zinc-100 whitespace-nowrap bg-zinc-900/40 print:text-black print:bg-zinc-50">
                      {formatRupiah(r.runningSaldo)}
                    </td>
                  </tr>
                ))
              )}

              {/* Total & Saldo Akhir Footer */}
              <tr className="bg-zinc-900 font-extrabold text-zinc-100 border-t-2 border-zinc-700 print:bg-zinc-100 print:text-black print:border-black">
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">
                  Total Mutasi & Saldo Akhir:
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 print:text-emerald-800">
                  {formatRupiah(totalMasuk)}
                </td>
                <td className="py-3 px-3 text-right text-rose-400 print:text-rose-800">
                  {formatRupiah(totalKeluar)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-300 bg-emerald-950/40 print:bg-emerald-50 print:text-black">
                  {formatRupiah(saldoAkhir)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SIGNATURE SECTION FOR OFFICIAL PRINT */}
        <div className="pt-8 border-t border-zinc-800 flex justify-between text-center text-xs print:border-black">
          <div>
            <p className="text-zinc-400 font-medium print:text-zinc-700">Mengetahui,</p>
            <p className="text-zinc-200 font-semibold print:text-black">Ketua Pengurus Komunitas / Koperasi</p>
            <div className="h-20 flex items-end justify-center">
              <div className="border-b border-zinc-600 w-36 print:border-black" />
            </div>
            <p className="font-bold text-zinc-100 mt-1 print:text-black">( ........................................ )</p>
          </div>

          <div>
            <p className="text-zinc-400 font-medium print:text-zinc-700">
              Tanggal: {formatTanggal(new Date().toISOString().split('T')[0])}
            </p>
            <p className="text-zinc-200 font-semibold print:text-black">Petugas Bendahara Kas</p>
            <div className="h-20 flex items-end justify-center">
              <div className="border-b border-zinc-600 w-36 print:border-black" />
            </div>
            <p className="font-bold text-zinc-100 mt-1 print:text-black">( Bendahara Kas Kopdes )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
