export interface Anggota {
  id: string;
  nomorAnggota: string;
  nama: string;
  noHp: string;
  alamat: string;
  tanggalBergabung: string;
  status: 'aktif' | 'nonaktif';
  totalSetoran?: number;
}

export type TipeTransaksi = 'masuk' | 'keluar';

export interface TransaksiKas {
  id: string;
  tipe: TipeTransaksi;
  judul: string;
  nominal: number;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm
  kategori: string;
  anggotaId?: string;
  namaPihak: string; // Nama Anggota / Penyetor atau Nama Toko/Penerima
  keterangan: string;
  buktiFotoUrl?: string; // base64 or url
  buktiFotoName?: string;
  sumberInput: 'manual' | 'scan_ai' | 'kamera';
  alokasiDana?: 'kas_umum' | 'tabungan_target';
  tabunganId?: string;
  namaTabungan?: string;
  createdAt: string;
}

export interface HasilScanAI {
  tipe: TipeTransaksi;
  nominal: number;
  tanggal: string;
  judul: string;
  kategori: string;
  namaPihak: string;
  keterangan: string;
  detectedText?: string;
  confidence?: number;
}

export interface KategoriPilihan {
  id: string;
  nama: string;
  tipe: TipeTransaksi;
  icon?: string;
}

export interface FilterLaporan {
  mode: 'harian' | 'bulanan' | 'rentang' | 'semua';
  tanggal: string;
  bulan: number;
  tahun: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  tipe: 'semua' | 'masuk' | 'keluar';
  kategori: string;
  anggotaId: string;
  pencarian: string;
}

export interface RingkasanKas {
  totalSaldo: number;
  totalMasuk: number;
  totalKeluar: number;
  totalMasukBulanIni: number;
  totalKeluarBulanIni: number;
  totalMasukHariIni: number;
  totalKeluarHariIni: number;
  jumlahTransaksi: number;
  jumlahAnggotaAktif: number;
}

export interface SetoranTabungan {
  id: string;
  tabunganId: string;
  anggotaId: string;
  namaAnggota: string;
  nominal: number;
  tanggal: string; // YYYY-MM-DD
  waktu?: string; // HH:mm
  catatan?: string;
  buktiFotoUrl?: string;
  transaksiKasId?: string; // Jika dicatat juga ke buku kas umum
  createdAt: string;
}

export interface TabunganTarget {
  id: string;
  tujuan: string; // Contoh: "Jalan-jalan ke Lembang"
  deskripsi?: string;
  targetPerOrang: number; // Nilai target setoran per orang (contoh: 5.000.000)
  targetWaktuBulan: number; // Target waktu terkumpul dalam bulan (contoh: 10 bulan)
  tanggalMulai: string; // YYYY-MM-DD
  tanggalTargetSelesai: string; // YYYY-MM-DD
  minimalSetoran: number; // Minimal setoran anjuran (contoh: 500.000, tidak mutlak)
  anggotaIds: string[]; // Daftar id anggota peserta
  status: 'aktif' | 'tercapai' | 'selesai';
  createdAt: string;

  // Calculated fields (populated by server or frontend)
  totalTargetKeseluruhan?: number; // targetPerOrang * anggotaIds.length
  totalTerkumpul?: number; // Jumlah seluruh setoran yang sudah masuk
  saldoAkhirKekurangan?: number; // totalTargetKeseluruhan - totalTerkumpul
  persentaseTerkumpul?: number;
  jumlahPeserta?: number;
}
