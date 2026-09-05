import React, { useState, useEffect } from 'react';
import {
  Wallet,
  BookOpen,
  Users,
  BarChart3,
  Camera,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  RefreshCw,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Anggota, RingkasanKas, TabunganTarget, TipeTransaksi, TransaksiKas } from './types';
import { Header } from './components/Header';
import { SaldoCard } from './components/SaldoCard';
import { TransactionList } from './components/TransactionList';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { TransactionModal } from './components/TransactionModal';
import { MemberManagement } from './components/MemberManagement';
import { ReportView } from './components/ReportView';
import { KwitansiModal } from './components/KwitansiModal';
import { TabunganView } from './components/TabunganView';
import { formatRupiah, getNamaBulan } from './utils/formatters';

export default function App() {
  const [activeTab, setActiveTab] = useState<'beranda' | 'transaksi' | 'tabungan' | 'anggota' | 'laporan'>('beranda');
  const [transactions, setTransactions] = useState<TransaksiKas[]>([]);
  const [members, setMembers] = useState<Anggota[]>([]);
  const [tabunganList, setTabunganList] = useState<TabunganTarget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [inputModalType, setInputModalType] = useState<TipeTransaksi>('masuk');
  const [editingTransaction, setEditingTransaction] = useState<TransaksiKas | null>(null);
  const [kwitansiTransaction, setKwitansiTransaction] = useState<TransaksiKas | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [txRes, mbrRes, tabRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/members'),
        fetch('/api/tabungan'),
      ]);

      if (!txRes.ok || !mbrRes.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const txData = await txRes.json();
      const mbrData = await mbrRes.json();
      setTransactions(txData);
      setMembers(mbrData);

      if (tabRes.ok) {
        const tabData = await tabRes.json();
        setTabunganList(tabData);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage('Terjadi kendala saat memuat data. Menggunakan penyimpanan lokal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live summary from transactions
  const summary: RingkasanKas = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalMasukBulanIni = 0;
    let totalKeluarBulanIni = 0;
    let totalMasukHariIni = 0;
    let totalKeluarHariIni = 0;

    for (const t of transactions) {
      const nom = Number(t.nominal) || 0;
      const tDate = t.tanggal ? new Date(t.tanggal) : new Date(t.createdAt);
      const isToday = t.tanggal === todayStr;
      const isThisMonth =
        tDate.getFullYear() === currentYear && tDate.getMonth() + 1 === currentMonth;

      if (t.tipe === 'masuk') {
        totalMasuk += nom;
        if (isToday) totalMasukHariIni += nom;
        if (isThisMonth) totalMasukBulanIni += nom;
      } else {
        totalKeluar += nom;
        if (isToday) totalKeluarHariIni += nom;
        if (isThisMonth) totalKeluarBulanIni += nom;
      }
    }

    return {
      totalSaldo: totalMasuk - totalKeluar,
      totalMasuk,
      totalKeluar,
      totalMasukBulanIni,
      totalKeluarBulanIni,
      totalMasukHariIni,
      totalKeluarHariIni,
      jumlahTransaksi: transactions.length,
      jumlahAnggotaAktif: members.filter((m) => m.status === 'aktif').length,
    };
  }, [transactions, members]);

  // Transaction handlers
  const handleSaveTransaction = async (txData: Partial<TransaksiKas>) => {
    if (txData.id) {
      // Update existing
      const res = await fetch(`/api/transactions/${txData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      });
      if (!res.ok) throw new Error('Gagal mengubah transaksi');
      const updated = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      // Create new
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      });
      if (!res.ok) throw new Error('Gagal menyimpan transaksi');
      const created = await res.json();
      setTransactions((prev) => [created, ...prev]);

      // If linked to member, refresh members list to sync their total deposits
      if (created.tipe === 'masuk' && created.anggotaId) {
        fetch('/api/members')
          .then((r) => r.json())
          .then((data) => setMembers(data))
          .catch(() => {});
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus transaksi');
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // Refresh members deposit
      fetch('/api/members')
        .then((r) => r.json())
        .then((data) => setMembers(data))
        .catch(() => {});
    } catch (err: any) {
      alert('Gagal menghapus transaksi: ' + err.message);
    }
  };

  // Member handlers
  const handleAddMember = async (newMember: Omit<Anggota, 'id'>) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember),
    });
    if (!res.ok) throw new Error('Gagal menambah anggota');
    const created = await res.json();
    setMembers((prev) => [...prev, created]);
  };

  const handleUpdateMember = async (id: string, updatedFields: Partial<Anggota>) => {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) throw new Error('Gagal mengupdate anggota');
    const updated = await res.json();
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const handleDeleteMember = async (id: string) => {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus anggota');
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const openInputModal = (type: TipeTransaksi) => {
    setInputModalType(type);
    setEditingTransaction(null);
    setIsInputModalOpen(true);
  };

  const openEditModal = (tx: TransaksiKas) => {
    setEditingTransaction(tx);
    setInputModalType(tx.tipe);
    setIsInputModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col font-sans text-zinc-300 pb-20 sm:pb-12">
      {/* Top App Bar & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScan={() => setIsScanModalOpen(true)}
        memberCount={members.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Error Notification if any */}
        {errorMessage && (
          <div className="bg-amber-950/40 border border-amber-800/60 text-amber-200 p-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        )}

        {/* TAB 1: BERANDA / DASHBOARD */}
        {activeTab === 'beranda' && (
          <div className="space-y-4">
            {/* Saldo Utama Card */}
            <SaldoCard
              summary={summary}
              onOpenInput={openInputModal}
              onOpenScan={() => setIsScanModalOpen(true)}
            />

            {/* Daily & Member Statistics Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-[#0D0D0F] p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Masuk Hari Ini
                </span>
                <p className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5 truncate">
                  +{formatRupiah(summary.totalMasukHariIni)}
                </p>
              </div>

              <div className="bg-[#0D0D0F] p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Keluar Hari Ini
                </span>
                <p className="text-base sm:text-lg font-extrabold text-rose-400 mt-0.5 truncate">
                  -{formatRupiah(summary.totalKeluarHariIni)}
                </p>
              </div>

              <div className="bg-[#0D0D0F] p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Anggota Aktif
                </span>
                <p className="text-base sm:text-lg font-extrabold text-zinc-100 mt-0.5">
                  {summary.jumlahAnggotaAktif} / {members.length}
                </p>
              </div>

              <div className="bg-[#0D0D0F] p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Total Transaksi
                </span>
                <p className="text-base sm:text-lg font-extrabold text-zinc-100 mt-0.5">
                  {summary.jumlahTransaksi} kali
                </p>
              </div>
            </div>

            {/* AI Scan Struk Feature Banner */}
            <div className="bg-gradient-to-br from-[#0D0D0F] via-zinc-900 to-emerald-950/40 rounded-2xl p-4 sm:p-5 text-white border border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>Fitur Unggulan: Scan Bukti & Struk AI</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      OTOMATIS
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Cukup upload atau foto bukti transfer bank anggota atau struk belanja toko.
                    Sistem otomatis mendeteksi apakah Uang Masuk atau Uang Keluar beserta nominal, tanggal, dan kategorinya.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsScanModalOpen(true)}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Mulai Scan Bukti
              </button>
            </div>

            {/* Tabungan Target Feature Banner */}
            <div className="bg-[#0D0D0F] rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">
                      Tabungan Target Perkumpulan
                    </h3>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      FITUR BARU
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Program aktif: <strong>Jalan Jalan ke Malang - Bromo</strong> (21 Anggota, Target Rp 1.800.000/orang, 12 Bulan). Pantau realisasi setoran &amp; <strong>Saldo Akhir Kekurangan</strong> secara real-time.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('tabungan')}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <span>Buka Tabungan Target</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Recent Transactions Section */}
            <div className="bg-[#0D0D0F] rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-zinc-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    Transaksi Kas Terbaru
                  </h3>
                  <p className="text-xs text-zinc-500">
                    5 catatan uang masuk dan keluar terakhir
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('transaksi')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Lihat Semua →
                </button>
              </div>

              <TransactionList
                transactions={transactions.slice(0, 5)}
                onEdit={openEditModal}
                onDelete={handleDeleteTransaction}
                onViewKwitansi={(tx) => setKwitansiTransaction(tx)}
                onOpenInput={openInputModal}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BUKU KAS / TRANSAKSI LENGKAP */}
        {activeTab === 'transaksi' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D0D0F] p-4 rounded-2xl border border-zinc-800">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Buku Kas Umum Kas Kopdes
                </h2>
                <p className="text-xs text-zinc-500">
                  Semua riwayat mutasi uang masuk dan uang keluar kas perkumpulan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan Struk
                </button>
                <button
                  onClick={() => openInputModal('masuk')}
                  className="py-2 px-3 rounded-xl bg-zinc-800/80 border border-emerald-500/30 text-emerald-400 hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  + Uang Masuk
                </button>
                <button
                  onClick={() => openInputModal('keluar')}
                  className="py-2 px-3 rounded-xl bg-zinc-800/80 border border-rose-500/30 text-rose-400 hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  - Uang Keluar
                </button>
              </div>
            </div>

            <TransactionList
              transactions={transactions}
              onEdit={openEditModal}
              onDelete={handleDeleteTransaction}
              onViewKwitansi={(tx) => setKwitansiTransaction(tx)}
              onOpenInput={openInputModal}
            />
          </div>
        )}

        {/* TAB 3: TABUNGAN TARGET & RENCANA */}
        {activeTab === 'tabungan' && (
          <TabunganView members={members} onRefreshKas={fetchData} />
        )}

        {/* TAB 4: KELOLA ANGGOTA / MEMBER */}
        {activeTab === 'anggota' && (
          <MemberManagement
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {/* TAB 5: LAPORAN BULANAN & HARIAN */}
        {activeTab === 'laporan' && (
          <ReportView transactions={transactions} members={members} />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Android style) */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0D0D0F]/95 backdrop-blur-md border-t border-zinc-800 py-1.5 px-2 z-30 sm:hidden shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center py-1 px-1.5 text-[9px] font-bold transition-colors ${
            activeTab === 'beranda' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex flex-col items-center py-1 px-1.5 text-[9px] font-bold transition-colors ${
            activeTab === 'transaksi' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Buku Kas</span>
        </button>

        <button
          onClick={() => setActiveTab('tabungan')}
          className={`flex flex-col items-center py-1 px-1.5 text-[9px] font-bold transition-colors ${
            activeTab === 'tabungan' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>Tabungan</span>
        </button>

        {/* Center Floating Scan Button */}
        <button
          onClick={() => setIsScanModalOpen(true)}
          className="w-10 h-10 -mt-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-[#0D0D0F] transition-transform active:scale-95 shrink-0"
          title="Scan Bukti Foto"
        >
          <Camera className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('anggota')}
          className={`flex flex-col items-center py-1 px-1.5 text-[9px] font-bold transition-colors ${
            activeTab === 'anggota' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Anggota</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex flex-col items-center py-1 px-1.5 text-[9px] font-bold transition-colors ${
            activeTab === 'laporan' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Laporan</span>
        </button>
      </div>

      {/* MODALS */}
      {/* 1. Scan Receipt AI Modal */}
      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSave={handleSaveTransaction}
        members={members}
      />

      {/* 2. Manual Input / Edit Modal */}
      <TransactionModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        members={members}
        initialType={inputModalType}
        editTransaction={editingTransaction}
      />

      {/* 3. Official Printable Kwitansi Kas Modal */}
      <KwitansiModal
        isOpen={Boolean(kwitansiTransaction)}
        onClose={() => setKwitansiTransaction(null)}
        transaction={kwitansiTransaction}
      />
    </div>
  );
}
