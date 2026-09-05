import React, { useState, useEffect } from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  Camera,
  Upload,
  X,
  ChevronRight,
  Info,
  Sparkles,
  Calculator,
  Receipt,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { Anggota, SetoranTabungan, TabunganTarget } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';

interface TabunganViewProps {
  members: Anggota[];
  onRefreshKas?: () => void;
}

export const TabunganView: React.FC<TabunganViewProps> = ({ members, onRefreshKas }) => {
  const [tabunganList, setTabunganList] = useState<TabunganTarget[]>([]);
  const [selectedTabunganId, setSelectedTabunganId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Deletion modals state
  const [tabunganToDelete, setTabunganToDelete] = useState<{ id: string; namaTujuan: string } | null>(null);
  const [setoranToDelete, setSetoranToDelete] = useState<any | null>(null);
  const [isDeletingTabungan, setIsDeletingTabungan] = useState<boolean>(false);
  const [isDeletingSetoran, setIsDeletingSetoran] = useState<boolean>(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingTabungan, setEditingTabungan] = useState<TabunganTarget | null>(null);

  const [isSetoranModalOpen, setIsSetoranModalOpen] = useState<boolean>(false);
  const [preselectedMemberId, setPreselectedMemberId] = useState<string>('');

  // Form states for New / Edit Tabungan
  const [tujuan, setTujuan] = useState<string>('');
  const [targetPerOrang, setTargetPerOrang] = useState<string>('5000000');
  const [targetWaktuBulan, setTargetWaktuBulan] = useState<string>('10');
  const [minimalSetoran, setMinimalSetoran] = useState<string>('500000');
  const [tanggalMulai, setTanggalMulai] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states for Setoran
  const [setoranAnggotaId, setSetoranAnggotaId] = useState<string>('');
  const [setoranNominal, setSetoranNominal] = useState<string>('');
  const [setoranTanggal, setSetoranTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [setoranCatatan, setSetoranCatatan] = useState<string>('');
  const [setoranCatatKeKas, setSetoranCatatKeKas] = useState<boolean>(true);
  const [setoranBuktiUrl, setSetoranBuktiUrl] = useState<string | null>(null);
  const [setoranSaving, setSetoranSaving] = useState<boolean>(false);

  // Fetch list of tabungan
  const fetchTabunganList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tabungan');
      if (res.ok) {
        const data = await res.json();
        setTabunganList(data);
        // Default select the first tabungan if available and none selected
        if (!selectedTabunganId && data.length > 0) {
          setSelectedTabunganId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tabungan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch detail for selected tabungan
  const fetchTabunganDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`/api/tabungan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch tabungan detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTabunganList();
  }, []);

  useEffect(() => {
    if (selectedTabunganId) {
      fetchTabunganDetail(selectedTabunganId);
    } else {
      setSelectedDetail(null);
    }
  }, [selectedTabunganId]);

  // Open Form Modal (Add / Edit)
  const handleOpenCreate = () => {
    setEditingTabungan(null);
    setTujuan('Jalan-jalan ke Lembang');
    setTargetPerOrang('5000000');
    setTargetWaktuBulan('10');
    setMinimalSetoran('500000');
    setTanggalMulai(new Date().toISOString().split('T')[0]);
    setDeskripsi('Tabungan bersama anggota perkumpulan untuk kegiatan wisata & silaturahmi.');
    setSelectedMemberIds(members.filter((m) => m.status === 'aktif').map((m) => m.id));
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (tab: TabunganTarget) => {
    setEditingTabungan(tab);
    setTujuan(tab.tujuan);
    setTargetPerOrang(String(tab.targetPerOrang));
    setTargetWaktuBulan(String(tab.targetWaktuBulan || 10));
    setMinimalSetoran(String(tab.minimalSetoran || 0));
    setTanggalMulai(tab.tanggalMulai || new Date().toISOString().split('T')[0]);
    setDeskripsi(tab.deskripsi || '');
    setSelectedMemberIds(tab.anggotaIds || []);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Save Tabungan Target
  const handleSaveTabungan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tujuan.trim()) {
      setFormError('Tujuan tabungan wajib diisi');
      return;
    }
    const targetNom = Number(targetPerOrang);
    if (!targetNom || targetNom <= 0) {
      setFormError('Target setoran per orang harus lebih dari 0');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setFormError('Pilih minimal 1 anggota peserta tabungan');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      tujuan: tujuan.trim(),
      deskripsi: deskripsi.trim(),
      targetPerOrang: targetNom,
      targetWaktuBulan: Number(targetWaktuBulan) || 10,
      minimalSetoran: Number(minimalSetoran) || 0,
      tanggalMulai,
      anggotaIds: selectedMemberIds,
    };

    try {
      let res;
      if (editingTabungan) {
        res = await fetch(`/api/tabungan/${editingTabungan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/tabungan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan program tabungan');
      }

      const saved = await res.json();
      setIsFormModalOpen(false);
      await fetchTabunganList();
      setSelectedTabunganId(saved.id);
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Tabungan
  const handleDeleteTabungan = (id: string, namaTujuan: string) => {
    setTabunganToDelete({ id, namaTujuan });
  };

  const handleConfirmDeleteTabungan = async () => {
    if (!tabunganToDelete) return;
    setIsDeletingTabungan(true);
    try {
      const res = await fetch(`/api/tabungan/${tabunganToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus program tabungan');
      setSelectedTabunganId(null);
      setTabunganToDelete(null);
      await fetchTabunganList();
    } catch (err: any) {
      console.error('Gagal:', err);
    } finally {
      setIsDeletingTabungan(false);
    }
  };

  // Open Setoran Modal
  const handleOpenSetoran = (memberId?: string) => {
    const activeTab = selectedDetail;
    const targetMemberId = memberId || (activeTab?.anggotaIds?.[0] ?? '');
    setSetoranAnggotaId(targetMemberId);

    // Default nominal to minimalSetoran or remaining shortage
    if (activeTab) {
      const mProg = activeTab.pesertaProgress?.find((p: any) => p.anggotaId === targetMemberId);
      if (mProg && mProg.saldoAkhirKekurangan > 0) {
        const suggestion = activeTab.minimalSetoran > 0
          ? Math.min(activeTab.minimalSetoran, mProg.saldoAkhirKekurangan)
          : mProg.saldoAkhirKekurangan;
        setSetoranNominal(String(suggestion));
      } else if (activeTab.minimalSetoran > 0) {
        setSetoranNominal(String(activeTab.minimalSetoran));
      } else {
        setSetoranNominal('500000');
      }
    } else {
      setSetoranNominal('500000');
    }

    setSetoranTanggal(new Date().toISOString().split('T')[0]);
    setSetoranCatatan('');
    setSetoranCatatKeKas(true);
    setSetoranBuktiUrl(null);
    setIsSetoranModalOpen(true);
  };

  // Save Setoran
  const handleSaveSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTabunganId) return;

    if (!setoranAnggotaId) {
      alert('Pilih anggota penyetor');
      return;
    }
    const nom = Number(setoranNominal);
    if (!nom || nom <= 0) {
      alert('Nominal setoran harus lebih dari 0');
      return;
    }

    setSetoranSaving(true);
    try {
      const res = await fetch(`/api/tabungan/${selectedTabunganId}/setoran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anggotaId: setoranAnggotaId,
          nominal: nom,
          tanggal: setoranTanggal,
          catatan: setoranCatatan,
          buktiFotoUrl: setoranBuktiUrl || undefined,
          catatKeBukuKas: setoranCatatKeKas,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan setoran tabungan');
      }

      setIsSetoranModalOpen(false);
      // Refresh details & list
      await fetchTabunganDetail(selectedTabunganId);
      await fetchTabunganList();
      if (onRefreshKas) onRefreshKas();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setSetoranSaving(false);
    }
  };

  // Delete a specific deposit
  const handleDeleteSetoran = (st: any) => {
    setSetoranToDelete(st);
  };

  const handleConfirmDeleteSetoran = async () => {
    if (!setoranToDelete || !selectedTabunganId) return;
    setIsDeletingSetoran(true);
    try {
      const res = await fetch(
        `/api/tabungan/${selectedTabunganId}/setoran/${setoranToDelete.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Gagal menghapus setoran');
      setSetoranToDelete(null);
      await fetchTabunganDetail(selectedTabunganId);
      await fetchTabunganList();
      if (onRefreshKas) onRefreshKas();
    } catch (err: any) {
      console.error('Gagal:', err);
    } finally {
      setIsDeletingSetoran(false);
    }
  };

  // Helper toggle member in selection
  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAllActiveMembers = () => {
    setSelectedMemberIds(members.filter((m) => m.status === 'aktif').map((m) => m.id));
  };

  // Current selected participant stats
  const activeTabDetail = selectedDetail;
  const currentMemberProg = activeTabDetail?.pesertaProgress?.find(
    (p: any) => p.anggotaId === setoranAnggotaId
  );

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="bg-[#0D0D0F] p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Tabungan Rencana & Target Kas
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                FITUR TARGET
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Buat tabungan untuk tujuan tertentu dengan target setoran per orang, target waktu terkumpul,
              minimal setoran, dan pemantauan otomatis <strong>Saldo Akhir Kekurangan</strong> hingga target tercapai.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Tabungan Baru
        </button>
      </div>

      {/* Program Selector Tabs / Cards Grid if multiple programs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-emerald-400" />
            Daftar Program Tabungan Aktif ({tabunganList.length})
          </h3>
          {tabunganList.length > 0 && (
            <span className="text-[11px] text-zinc-500">
              Klik kartu untuk melihat rincian progres & catat setoran
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 bg-[#0D0D0F] rounded-2xl border border-zinc-800 text-center text-xs text-zinc-400">
            Memuat data tabungan...
          </div>
        ) : tabunganList.length === 0 ? (
          <div className="p-8 bg-[#0D0D0F] rounded-2xl border border-zinc-800 text-center space-y-3">
            <Target className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">Belum Ada Program Tabungan</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Contoh: Tabungan Jalan-jalan ke Lembang dengan target Rp 5.000.000 / orang dalam 10 bulan.
            </p>
            <button
              onClick={handleOpenCreate}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Tabungan Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tabunganList.map((tab) => {
              const isSelected = selectedTabunganId === tab.id;
              const persentase = tab.persentaseTerkumpul || 0;
              const isLunas = (tab.saldoAkhirKekurangan || 0) <= 0;

              return (
                <div
                  key={tab.id}
                  onClick={() => setSelectedTabunganId(tab.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-900 border-emerald-500/70 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#0D0D0F] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Target {tab.targetWaktuBulan} Bulan
                        </span>
                        <h4 className="font-extrabold text-base text-white mt-0.5 line-clamp-1">
                          {tab.tujuan}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isLunas
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {isLunas ? 'TERCAPAI' : `${persentase}%`}
                      </span>
                    </div>

                    {tab.deskripsi && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{tab.deskripsi}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, persentase)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Terkumpul: {formatRupiah(tab.totalTerkumpul || 0)}</span>
                        <span>Target: {formatRupiah(tab.totalTargetKeseluruhan || 0)}</span>
                      </div>
                    </div>

                    {/* SALDO AKHIR KEKURANGAN BOX */}
                    <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 mt-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Saldo Akhir Kekurangan:
                        </span>
                        <span className="text-xs font-black text-rose-400">
                          {formatRupiah(tab.saldoAkhirKekurangan || 0)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Target setoran / orang: <strong>{formatRupiah(tab.targetPerOrang)}</strong> ({tab.jumlahPeserta} peserta)
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {tab.jumlahPeserta} Anggota
                    </span>
                    <span className="flex items-center gap-1 hover:underline">
                      Lihat Rincian <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED VIEW FOR SELECTED TABUNGAN */}
      {selectedTabunganId && (
        <div className="space-y-4 pt-2">
          {isDetailLoading ? (
            <div className="p-8 bg-[#0D0D0F] rounded-2xl border border-zinc-800 text-center text-xs text-zinc-400">
              Memuat rincian tabungan...
            </div>
          ) : activeTabDetail ? (
            <div className="bg-[#0D0D0F] rounded-2xl border border-zinc-800 p-4 sm:p-6 shadow-xs space-y-6">
              {/* Detail Header with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                      Program Tabungan
                    </span>
                    <span className="text-xs text-zinc-500">
                      Mulai: {formatTanggal(activeTabDetail.tanggalMulai)}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {activeTabDetail.tujuan}
                  </h3>
                  {activeTabDetail.deskripsi && (
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      {activeTabDetail.deskripsi}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(activeTabDetail)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                    title="Edit Program"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteTabungan(activeTabDetail.id, activeTabDetail.tujuan)
                    }
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                    title="Hapus Program"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                  <button
                    onClick={() => handleOpenSetoran()}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Catat Setoran
                  </button>
                </div>
              </div>

              {/* CORE METRICS HIGHLIGHT (Includes the formula requested by user) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Target Setoran per Orang */}
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Target Setoran / Orang
                  </span>
                  <p className="text-xl font-black text-white mt-1">
                    {formatRupiah(activeTabDetail.targetPerOrang)}
                  </p>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Target: <strong>{activeTabDetail.targetWaktuBulan} Bulan</strong></span>
                  </div>
                  {activeTabDetail.minimalSetoran > 0 && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Minimal setoran anjuran: {formatRupiah(activeTabDetail.minimalSetoran)}
                    </p>
                  )}
                </div>

                {/* 2. Total Target Keseluruhan */}
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Total Target Keseluruhan
                  </span>
                  <p className="text-xl font-black text-zinc-100 mt-1">
                    {formatRupiah(activeTabDetail.totalTargetKeseluruhan)}
                  </p>
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{activeTabDetail.jumlahPeserta} Peserta Anggota</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    ({activeTabDetail.jumlahPeserta} org × {formatRupiah(activeTabDetail.targetPerOrang)})
                  </p>
                </div>

                {/* 3. Tabungan / Setoran yang Sudah Terkumpul */}
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Sudah Terkumpul
                  </span>
                  <p className="text-xl font-black text-emerald-400 mt-1">
                    +{formatRupiah(activeTabDetail.totalTerkumpul)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Progres: {activeTabDetail.persentaseTerkumpul}%</span>
                    <span>{activeTabDetail.setoranCount} kali setor</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${activeTabDetail.persentaseTerkumpul}%` }}
                    />
                  </div>
                </div>

                {/* 4. SALDO AKHIR (TARGET SETORAN DIKURANG TABUNGAN TERKUMPUL) */}
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/40 p-4 rounded-2xl border-2 border-rose-500/40 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/5 rounded-full pointer-events-none" />
                  <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                    Saldo Akhir Kekurangan
                  </span>
                  <p className="text-xl font-black text-rose-400 mt-1">
                    {formatRupiah(activeTabDetail.saldoAkhirKekurangan)}
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-300 leading-tight">
                    <span className="font-semibold text-rose-300">
                      Formula Saldo Akhir:
                    </span>
                    <br />
                    Target ({formatRupiah(activeTabDetail.totalTargetKeseluruhan)}) - Terkumpul ({formatRupiah(activeTabDetail.totalTerkumpul)})
                  </div>
                </div>
              </div>

              {/* Rencana & Simulasi Kalkulator Ringan */}
              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      Rekomendasi Setoran per Bulan:
                    </span>
                    <span className="text-zinc-400">
                      {formatRupiah(
                        Math.round(
                          activeTabDetail.targetPerOrang /
                            (activeTabDetail.targetWaktuBulan || 1)
                        )
                      )}{' '}
                      / orang / bulan (selama {activeTabDetail.targetWaktuBulan} bulan agar target tercapai)
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-zinc-400 block">Status Pencapaian:</span>
                  <span
                    className={`font-extrabold ${
                      activeTabDetail.saldoAkhirKekurangan === 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {activeTabDetail.saldoAkhirKekurangan === 0
                      ? 'LUNAS & TERCAPAI PENUH'
                      : `Kurang ${formatRupiah(activeTabDetail.saldoAkhirKekurangan)}`}
                  </span>
                </div>
              </div>

              {/* TABEL PROGRES SETORAN PER ANGGOTA PESERTA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Progres Setoran per Anggota Peserta ({activeTabDetail.pesertaProgress?.length || 0})
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Pantau kekurangan tiap anggota
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-3.5">No. Anggota</th>
                        <th className="py-3 px-3.5">Nama Peserta</th>
                        <th className="py-3 px-3.5 text-right">Target / Orang</th>
                        <th className="py-3 px-3.5 text-right">Sudah Disetor</th>
                        <th className="py-3 px-3.5 text-right">Saldo Kekurangan</th>
                        <th className="py-3 px-3.5 text-center">Progres</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-[#0D0D0F]">
                      {activeTabDetail.pesertaProgress?.map((p: any) => {
                        const isMemberLunas = p.isLunas || p.saldoAkhirKekurangan <= 0;
                        return (
                          <tr key={p.anggotaId} className="hover:bg-zinc-900/50 transition-colors">
                            <td className="py-3 px-3.5 font-mono text-zinc-400">
                              {p.nomorAnggota}
                            </td>
                            <td className="py-3 px-3.5 font-bold text-white">
                              {p.nama}
                            </td>
                            <td className="py-3 px-3.5 text-right font-medium text-zinc-300">
                              {formatRupiah(p.targetPerOrang)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-bold text-emerald-400">
                              {formatRupiah(p.totalDisetor)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-extrabold text-rose-400">
                              {formatRupiah(p.saldoAkhirKekurangan)}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <div className="w-20 mx-auto space-y-1">
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isMemberLunas ? 'bg-emerald-500' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${Math.min(100, p.persentase)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-zinc-400 font-bold block">
                                  {p.persentase}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                                  isMemberLunas
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {isMemberLunas ? 'LUNAS' : 'MENABUNG'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <button
                                onClick={() => handleOpenSetoran(p.anggotaId)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                Setor
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIWAYAT MUTASI SETORAN TABUNGAN */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    Riwayat Mutasi Setoran Tabungan Ini
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Total {activeTabDetail.setoranCount || 0} setoran tercatat
                  </span>
                </div>

                {(!activeTabDetail.pesertaProgress ||
                  activeTabDetail.setoranCount === 0) ? (
                  <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                    Belum ada riwayat setoran untuk tabungan ini. Klik tombol <strong>Catat Setoran</strong> untuk mulai mengumpulkan dana tabungan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTabDetail.pesertaProgress
                      .flatMap((p: any) => p.setoranHistory || [])
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                      )
                      .map((st: SetoranTabungan) => (
                        <div
                          key={st.id}
                          className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/90 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                              Rp
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {st.namaAnggota}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  • {formatTanggal(st.tanggal)}
                                </span>
                              </div>
                              {st.catatan && (
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                  {st.catatan}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                              +{formatRupiah(st.nominal)}
                            </span>
                            <button
                              onClick={() => handleDeleteSetoran(st)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Hapus setoran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: FORM BUAT / EDIT TABUNGAN TARGET                */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0D0D0F] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-black text-white border-b border-zinc-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>
                  {editingTabungan ? 'Edit Program Tabungan' : 'Buat Tabungan Target Baru'}
                </span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTabungan} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Tujuan Tabungan */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tujuan Tabungan *
                </label>
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Jalan-jalan ke Lembang / Qurban 1447H"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 2. Target Setoran per Orang */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Target Setoran / Orang (Rupiah) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={targetPerOrang}
                    onChange={(e) => setTargetPerOrang(e.target.value)}
                    placeholder="Contoh: 5000000"
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-base font-bold text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                {targetPerOrang && Number(targetPerOrang) > 0 && (
                  <p className="text-[11px] font-medium text-emerald-400 mt-1">
                    Terbaca: {formatRupiah(Number(targetPerOrang))} per orang
                  </p>
                )}
              </div>

              {/* 3. Target Waktu & Minimal Setoran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Target Waktu (Bulan) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={targetWaktuBulan}
                      onChange={(e) => setTargetWaktuBulan(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                      Bulan
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Minimal Setoran (Anjuran)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="1000"
                      value={minimalSetoran}
                      onChange={(e) => setMinimalSetoran(e.target.value)}
                      placeholder="500000"
                      className="w-full pl-8 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm font-semibold text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    (Tidak mutlak / fleksibel)
                  </span>
                </div>
              </div>

              {/* 4. Tanggal Mulai */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tanggal Mulai Tabungan
                </label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 5. Anggota Peserta Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Pilih Anggota Peserta ({selectedMemberIds.length} dipilih) *
                  </label>
                  <button
                    type="button"
                    onClick={selectAllActiveMembers}
                    className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Pilih Semua Anggota Aktif
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto bg-zinc-900/90 border border-zinc-700 rounded-xl p-2 space-y-1 divide-y divide-zinc-800">
                  {members.map((m) => {
                    const isChecked = selectedMemberIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center justify-between py-1.5 px-2 hover:bg-zinc-800 rounded-lg cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMemberSelection(m.id)}
                            className="rounded-sm text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-semibold text-zinc-200">{m.nama}</span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {m.nomorAnggota}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 6. Deskripsi / Catatan */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Rincian akomodasi, jadwal keberangkatan, dll..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Real-time Calculation Summary Card */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] space-y-1">
                <span className="font-bold text-emerald-400 block uppercase tracking-wider">
                  Ringkasan Target Tabungan:
                </span>
                <div className="flex justify-between text-zinc-300">
                  <span>Total Peserta:</span>
                  <strong>{selectedMemberIds.length} Orang</strong>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Total Target Keseluruhan:</span>
                  <strong className="text-emerald-400">
                    {formatRupiah(Number(targetPerOrang || 0) * selectedMemberIds.length)}
                  </strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rekomendasi Setoran:</span>
                  <span>
                    {formatRupiah(
                      Math.round(
                        Number(targetPerOrang || 0) / (Number(targetWaktuBulan) || 1)
                      )
                    )}{' '}
                    / orang / bulan
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-zinc-400 hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Program Tabungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FORM CATAT SETORAN TABUNGAN                     */}
      {/* ========================================================= */}
      {isSetoranModalOpen && activeTabDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0D0D0F] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-black text-white border-b border-zinc-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Catat Setoran Tabungan</span>
              </h3>
              <button
                onClick={() => setIsSetoranModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSetoran} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Program Tabungan:
                </span>
                <p className="text-sm font-black text-white mt-0.5">
                  {activeTabDetail.tujuan}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Target: {formatRupiah(activeTabDetail.targetPerOrang)} / orang ({activeTabDetail.targetWaktuBulan} bulan)
                </p>
              </div>

              {/* 1. Pilih Anggota */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Anggota Penyetor *
                </label>
                <select
                  value={setoranAnggotaId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSetoranAnggotaId(newId);
                    const prog = activeTabDetail.pesertaProgress?.find(
                      (p: any) => p.anggotaId === newId
                    );
                    if (prog && prog.saldoAkhirKekurangan > 0) {
                      const sugg =
                        activeTabDetail.minimalSetoran > 0
                          ? Math.min(activeTabDetail.minimalSetoran, prog.saldoAkhirKekurangan)
                          : prog.saldoAkhirKekurangan;
                      setSetoranNominal(String(sugg));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                >
                  {activeTabDetail.pesertaProgress?.map((p: any) => (
                    <option key={p.anggotaId} value={p.anggotaId} className="bg-zinc-900 text-zinc-100">
                      {p.nomorAnggota} - {p.nama} (Kurang: {formatRupiah(p.saldoAkhirKekurangan)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Kekurangan Anggota terpilih */}
              {currentMemberProg && (
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-zinc-400 block">Sudah Disetor:</span>
                    <strong className="text-emerald-400">
                      {formatRupiah(currentMemberProg.totalDisetor)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block">Saldo Akhir Kekurangan:</span>
                    <strong className="text-rose-400 text-sm">
                      {formatRupiah(currentMemberProg.saldoAkhirKekurangan)}
                    </strong>
                  </div>
                </div>
              )}

              {/* 2. Nominal Setoran */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nominal Setoran (Rupiah) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={setoranNominal}
                    onChange={(e) => setSetoranNominal(e.target.value)}
                    placeholder="500000"
                    className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-base font-bold text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Quick nominal buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeTabDetail.minimalSetoran > 0 && (
                    <button
                      type="button"
                      onClick={() => setSetoranNominal(String(activeTabDetail.minimalSetoran))}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-[11px] text-zinc-300 cursor-pointer"
                    >
                      Min: {formatRupiah(activeTabDetail.minimalSetoran)}
                    </button>
                  )}
                  {currentMemberProg && currentMemberProg.saldoAkhirKekurangan > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSetoranNominal(String(currentMemberProg.saldoAkhirKekurangan))
                      }
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded-lg text-[11px] text-rose-300 font-semibold cursor-pointer"
                    >
                      Lunasi Sisa ({formatRupiah(currentMemberProg.saldoAkhirKekurangan)})
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Tanggal */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Tanggal Setor
                </label>
                <input
                  type="date"
                  value={setoranTanggal}
                  onChange={(e) => setSetoranTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 4. Catatan */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Keterangan / Catatan
                </label>
                <input
                  type="text"
                  value={setoranCatatan}
                  onChange={(e) => setSetoranCatatan(e.target.value)}
                  placeholder="Contoh: Setoran tabungan bulan ke-1"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* 5. Checkbox sinkronkan ke Buku Kas Umum */}
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={setoranCatatKeKas}
                    onChange={(e) => setSetoranCatatKeKas(e.target.checked)}
                    className="mt-0.5 rounded-sm text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-200 block">
                      Catat juga ke Buku Kas Umum
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Otomatis memasukkan dana ini ke mutasi Kas Masuk kategori "Tabungan Khusus" agar saldo kas utama bertambah.
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSetoranModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-zinc-400 hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={setoranSaving}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  {setoranSaving ? 'Menyimpan...' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Program Tabungan */}
      {tabunganToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0D0D0F] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Program Tabungan?</h4>
                <p className="text-xs text-zinc-400">Konfirmasi penghapusan program</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300">
              <p className="font-bold text-white mb-1">{tabunganToDelete.namaTujuan}</p>
              <p className="text-[11px] text-zinc-400">
                Semua catatan setoran dan progres terkait program ini akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isDeletingTabungan}
                onClick={() => setTabunganToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingTabungan}
                onClick={handleConfirmDeleteTabungan}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingTabungan ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Setoran Tabungan */}
      {setoranToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0D0D0F] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Setoran?</h4>
                <p className="text-xs text-zinc-400">Konfirmasi penghapusan setoran</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p className="font-bold text-white">{setoranToDelete.namaAnggota}</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Nominal Setoran:</span>
                <span className="font-bold text-emerald-400">
                  +{formatRupiah(setoranToDelete.nominal)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">{setoranToDelete.tanggal}</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Catatan setoran ini akan dihapus dan akumulasi tabungan akan dihitung ulang.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isDeletingSetoran}
                onClick={() => setSetoranToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingSetoran}
                onClick={handleConfirmDeleteSetoran}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingSetoran ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
