/**
 * Utility formatters for Rupiah currency and Indonesian dates
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatTanggalSingkat(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getNamaBulan(monthNumber: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthNumber - 1] || '';
}

export const KATEGORI_MASUK = [
  'Iuran Wajib',
  'Iuran Sukarela',
  'Uang Pangkal Anggota',
  'Donasi Kas',
  'Bagi Hasil Usaha',
  'Dana Bantuan Desa',
  'Denda Keterlambatan',
  'Lain-lain Masuk',
];

export const KATEGORI_KELUAR = [
  'Konsumsi & Jamuan',
  'ATK & Perlengkapan Cetak',
  'Operasional & Kebersihan',
  'Transportasi & Perjalanan',
  'Peralatan & Inventaris',
  'Sosial & Santunan Duka',
  'Acara & Kegiatan Warga',
  'Listrik, Pulsa & Internet',
  'Honor & Upah Pengurus',
  'Lain-lain Keluar',
];
