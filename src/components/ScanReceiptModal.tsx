import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  User,
  Tag,
  FileText,
  X,
  RefreshCw,
  Loader2,
  Building,
  Target,
  Wallet,
  Coins,
} from 'lucide-react';
import { Anggota, TabunganTarget, TipeTransaksi, TransaksiKas } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { formatRupiah, KATEGORI_MASUK, KATEGORI_KELUAR } from '../utils/formatters';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Partial<TransaksiKas>) => Promise<void>;
  members: Anggota[];
  tabunganList?: TabunganTarget[];
  initialType?: TipeTransaksi;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  tabunganList: propTabunganList,
  initialType,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Alokasi Dana State: Kas Umum vs Tabungan Target
  const [alokasiDana, setAlokasiDana] = useState<'kas_umum' | 'tabungan_target'>('kas_umum');
  const [selectedTabunganId, setSelectedTabunganId] = useState<string>('');
  const [tabunganList, setTabunganList] = useState<TabunganTarget[]>(propTabunganList || []);

  // Form State
  const [tipe, setTipe] = useState<TipeTransaksi>(initialType || 'masuk');
  const [judul, setJudul] = useState<string>('');
  const [nominal, setNominal] = useState<number | string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [waktu, setWaktu] = useState<string>(new Date().toTimeString().substring(0, 5));
  const [kategori, setKategori] = useState<string>('Iuran Wajib');
  const [anggotaId, setAnggotaId] = useState<string>('');
  const [namaPihak, setNamaPihak] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);

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
    if (initialType) {
      setTipe(initialType);
      setKategori(initialType === 'masuk' ? 'Iuran Wajib' : 'Operasional & Kebersihan');
    }
  }, [initialType]);

  // Reset when modal is reopened
  useEffect(() => {
    if (!isOpen) {
      setPhotoDataUrl(null);
      setPhotoFileName('');
      setIsScanning(false);
      setScanMessage(null);
      setJudul('');
      setNominal('');
      setAnggotaId('');
      setNamaPihak('');
      setKeterangan('');
      setDetectedConfidence(null);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setWaktu(new Date().toTimeString().substring(0, 5));
      setAlokasiDana('kas_umum');
      setSelectedTabunganId('');
    }
  }, [isOpen]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoDataUrl(result);
      scanReceiptWithAI(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (base64Img: string) => {
    setPhotoDataUrl(base64Img);
    setPhotoFileName('kamera_struk_' + Date.now() + '.jpg');
    scanReceiptWithAI(base64Img);
  };

  const scanReceiptWithAI = async (base64Img: string) => {
    setIsScanning(true);
    setScanMessage('AI Gemini sedang menganalisis bukti transfer / struk belanja...');
    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: base64Img.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setTipe(d.tipe);
        setJudul(d.judul || (d.tipe === 'masuk' ? 'Setoran Kas' : 'Pembelanjaan Kas'));
        setNominal(d.nominal || '');
        if (d.tanggal) setTanggal(d.tanggal);
        setKategori(d.kategori || (d.tipe === 'masuk' ? 'Iuran Wajib' : 'Operasional & Kebersihan'));
        setNamaPihak(d.namaPihak || '');
        setKeterangan(d.keterangan || '');
        setDetectedConfidence(d.confidence || 0.9);

        // Try to match sender with an existing member if it is Uang Masuk
        if (d.tipe === 'masuk' && d.namaPihak) {
          const matched = members.find((m) =>
            m.nama.toLowerCase().includes(d.namaPihak.toLowerCase()) ||
            d.namaPihak.toLowerCase().includes(m.nama.toLowerCase())
          );
          if (matched) {
            setAnggotaId(matched.id);
            setNamaPihak(matched.nama);
          }
        }

        setScanMessage(
          `Berhasil terdeteksi: ${d.tipe === 'masuk' ? 'UANG MASUK (Setoran)' : 'UANG KELUAR (Belanja)'} • ${formatRupiah(d.nominal)}`
        );
      } else {
        setScanMessage('Foto berhasil diunggah. Silakan lengkapi rincian transaksi.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanMessage('Foto tersimpan. Silakan isi atau sesuaikan data transaksi di bawah.');
    } finally {
      setIsScanning(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = Number(nominal);
    if (!numVal || numVal <= 0) {
      alert('Silakan masukkan nominal transaksi yang valid.');
      return;
    }

    if (tipe === 'masuk' && alokasiDana === 'tabungan_target' && !selectedTabunganId) {
      alert('Silakan pilih salah satu Program Tabungan Target.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        tipe,
        judul: judul.trim() || (tipe === 'masuk' ? (alokasiDana === 'tabungan_target' ? 'Setoran Tabungan' : 'Setoran Kas') : 'Pembelanjaan Kas'),
        nominal: numVal,
        tanggal,
        waktu,
        kategori,
        anggotaId: tipe === 'masuk' && anggotaId ? anggotaId : undefined,
        namaPihak: namaPihak.trim() || (tipe === 'masuk' ? 'Anggota Kas' : 'Toko/Pihak Luar'),
        keterangan: keterangan.trim(),
        buktiFotoUrl: photoDataUrl || undefined,
        buktiFotoName: photoFileName || undefined,
        sumberInput: photoDataUrl ? 'scan_ai' : 'manual',
        alokasiDana: tipe === 'masuk' ? alokasiDana : 'kas_umum',
        tabunganId: (tipe === 'masuk' && alokasiDana === 'tabungan_target') ? selectedTabunganId : undefined,
      });
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Gagal menyimpan transaksi: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight leading-tight">
                  Pencatatan Kas Kopdes
                </h3>
                <p className="text-xs text-slate-400">
                  Scan Bukti Transfer / Struk Belanja atau Input Manual
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-5">
            {/* PHOTO UPLOAD & DIRECT CAMERA CAPTURE SECTION */}
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Foto Bukti Transfer / Struk Belanja
                </label>
                {photoDataUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl(null);
                      setPhotoFileName('');
                      setScanMessage(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Ganti Foto
                  </button>
                )}
              </div>

              {!photoDataUrl ? (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Upload Foto Bukti / Struk
                    </p>
                    <p className="text-xs text-slate-500">
                      Klik atau tarik file gambar (JPG, PNG, WebP) ke sini
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase">
                      atau
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Foto Langsung Dari Kamera HP / Webcam
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center max-h-48 border border-slate-200">
                    <img
                      src={photoDataUrl}
                      alt="Struk"
                      className="max-h-48 w-auto object-contain"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-4">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        <p className="text-xs font-medium text-center">
                          AI Gemini sedang membaca nominal, tanggal & jenis transaksi...
                        </p>
                      </div>
                    )}
                  </div>

                  {scanMessage && (
                    <div
                      className={`text-xs p-2.5 rounded-lg flex items-center gap-2 font-medium ${
                        scanMessage.includes('Berhasil')
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{scanMessage}</span>
                    </div>
                  )}
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

            {/* MANDATORY STAKEHOLDER BUTTONS: UANG MASUK vs UANG KELUAR */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Pilih Tipe Transaksi Kas:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('masuk')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                    tipe === 'masuk'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <ArrowDownLeft
                    className={`w-5 h-5 ${
                      tipe === 'masuk' ? 'text-white' : 'text-emerald-600'
                    }`}
                  />
                  <span>Uang Masuk (Setoran)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('keluar')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                    tipe === 'keluar'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 ring-2 ring-rose-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                  }`}
                >
                  <ArrowUpRight
                    className={`w-5 h-5 ${
                      tipe === 'keluar' ? 'text-white' : 'text-rose-600'
                    }`}
                  />
                  <span>Uang Keluar (Belanja)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {tipe === 'masuk'
                  ? '• Uang Masuk akan menambah saldo kas perkumpulan/desa.'
                  : '• Uang Keluar akan mengurangi saldo kas perkumpulan/desa.'}
              </p>
            </div>

            {/* ALOKASI DANA MASUK: KAS UMUM vs SETORAN TABUNGAN TARGET */}
            {tipe === 'masuk' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    Tujuan Alokasi Dana:
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      alokasiDana === 'kas_umum'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
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
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <Wallet
                          className={`w-4 h-4 ${
                            alokasiDana === 'kas_umum' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <span>Uang Kas Kopdes</span>
                      </div>
                      {alokasiDana === 'kas_umum' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Iuran rutin, operasional, atau sumbangan kas perkumpulan
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAlokasiChange('tabungan_target')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      alokasiDana === 'tabungan_target'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                        <Target
                          className={`w-4 h-4 ${
                            alokasiDana === 'tabungan_target' ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <span>Setoran Tabungan Target</span>
                      </div>
                      {alokasiDana === 'tabungan_target' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Tabungan berjangka anggota (wisata, qurban, rencana bersama)
                    </p>
                  </button>
                </div>

                {/* Sub-pilihan jika memilih Tabungan Target */}
                {alokasiDana === 'tabungan_target' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-amber-600" />
                        Pilih Program Tabungan Target *
                      </span>
                      {tabunganList.length > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                          {tabunganList.length} Program Tersedia
                        </span>
                      )}
                    </label>

                    {tabunganList.length > 0 ? (
                      <select
                        value={selectedTabunganId}
                        onChange={(e) => handleSelectTabungan(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-400 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- Pilih Program Tabungan Target --</option>
                        {tabunganList.map((tab) => (
                          <option key={tab.id} value={tab.id}>
                            🎯 {tab.tujuan} (Target: {formatRupiah(tab.targetPerOrang)}/org)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-xs text-amber-900">
                        ⚠️ Belum ada program tabungan target yang dibuat. Anda dapat membuatnya di menu <strong>Tabungan</strong>.
                      </div>
                    )}

                    <p className="text-[11px] text-amber-800/90 leading-tight">
                      💡 Setoran ini akan otomatis tercatat ke buku kas dan terakumulasi ke progres tabungan target anggota terkait.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTION DETAILS FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nominal Field */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nominal Transaksi (Rp) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                {nominal && Number(nominal) > 0 && (
                  <p className="text-xs font-medium text-emerald-700 mt-1">
                    Terbaca: {formatRupiah(Number(nominal))}
                  </p>
                )}
              </div>

              {/* Judul Transaksi */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Judul Transaksi *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder={
                      tipe === 'masuk'
                        ? 'Contoh: Setoran Iuran Wajib Bulan September'
                        : 'Contoh: Pembelian Snack & Konsumsi Rapat'
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Waktu / Jam
                  </label>
                  <input
                    type="time"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Kategori Transaksi
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {(tipe === 'masuk' ? KATEGORI_MASUK : KATEGORI_KELUAR).map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              {/* If Uang Masuk: Pilih Anggota / Penyetor */}
              {tipe === 'masuk' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Anggota Penyetor
                    </span>
                    {alokasiDana === 'tabungan_target' && selectedTabunganId && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                        ⭐ = Peserta Terdaftar
                      </span>
                    )}
                  </label>
                  <select
                    value={anggotaId}
                    onChange={handleMemberSelect}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih dari Daftar Anggota Kopdes --</option>
                    {members.map((m) => {
                      const currentTab = tabunganList.find((t) => t.id === selectedTabunganId);
                      const isParticipant = currentTab?.anggotaIds?.includes(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {isParticipant ? '⭐ ' : ''}{m.nomorAnggota} - {m.nama} {isParticipant ? '(Peserta Target)' : ''} ({m.alamat || 'Anggota'})
                        </option>
                      );
                    })}
                  </select>

                  <div>
                    <input
                      type="text"
                      value={namaPihak}
                      onChange={(e) => setNamaPihak(e.target.value)}
                      placeholder="Atau ketik nama penyetor manual (jika bukan anggota)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                /* If Uang Keluar: Nama Toko / Penerima Pembayaran */
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> Toko / Tempat Belanja / Rekanan
                  </label>
                  <input
                    type="text"
                    value={namaPihak}
                    onChange={(e) => setNamaPihak(e.target.value)}
                    placeholder="Contoh: Toko Berkah / Percetakan Desa / Fotocopy Sukses"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Keterangan / Catatan Tambahan */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Catatan / Rincian / No. Ref
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan tambahan, no. rekening pengirim, rincian barang yang dibeli..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`py-2.5 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-2 shadow-lg transition-all ${
                    tipe === 'masuk'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan Transaksi Kas
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
