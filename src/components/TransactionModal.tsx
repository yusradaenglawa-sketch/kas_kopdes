import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  User,
  Tag,
  FileText,
  Camera,
  Upload,
  Building,
  Target,
  Wallet,
  Coins,
} from 'lucide-react';
import { Anggota, TabunganTarget, TipeTransaksi, TransaksiKas } from '../types';
import { formatRupiah, KATEGORI_MASUK, KATEGORI_KELUAR } from '../utils/formatters';
import { CameraCaptureModal } from './CameraCaptureModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Partial<TransaksiKas>) => Promise<void>;
  members: Anggota[];
  tabunganList?: TabunganTarget[];
  initialType?: TipeTransaksi;
  editTransaction?: TransaksiKas | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  tabunganList: propTabunganList,
  initialType = 'masuk',
  editTransaction = null,
}) => {
  const [tipe, setTipe] = useState<TipeTransaksi>(initialType);
  const [judul, setJudul] = useState('');
  const [nominal, setNominal] = useState<number | string>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [waktu, setWaktu] = useState(new Date().toTimeString().substring(0, 5));
  const [kategori, setKategori] = useState('Iuran Wajib');
  const [anggotaId, setAnggotaId] = useState('');
  const [namaPihak, setNamaPihak] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Alokasi Dana State
  const [alokasiDana, setAlokasiDana] = useState<'kas_umum' | 'tabungan_target'>('kas_umum');
  const [selectedTabunganId, setSelectedTabunganId] = useState<string>('');
  const [tabunganList, setTabunganList] = useState<TabunganTarget[]>(propTabunganList || []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync or fetch tabungan targets when opening
  useEffect(() => {
    if (isOpen) {
      if (propTabunganList && propTabunganList.length > 0) {
        setTabunganList(propTabunganList);
      } else {
        fetch('/api/tabungan')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setTabunganList(data);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, propTabunganList]);

  useEffect(() => {
    if (!isOpen) return;

    if (editTransaction) {
      setTipe(editTransaction.tipe);
      setJudul(editTransaction.judul);
      setNominal(editTransaction.nominal);
      setTanggal(editTransaction.tanggal);
      setWaktu(editTransaction.waktu || new Date().toTimeString().substring(0, 5));
      setKategori(editTransaction.kategori);
      setAnggotaId(editTransaction.anggotaId || '');
      setNamaPihak(editTransaction.namaPihak);
      setKeterangan(editTransaction.keterangan || '');
      setPhotoDataUrl(editTransaction.buktiFotoUrl || null);
      setPhotoFileName(editTransaction.buktiFotoName || '');
      setAlokasiDana(editTransaction.alokasiDana || (editTransaction.tabunganId ? 'tabungan_target' : 'kas_umum'));
      setSelectedTabunganId(editTransaction.tabunganId || '');
    } else {
      setTipe(initialType);
      setJudul('');
      setNominal('');
      setTanggal(new Date().toISOString().split('T')[0]);
      setWaktu(new Date().toTimeString().substring(0, 5));
      setKategori(initialType === 'masuk' ? 'Iuran Wajib' : 'Operasional & Kebersihan');
      setAnggotaId('');
      setNamaPihak('');
      setKeterangan('');
      setPhotoDataUrl(null);
      setPhotoFileName('');
      setAlokasiDana('kas_umum');
      setSelectedTabunganId('');
    }
  }, [isOpen, editTransaction, initialType]);

  const handleTypeChange = (newType: TipeTransaksi) => {
    setTipe(newType);
    if (newType === 'masuk') {
      if (!KATEGORI_MASUK.includes(kategori)) {
        setKategori('Iuran Wajib');
      }
    } else {
      setAlokasiDana('kas_umum');
      if (!KATEGORI_KELUAR.includes(kategori)) {
        setKategori('Operasional & Kebersihan');
      }
    }
  };

  const handleAlokasiChange = (mode: 'kas_umum' | 'tabungan_target') => {
    setAlokasiDana(mode);
    if (mode === 'tabungan_target') {
      const target = tabunganList.find((t) => t.id === selectedTabunganId) || tabunganList[0];
      if (target) {
        setSelectedTabunganId(target.id);
        setKategori('Tabungan Khusus');
        const currentMember = members.find((m) => m.id === anggotaId);
        setJudul(`Setoran Tabungan: ${target.tujuan}${currentMember ? ' - ' + currentMember.nama : ''}`);
      }
    } else {
      setSelectedTabunganId('');
      if (kategori === 'Tabungan Khusus') {
        setKategori('Iuran Wajib');
      }
      const currentMember = members.find((m) => m.id === anggotaId);
      if (currentMember) {
        setJudul(`Setoran Kas - ${currentMember.nama}`);
      } else {
        setJudul('Setoran Kas');
      }
    }
  };

  const handleSelectTabungan = (tabId: string) => {
    setSelectedTabunganId(tabId);
    const target = tabunganList.find((t) => t.id === tabId);
    if (target) {
      setKategori('Tabungan Khusus');
      const currentMember = members.find((m) => m.id === anggotaId);
      setJudul(`Setoran Tabungan: ${target.tujuan}${currentMember ? ' - ' + currentMember.nama : ''}`);
    }
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAnggotaId(selectedId);
    if (selectedId) {
      const m = members.find((item) => item.id === selectedId);
      if (m) {
        setNamaPihak(m.nama);
        if (alokasiDana === 'tabungan_target') {
          const target = tabunganList.find((t) => t.id === selectedTabunganId) || tabunganList[0];
          setJudul(`Setoran Tabungan${target ? ': ' + target.tujuan : ''} - ${m.nama}`);
        } else if (!judul || judul.startsWith('Setoran Kas') || judul.startsWith('Setoran Tabungan')) {
          setJudul(`Setoran Kas - ${m.nama}`);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(nominal);
    if (!num || num <= 0) {
      alert('Masukkan nominal kas yang valid.');
      return;
    }

    if (tipe === 'masuk' && alokasiDana === 'tabungan_target' && !selectedTabunganId) {
      alert('Silakan pilih salah satu Program Tabungan Target.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(editTransaction ? { id: editTransaction.id } : {}),
        tipe,
        judul: judul.trim() || (tipe === 'masuk' ? (alokasiDana === 'tabungan_target' ? 'Setoran Tabungan' : 'Setoran Kas') : 'Pembelanjaan Kas'),
        nominal: num,
        tanggal,
        waktu,
        kategori,
        anggotaId: tipe === 'masuk' && anggotaId ? anggotaId : undefined,
        namaPihak: namaPihak.trim() || (tipe === 'masuk' ? 'Anggota' : 'Toko / Rekanan'),
        keterangan: keterangan.trim(),
        buktiFotoUrl: photoDataUrl || undefined,
        buktiFotoName: photoFileName || undefined,
        sumberInput: editTransaction?.sumberInput || 'manual',
        alokasiDana: tipe === 'masuk' ? alokasiDana : 'kas_umum',
        tabunganId: (tipe === 'masuk' && alokasiDana === 'tabungan_target') ? selectedTabunganId : undefined,
      });
      onClose();
    } catch (err: any) {
      alert('Gagal menyimpan transaksi: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-[#0D0D0F] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-black text-white border-b border-zinc-800">
            <h3 className="font-bold text-base flex items-center gap-2">
              {tipe === 'masuk' ? (
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
              )}
              {editTransaction
                ? 'Edit Transaksi Kas'
                : tipe === 'masuk'
                ? 'Catat Uang Masuk (Setoran Kas)'
                : 'Catat Uang Keluar (Pembelanjaan)'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {/* TIPE TRANSAKSI TOGGLE BUTTONS */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Jenis Transaksi Kas
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleTypeChange('masuk')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    tipe === 'masuk'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Uang Masuk (Setoran)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('keluar')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    tipe === 'keluar'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Uang Keluar (Belanja)
                </button>
              </div>
            </div>

            {/* ALOKASI DANA MASUK: KAS UMUM vs SETORAN TABUNGAN TARGET */}
            {tipe === 'masuk' && (
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    Tujuan Alokasi Dana:
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alokasiDana === 'kas_umum'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {alokasiDana === 'kas_umum' ? 'Kas Umum Kopdes' : 'Tabungan Khusus'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAlokasiChange('kas_umum')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      alokasiDana === 'kas_umum'
                        ? 'bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 text-white shadow-xs'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <Wallet
                          className={`w-4 h-4 ${
                            alokasiDana === 'kas_umum' ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        />
                        <span>Uang Kas Kopdes</span>
                      </div>
                      {alokasiDana === 'kas_umum' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Iuran kas rutin, operasional, atau sumbangan kas umum
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAlokasiChange('tabungan_target')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      alokasiDana === 'tabungan_target'
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 text-white shadow-xs'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <Target
                          className={`w-4 h-4 ${
                            alokasiDana === 'tabungan_target' ? 'text-amber-400' : 'text-zinc-500'
                          }`}
                        />
                        <span>Setoran Tabungan Target</span>
                      </div>
                      {alokasiDana === 'tabungan_target' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Tabungan rencana berjangka (wisata, qurban, kegiatan)
                    </p>
                  </button>
                </div>

                {/* Sub-pilihan jika memilih Tabungan Target */}
                {alokasiDana === 'tabungan_target' && (
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        Pilih Program Tabungan Target *
                      </span>
                      {tabunganList.length > 0 && (
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {tabunganList.length} Program Tersedia
                        </span>
                      )}
                    </label>

                    {tabunganList.length > 0 ? (
                      <select
                        value={selectedTabunganId}
                        onChange={(e) => handleSelectTabungan(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-black border-2 border-amber-500/60 rounded-xl text-xs sm:text-sm font-semibold text-zinc-100 focus:outline-hidden focus:border-amber-400"
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                          -- Pilih Program Tabungan Target --
                        </option>
                        {tabunganList.map((tab) => (
                          <option key={tab.id} value={tab.id} className="bg-zinc-900 text-zinc-100">
                            🎯 {tab.tujuan} (Target: {formatRupiah(tab.targetPerOrang)}/org)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                        ⚠️ Belum ada program tabungan target yang dibuat. Anda dapat membuatnya di menu Tabungan.
                      </div>
                    )}

                    <p className="text-[11px] text-amber-400/80 leading-tight">
                      💡 Setoran ini otomatis masuk ke buku kas dan terakumulasi ke progres tabungan target anggota terkait.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Nominal */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Nominal (Rupiah) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-lg font-bold text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              {nominal && Number(nominal) > 0 && (
                <p className="text-xs font-medium text-emerald-400 mt-1">
                  Terbaca: {formatRupiah(Number(nominal))}
                </p>
              )}
            </div>

            {/* Judul Transaksi */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Judul Transaksi *
              </label>
              <input
                type="text"
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder={
                  tipe === 'masuk'
                    ? 'Contoh: Setoran Kas Wajib Anggota'
                    : 'Contoh: Pembelian Snack & Kopi Rapat Warga'
                }
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Waktu
                </label>
                <input
                  type="time"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-500" /> Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
              >
                {(tipe === 'masuk' ? KATEGORI_MASUK : KATEGORI_KELUAR).map((kat) => (
                  <option key={kat} value={kat} className="bg-zinc-900 text-zinc-100">
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            {/* Anggota (jika masuk) / Toko (jika keluar) */}
            {tipe === 'masuk' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-500" /> Anggota Penyetor
                  </span>
                  {alokasiDana === 'tabungan_target' && selectedTabunganId && (
                    <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/70 px-2 py-0.5 rounded-sm border border-amber-500/30">
                      ⭐ = Peserta Terdaftar
                    </span>
                  )}
                </label>
                <select
                  value={anggotaId}
                  onChange={handleMemberSelect}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">-- Pilih dari Daftar Anggota --</option>
                  {members.map((m) => {
                    const currentTab = tabunganList.find((t) => t.id === selectedTabunganId);
                    const isParticipant = currentTab?.anggotaIds?.includes(m.id);
                    return (
                      <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-100">
                        {isParticipant ? '⭐ ' : ''}{m.nomorAnggota} - {m.nama} {isParticipant ? '(Peserta Target)' : ''}
                      </option>
                    );
                  })}
                </select>

                <input
                  type="text"
                  value={namaPihak}
                  onChange={(e) => setNamaPihak(e.target.value)}
                  placeholder="Atau nama penyetor manual jika bukan anggota terdaftar"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-zinc-500" /> Toko / Penerima Pembayaran
                </label>
                <input
                  type="text"
                  value={namaPihak}
                  onChange={(e) => setNamaPihak(e.target.value)}
                  placeholder="Contoh: Toko Berkah / Warung Bu Siti / PLN"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-zinc-500" /> Keterangan / Catatan
              </label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Rincian tambahan atau no. bukti transaksi..."
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Foto Bukti Attachment */}
            <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-zinc-400" /> Lampiran Foto Bukti
                </span>
                {photoDataUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl(null);
                      setPhotoFileName('');
                    }}
                    className="text-xs text-rose-400 font-medium hover:underline cursor-pointer"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              {photoDataUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={photoDataUrl}
                    alt="Bukti"
                    className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                  />
                  <div className="text-xs text-zinc-400 truncate">
                    <p className="font-semibold text-zinc-200">Foto terlampir</p>
                    <p className="text-[11px] text-zinc-500 truncate">{photoFileName || 'bukti.jpg'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 py-2 px-3 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Foto Kamera
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-zinc-400 hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`py-2.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer ${
                  tipe === 'masuk'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => {
          setPhotoDataUrl(img);
          setPhotoFileName('kamera_' + Date.now() + '.jpg');
        }}
      />
    </>
  );
};
