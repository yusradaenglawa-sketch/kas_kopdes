import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { sql } from '@vercel/postgres';

const app = express();
export default app;

// Increase limit to handle image uploads/receipt photos
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ---------------------------------------------
// Database (Vercel Postgres / Neon) — menggantikan penyimpanan file JSON lokal.
// Tidak perlu Environment Variables manual: POSTGRES_URL sudah otomatis
// tersedia karena database ini sudah terhubung ke project Vercel.
// ---------------------------------------------
const STORE_ROW_ID = 'main';

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS kas_kopdes_store (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz DEFAULT now()
    )
  `;
  tableReady = true;
}

// Initial default seed data for authentic Indonesian community / village cooperative
function getDefaultData() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  return {
    members: [
      {
        id: 'mbr-1',
        nomorAnggota: 'KOP-001',
        nama: 'Ahmad Dahlan',
        noHp: '081234567890',
        alamat: 'Dusun Sukamaju RT 01/RW 02',
        tanggalBergabung: '2025-01-10',
        status: 'aktif',
        totalSetoran: 350000,
      },
      {
        id: 'mbr-2',
        nomorAnggota: 'KOP-002',
        nama: 'Siti Rahmawati',
        noHp: '085712345678',
        alamat: 'Dusun Sukamaju RT 03/RW 02',
        tanggalBergabung: '2025-01-15',
        status: 'aktif',
        totalSetoran: 250000,
      },
      {
        id: 'mbr-3',
        nomorAnggota: 'KOP-003',
        nama: 'Budi Santoso',
        noHp: '082198765432',
        alamat: 'Dusun Karang Anyar RT 02/RW 01',
        tanggalBergabung: '2025-02-01',
        status: 'aktif',
        totalSetoran: 400000,
      },
      {
        id: 'mbr-4',
        nomorAnggota: 'KOP-004',
        nama: 'Dewi Lestari',
        noHp: '081377889900',
        alamat: 'Dusun Mekar Sari RT 04/RW 03',
        tanggalBergabung: '2025-02-12',
        status: 'aktif',
        totalSetoran: 200000,
      },
      {
        id: 'mbr-5',
        nomorAnggota: 'KOP-005',
        nama: 'Wahyu Hidayat',
        noHp: '089611223344',
        alamat: 'Dusun Sukamaju RT 02/RW 02',
        tanggalBergabung: '2025-03-01',
        status: 'aktif',
        totalSetoran: 300000,
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        tipe: 'masuk',
        judul: 'Setoran Kas Pokok & Wajib',
        nominal: 250000,
        tanggal: lastWeek,
        waktu: '09:30',
        kategori: 'Iuran Wajib',
        anggotaId: 'mbr-1',
        namaPihak: 'Ahmad Dahlan',
        keterangan: 'Transfer Bank BRI a/n Ahmad Dahlan untuk kas bulan ini',
        sumberInput: 'scan_ai',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'tx-2',
        tipe: 'masuk',
        judul: 'Setoran Iuran Kas Bulanan',
        nominal: 200000,
        tanggal: threeDaysAgo,
        waktu: '14:15',
        kategori: 'Iuran Wajib',
        anggotaId: 'mbr-2',
        namaPihak: 'Siti Rahmawati',
        keterangan: 'Transfer Mandiri bukti setor slip kas perkumpulan',
        sumberInput: 'kamera',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'tx-3',
        tipe: 'keluar',
        judul: 'Pembelian Buku Kas & ATK Sekretariat',
        nominal: 85000,
        tanggal: threeDaysAgo,
        waktu: '16:45',
        kategori: 'ATK & Cetak',
        namaPihak: 'Toko Buku Gramedia / Al-Fath',
        keterangan: 'Struk pembelian buku kas folio, pulpen 1 pak, map arsip',
        sumberInput: 'scan_ai',
        createdAt: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
      },
      {
        id: 'tx-4',
        tipe: 'masuk',
        judul: 'Setoran Kas & Sukarela',
        nominal: 350000,
        tanggal: yesterday,
        waktu: '10:00',
        kategori: 'Iuran Sukarela',
        anggotaId: 'mbr-3',
        namaPihak: 'Budi Santoso',
        keterangan: 'Transfer BCA Mobile bukti transfer dana kas kopdes',
        sumberInput: 'scan_ai',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'tx-5',
        tipe: 'keluar',
        judul: 'Snack & Minuman Rapat Bulanan',
        nominal: 125000,
        tanggal: today,
        waktu: '11:20',
        kategori: 'Konsumsi',
        namaPihak: 'Katering Berkah Desa',
        keterangan: 'Struk pembelian konsumsi rapat koordinasi pengurus',
        sumberInput: 'manual',
        createdAt: new Date().toISOString(),
      },
    ],
    tabunganTargets: [
      {
        id: 'tab-1',
        tujuan: 'Jalan-jalan ke Lembang',
        deskripsi: 'Tabungan bersama anggota perkumpulan untuk kegiatan wisata & silaturahmi ke Lembang Bandung.',
        targetPerOrang: 5000000,
        targetWaktuBulan: 10,
        tanggalMulai: '2025-01-01',
        tanggalTargetSelesai: '2025-10-31',
        minimalSetoran: 500000,
        anggotaIds: ['mbr-1', 'mbr-2', 'mbr-3', 'mbr-4', 'mbr-5'],
        status: 'aktif',
        createdAt: '2025-01-01T08:00:00.000Z',
      },
    ],
    setoranTabungan: [
      {
        id: 'st-1',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-1',
        namaAnggota: 'Ahmad Dahlan',
        nominal: 1000000,
        tanggal: '2025-01-15',
        waktu: '09:00',
        catatan: 'Setoran tabungan pertama Lembang (2 bulan)',
        createdAt: '2025-01-15T09:00:00.000Z',
      },
      {
        id: 'st-2',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-1',
        namaAnggota: 'Ahmad Dahlan',
        nominal: 500000,
        tanggal: '2025-02-15',
        waktu: '10:30',
        catatan: 'Setoran bulan ke-2 Lembang',
        createdAt: '2025-02-15T10:30:00.000Z',
      },
      {
        id: 'st-3',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-2',
        namaAnggota: 'Siti Rahmawati',
        nominal: 500000,
        tanggal: '2025-01-20',
        waktu: '14:00',
        catatan: 'Setoran awal wisata Lembang',
        createdAt: '2025-01-20T14:00:00.000Z',
      },
      {
        id: 'st-4',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-2',
        namaAnggota: 'Siti Rahmawati',
        nominal: 500000,
        tanggal: '2025-02-20',
        waktu: '13:15',
        catatan: 'Setoran bulan Februari Lembang',
        createdAt: '2025-02-20T13:15:00.000Z',
      },
      {
        id: 'st-5',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-3',
        namaAnggota: 'Budi Santoso',
        nominal: 1500000,
        tanggal: '2025-02-05',
        waktu: '11:00',
        catatan: 'Setoran langsung 3 bulan jalan-jalan Lembang',
        createdAt: '2025-02-05T11:00:00.000Z',
      },
      {
        id: 'st-6',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-4',
        namaAnggota: 'Dewi Lestari',
        nominal: 500000,
        tanggal: '2025-02-14',
        waktu: '15:20',
        catatan: 'Cicilan tabungan Lembang',
        createdAt: '2025-02-14T15:20:00.000Z',
      },
      {
        id: 'st-7',
        tabunganId: 'tab-1',
        anggotaId: 'mbr-5',
        namaAnggota: 'Wahyu Hidayat',
        nominal: 1000000,
        tanggal: '2025-03-02',
        waktu: '10:00',
        catatan: 'Setoran 2 bulan jalan-jalan Lembang',
        createdAt: '2025-03-02T10:00:00.000Z',
      },
    ],
  };
}

// Baca seluruh data dari Postgres (menggantikan fs.readFileSync)
async function readDb(): Promise<any> {
  try {
    await ensureTable();
    const { rows } = await sql`SELECT data FROM kas_kopdes_store WHERE id = ${STORE_ROW_ID}`;

    // Kalau baris belum ada, isi dengan data default
    if (rows.length === 0) {
      const defaultData = getDefaultData();
      await writeDb(defaultData);
      return defaultData;
    }

    const parsed = rows[0].data;
    let dirty = false;
    if (!parsed.tabunganTargets || !Array.isArray(parsed.tabunganTargets)) {
      parsed.tabunganTargets = getDefaultData().tabunganTargets;
      dirty = true;
    }
    if (!parsed.setoranTabungan || !Array.isArray(parsed.setoranTabungan)) {
      parsed.setoranTabungan = getDefaultData().setoranTabungan;
      dirty = true;
    }
    if (dirty) {
      await writeDb(parsed);
    }

    return parsed;
  } catch (err: any) {
    console.error('Error membaca data dari Postgres:', err.message);
    throw new Error('Gagal memuat data dari database');
  }
}

// Simpan seluruh data ke Postgres (menggantikan fs.writeFileSync)
async function writeDb(data: any): Promise<void> {
  try {
    await ensureTable();
    const json = JSON.stringify(data);
    await sql`
      INSERT INTO kas_kopdes_store (id, data, updated_at)
      VALUES (${STORE_ROW_ID}, ${json}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
  } catch (err: any) {
    console.error('Error menulis data ke Postgres:', err.message);
    throw new Error('Gagal menyimpan data ke database');
  }
}

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------------------------------------------
// API Routes
// ---------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Kas Kopdes', time: new Date().toISOString() });
});

// ---------------------------------------------
// Endpoint IMPORT SATU KALI PAKAI — untuk memasukkan data lama dari AI Studio
// ke database Postgres. HAPUS endpoint ini setelah selesai dipakai (demi keamanan),
// supaya orang lain tidak bisa menimpa data lewat endpoint ini.
// ---------------------------------------------
const IMPORT_SECRET = 'kopdes-import-2026';
app.post('/api/import-data', async (req, res) => {
  try {
    if (req.query.key !== IMPORT_SECRET) {
      return res.status(403).json({ error: 'Kunci import salah' });
    }
    const incoming = req.body;
    if (!incoming || !Array.isArray(incoming.members)) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }
    await writeDb(incoming);
    res.json({ success: true, message: 'Data berhasil diimpor ke database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Summary Endpoint (Balances, counts, totals)
app.get('/api/summary', async (req, res) => {
  try {
    const db = await readDb();
    const txs = db.transactions || [];
    const members = db.members || [];

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

    for (const t of txs) {
      const nominal = Number(t.nominal) || 0;
      const tDate = t.tanggal ? new Date(t.tanggal) : new Date(t.createdAt);
      const isToday = t.tanggal === todayStr;
      const isThisMonth =
        tDate.getFullYear() === currentYear && tDate.getMonth() + 1 === currentMonth;

      if (t.tipe === 'masuk') {
        totalMasuk += nominal;
        if (isToday) totalMasukHariIni += nominal;
        if (isThisMonth) totalMasukBulanIni += nominal;
      } else {
        totalKeluar += nominal;
        if (isToday) totalKeluarHariIni += nominal;
        if (isThisMonth) totalKeluarBulanIni += nominal;
      }
    }

    const totalSaldo = totalMasuk - totalKeluar;
    const activeMembers = members.filter((m: any) => m.status === 'aktif').length;

    res.json({
      totalSaldo,
      totalMasuk,
      totalKeluar,
      totalMasukBulanIni,
      totalKeluarBulanIni,
      totalMasukHariIni,
      totalKeluarHariIni,
      jumlahTransaksi: txs.length,
      jumlahAnggotaAktif: activeMembers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions CRUD
app.get('/api/transactions', async (req, res) => {
  try {
    const db = await readDb();
    const sorted = (db.transactions || []).sort((a: any, b: any) => {
      return new Date(b.tanggal + 'T' + (b.waktu || '00:00')).getTime() -
             new Date(a.tanggal + 'T' + (a.waktu || '00:00')).getTime();
    });
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const db = await readDb();
    const {
      tipe,
      judul,
      nominal,
      tanggal,
      waktu,
      kategori,
      anggotaId,
      namaPihak,
      keterangan,
      buktiFotoUrl,
      buktiFotoName,
      sumberInput,
      alokasiDana,
      tabunganId,
    } = req.body;

    if (!tipe || !nominal || nominal <= 0) {
      return res.status(400).json({ error: 'Tipe transaksi dan nominal valid wajib diisi' });
    }

    let targetTabungan: any = null;
    if (tipe === 'masuk' && alokasiDana === 'tabungan_target' && tabunganId) {
      targetTabungan = (db.tabunganTargets || []).find((t: any) => t.id === tabunganId);
    }

    const newTx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      tipe: tipe === 'masuk' ? 'masuk' : 'keluar',
      judul: judul || (targetTabungan ? `Setoran Tabungan: ${targetTabungan.tujuan}` : (tipe === 'masuk' ? 'Setoran Kas' : 'Pembelanjaan Kas')),
      nominal: Number(nominal),
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      waktu: waktu || new Date().toTimeString().substring(0, 5),
      kategori: kategori || (targetTabungan ? 'Tabungan Khusus' : (tipe === 'masuk' ? 'Iuran Wajib' : 'Operasional')),
      anggotaId: anggotaId || undefined,
      namaPihak: namaPihak || (tipe === 'masuk' ? 'Anggota Kas' : 'Pihak Luar/Toko'),
      keterangan: keterangan || '',
      buktiFotoUrl: buktiFotoUrl || undefined,
      buktiFotoName: buktiFotoName || undefined,
      sumberInput: sumberInput || 'manual',
      alokasiDana: (tipe === 'masuk' && alokasiDana === 'tabungan_target' && targetTabungan) ? 'tabungan_target' : 'kas_umum',
      tabunganId: targetTabungan ? targetTabungan.id : undefined,
      namaTabungan: targetTabungan ? targetTabungan.tujuan : undefined,
      createdAt: new Date().toISOString(),
    };

    db.transactions = db.transactions || [];
    db.transactions.push(newTx);

    if (targetTabungan) {
      const newSetoran = {
        id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        tabunganId: targetTabungan.id,
        anggotaId: newTx.anggotaId || '',
        namaAnggota: newTx.namaPihak || 'Anggota',
        nominal: newTx.nominal,
        tanggal: newTx.tanggal,
        waktu: newTx.waktu,
        catatan: newTx.keterangan || `Setoran Tabungan: ${targetTabungan.tujuan}`,
        buktiFotoUrl: newTx.buktiFotoUrl,
        transaksiKasId: newTx.id,
        createdAt: new Date().toISOString(),
      };
      db.setoranTabungan = db.setoranTabungan || [];
      db.setoranTabungan.push(newSetoran);

      if (newTx.anggotaId) {
        targetTabungan.anggotaIds = targetTabungan.anggotaIds || [];
        if (!targetTabungan.anggotaIds.includes(newTx.anggotaId)) {
          targetTabungan.anggotaIds.push(newTx.anggotaId);
        }
      }
    }

    if (newTx.tipe === 'masuk' && newTx.anggotaId && db.members) {
      const member = db.members.find((m: any) => m.id === newTx.anggotaId);
      if (member) {
        member.totalSetoran = (member.totalSetoran || 0) + newTx.nominal;
      }
    }

    await writeDb(db);
    res.status(201).json(newTx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const index = (db.transactions || []).findIndex((t: any) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const oldTx = db.transactions[index];
    const updated = {
      ...oldTx,
      ...req.body,
      nominal: Number(req.body.nominal ?? oldTx.nominal),
      id: oldTx.id,
      createdAt: oldTx.createdAt,
    };

    db.transactions[index] = updated;

    if (db.setoranTabungan) {
      const linkedSetoran = db.setoranTabungan.find((s: any) => s.transaksiKasId === id);
      if (linkedSetoran) {
        linkedSetoran.nominal = updated.nominal;
        linkedSetoran.tanggal = updated.tanggal;
        linkedSetoran.waktu = updated.waktu;
        if (updated.namaPihak) linkedSetoran.namaAnggota = updated.namaPihak;
        if (updated.anggotaId) linkedSetoran.anggotaId = updated.anggotaId;
        if (updated.keterangan) linkedSetoran.catatan = updated.keterangan;
      }
    }

    await writeDb(db);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const initialLen = db.transactions ? db.transactions.length : 0;
    db.transactions = (db.transactions || []).filter((t: any) => t.id !== id);

    if (db.transactions.length === initialLen) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    if (db.setoranTabungan) {
      db.setoranTabungan = db.setoranTabungan.filter((s: any) => s.transaksiKasId !== id);
    }

    await writeDb(db);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Members CRUD
app.get('/api/members', async (req, res) => {
  try {
    const db = await readDb();
    const memberSetoranMap: Record<string, number> = {};
    for (const t of db.transactions || []) {
      if (t.tipe === 'masuk' && t.anggotaId) {
        memberSetoranMap[t.anggotaId] = (memberSetoranMap[t.anggotaId] || 0) + (Number(t.nominal) || 0);
      }
    }

    const members = (db.members || []).map((m: any) => ({
      ...m,
      totalSetoran: memberSetoranMap[m.id] ?? (m.totalSetoran || 0),
    }));

    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const db = await readDb();
    const { nama, noHp, alamat, status, nomorAnggota } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ error: 'Nama anggota wajib diisi' });
    }

    const count = (db.members || []).length + 1;
    const generatedCode = 'KOP-' + String(count).padStart(3, '0');

    const newMember = {
      id: 'mbr-' + Date.now(),
      nomorAnggota: nomorAnggota?.trim() || generatedCode,
      nama: nama.trim(),
      noHp: noHp?.trim() || '',
      alamat: alamat?.trim() || '',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      status: status === 'nonaktif' ? 'nonaktif' : 'aktif',
      totalSetoran: 0,
    };

    db.members = db.members || [];
    db.members.push(newMember);
    await writeDb(db);
    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const index = (db.members || []).findIndex((m: any) => m.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    }

    const oldMember = db.members[index];
    const updated = {
      ...oldMember,
      ...req.body,
      id: oldMember.id,
    };

    db.members[index] = updated;
    await writeDb(db);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    db.members = (db.members || []).filter((m: any) => m.id !== id);
    if (Array.isArray(db.tabunganTargets)) {
      db.tabunganTargets.forEach((t: any) => {
        if (Array.isArray(t.anggotaIds)) {
          t.anggotaIds = t.anggotaIds.filter((aid: string) => aid !== id);
        }
      });
    }
    await writeDb(db);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------
// TABUNGAN TARGET / KHUSUS CRUD
// ---------------------------------------------
app.get('/api/tabungan', async (req, res) => {
  try {
    const db = await readDb();
    const tabunganList = db.tabunganTargets || [];
    const setoranList = db.setoranTabungan || [];

    const results = tabunganList.map((tab: any) => {
      const pesertIds = tab.anggotaIds || [];
      const tabSetoran = setoranList.filter((s: any) => s.tabunganId === tab.id);
      const totalTerkumpul = tabSetoran.reduce((acc: number, s: any) => acc + (Number(s.nominal) || 0), 0);
      const targetPerOrang = Number(tab.targetPerOrang) || 0;
      const totalTargetKeseluruhan = targetPerOrang * pesertIds.length;
      const saldoAkhirKekurangan = Math.max(0, totalTargetKeseluruhan - totalTerkumpul);
      const persentaseTerkumpul = totalTargetKeseluruhan > 0
        ? Math.min(100, Math.round((totalTerkumpul / totalTargetKeseluruhan) * 100))
        : 0;

      return {
        ...tab,
        jumlahPeserta: pesertIds.length,
        totalTargetKeseluruhan,
        totalTerkumpul,
        saldoAkhirKekurangan,
        persentaseTerkumpul,
        setoranCount: tabSetoran.length,
      };
    });

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tabungan/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const tab = (db.tabunganTargets || []).find((t: any) => t.id === id);

    if (!tab) {
      return res.status(404).json({ error: 'Program tabungan tidak ditemukan' });
    }

    const setoranList = (db.setoranTabungan || []).filter((s: any) => s.tabunganId === tab.id);
    const members = db.members || [];
    const targetPerOrang = Number(tab.targetPerOrang) || 0;
    const pesertIds = tab.anggotaIds || [];

    const pesertaProgress = pesertIds.map((mbrId: string) => {
      const memberObj = members.find((m: any) => m.id === mbrId);
      const memberSetoran = setoranList.filter((s: any) => s.anggotaId === mbrId);
      const totalDisetor = memberSetoran.reduce((acc: number, s: any) => acc + (Number(s.nominal) || 0), 0);
      const saldoAkhirKekurangan = Math.max(0, targetPerOrang - totalDisetor);
      const persentase = targetPerOrang > 0 ? Math.min(100, Math.round((totalDisetor / targetPerOrang) * 100)) : 0;

      return {
        anggotaId: mbrId,
        nomorAnggota: memberObj?.nomorAnggota || '-',
        nama: memberObj?.nama || 'Anggota ' + mbrId,
        noHp: memberObj?.noHp || '',
        targetPerOrang,
        totalDisetor,
        saldoAkhirKekurangan,
        persentase,
        isLunas: totalDisetor >= targetPerOrang,
        setoranHistory: memberSetoran,
      };
    });

    const totalTerkumpul = setoranList.reduce((acc: number, s: any) => acc + (Number(s.nominal) || 0), 0);
    const totalTargetKeseluruhan = targetPerOrang * pesertIds.length;
    const saldoAkhirKekurangan = Math.max(0, totalTargetKeseluruhan - totalTerkumpul);
    const persentaseTerkumpul = totalTargetKeseluruhan > 0
      ? Math.min(100, Math.round((totalTerkumpul / totalTargetKeseluruhan) * 100))
      : 0;

    res.json({
      ...tab,
      jumlahPeserta: pesertIds.length,
      totalTargetKeseluruhan,
      totalTerkumpul,
      saldoAkhirKekurangan,
      persentaseTerkumpul,
      pesertaProgress,
      setoranCount: setoranList.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tabungan', async (req, res) => {
  try {
    const db = await readDb();
    const {
      tujuan,
      deskripsi,
      targetPerOrang,
      targetWaktuBulan,
      tanggalMulai,
      tanggalTargetSelesai,
      minimalSetoran,
      anggotaIds,
    } = req.body;

    if (!tujuan || !tujuan.trim()) {
      return res.status(400).json({ error: 'Tujuan tabungan wajib diisi' });
    }

    const targetNominal = Number(targetPerOrang);
    if (!targetNominal || targetNominal <= 0) {
      return res.status(400).json({ error: 'Target setoran per orang harus lebih dari 0' });
    }

    const targetBulan = Number(targetWaktuBulan) || 10;
    const startDt = tanggalMulai || new Date().toISOString().split('T')[0];

    let endDt = tanggalTargetSelesai;
    if (!endDt) {
      const d = new Date(startDt);
      d.setMonth(d.getMonth() + targetBulan);
      endDt = d.toISOString().split('T')[0];
    }

    let selectedAnggotaIds = Array.isArray(anggotaIds) && anggotaIds.length > 0
      ? anggotaIds
      : (db.members || []).filter((m: any) => m.status === 'aktif').map((m: any) => m.id);

    const newTabungan = {
      id: 'tab-' + Date.now(),
      tujuan: tujuan.trim(),
      deskripsi: deskripsi?.trim() || '',
      targetPerOrang: targetNominal,
      targetWaktuBulan: targetBulan,
      tanggalMulai: startDt,
      tanggalTargetSelesai: endDt,
      minimalSetoran: Number(minimalSetoran) || 0,
      anggotaIds: selectedAnggotaIds,
      status: 'aktif',
      createdAt: new Date().toISOString(),
    };

    db.tabunganTargets = db.tabunganTargets || [];
    db.tabunganTargets.push(newTabungan);
    await writeDb(db);

    res.status(201).json(newTabungan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tabungan/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const index = (db.tabunganTargets || []).findIndex((t: any) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Program tabungan tidak ditemukan' });
    }

    const oldTab = db.tabunganTargets[index];
    const updated = {
      ...oldTab,
      ...req.body,
      targetPerOrang: req.body.targetPerOrang ? Number(req.body.targetPerOrang) : oldTab.targetPerOrang,
      targetWaktuBulan: req.body.targetWaktuBulan ? Number(req.body.targetWaktuBulan) : oldTab.targetWaktuBulan,
      minimalSetoran: req.body.minimalSetoran !== undefined ? Number(req.body.minimalSetoran) : oldTab.minimalSetoran,
      id: oldTab.id,
      createdAt: oldTab.createdAt,
    };

    db.tabunganTargets[index] = updated;
    await writeDb(db);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tabungan/:id', async (req, res) => {
  try {
    const db = await readDb();
    const id = req.params.id;
    const initialLen = db.tabunganTargets ? db.tabunganTargets.length : 0;
    db.tabunganTargets = (db.tabunganTargets || []).filter((t: any) => t.id !== id);

    if (db.tabunganTargets.length === initialLen) {
      return res.status(404).json({ error: 'Program tabungan tidak ditemukan' });
    }

    db.setoranTabungan = (db.setoranTabungan || []).filter((s: any) => s.tabunganId !== id);

    await writeDb(db);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setoran Tabungan Endpoints
app.get('/api/tabungan/:id/setoran', async (req, res) => {
  try {
    const db = await readDb();
    const tabId = req.params.id;
    const list = (db.setoranTabungan || [])
      .filter((s: any) => s.tabunganId === tabId)
      .sort((a: any, b: any) => new Date(b.tanggal + 'T' + (b.waktu || '00:00')).getTime() -
                                new Date(a.tanggal + 'T' + (a.waktu || '00:00')).getTime());
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tabungan/:id/setoran', async (req, res) => {
  try {
    const db = await readDb();
    const tabId = req.params.id;
    const tab = (db.tabunganTargets || []).find((t: any) => t.id === tabId);

    if (!tab) {
      return res.status(404).json({ error: 'Program tabungan tidak ditemukan' });
    }

    const { anggotaId, nominal, tanggal, waktu, catatan, buktiFotoUrl, catatKeBukuKas } = req.body;

    if (!anggotaId) {
      return res.status(400).json({ error: 'Pilih anggota penyetor tabungan' });
    }

    const nom = Number(nominal);
    if (!nom || nom <= 0) {
      return res.status(400).json({ error: 'Nominal setoran tabungan harus lebih dari 0' });
    }

    const member = (db.members || []).find((m: any) => m.id === anggotaId);
    const namaAnggota = member ? member.nama : 'Anggota';

    let transaksiKasId: string | undefined = undefined;

    if (catatKeBukuKas) {
      const newTx = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        tipe: 'masuk',
        judul: 'Setoran Tabungan: ' + tab.tujuan,
        nominal: nom,
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        waktu: waktu || new Date().toTimeString().substring(0, 5),
        kategori: 'Tabungan Khusus',
        anggotaId: anggotaId,
        namaPihak: namaAnggota,
        keterangan: (catatan ? catatan + ' - ' : '') + 'Program Tabungan: ' + tab.tujuan,
        buktiFotoUrl: buktiFotoUrl || undefined,
        sumberInput: 'manual',
        createdAt: new Date().toISOString(),
      };

      db.transactions = db.transactions || [];
      db.transactions.push(newTx);
      transaksiKasId = newTx.id;

      if (member) {
        member.totalSetoran = (member.totalSetoran || 0) + nom;
      }
    }

    const newSetoran = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      tabunganId: tabId,
      anggotaId,
      namaAnggota,
      nominal: nom,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      waktu: waktu || new Date().toTimeString().substring(0, 5),
      catatan: catatan || '',
      buktiFotoUrl: buktiFotoUrl || undefined,
      transaksiKasId,
      createdAt: new Date().toISOString(),
    };

    db.setoranTabungan = db.setoranTabungan || [];
    db.setoranTabungan.push(newSetoran);
    await writeDb(db);

    res.status(201).json(newSetoran);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tabungan/:id/setoran/:setoranId', async (req, res) => {
  try {
    const db = await readDb();
    const { id: tabId, setoranId } = req.params;

    const targetSetoran = (db.setoranTabungan || []).find((s: any) => s.id === setoranId && s.tabunganId === tabId);
    if (!targetSetoran) {
      return res.status(404).json({ error: 'Data setoran tidak ditemukan' });
    }

    if (targetSetoran.transaksiKasId && db.transactions) {
      db.transactions = db.transactions.filter((t: any) => t.id !== targetSetoran.transaksiKasId);
    }

    db.setoranTabungan = (db.setoranTabungan || []).filter((s: any) => s.id !== setoranId);
    await writeDb(db);

    res.json({ success: true, setoranId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------
// Gemini AI Vision Endpoint: Scan Bukti Transfer / Struk Belanja
// ---------------------------------------------
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Gambar bukti transfer atau struk diperlukan' });
    }

    let cleanBase64 = imageBase64;
    let detectedMime = mimeType || 'image/jpeg';
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '') || detectedMime;
      cleanBase64 = parts[1];
    }

    const ai = getGeminiClient();
    const today = new Date().toISOString().split('T')[0];

    if (ai) {
      try {
        const systemPrompt = `Anda adalah asisten cerdas AI untuk aplikasi bendahara "Kas Kopdes" (Kas Komunitas & Perkumpulan Desa).
Tugas Anda adalah membaca dan menganalisis foto bukti transfer bank atau struk / nota pembelanjaan dengan teliti.

ATURAN KLASIFIKASI TIPE:
1. 'masuk':
   - Bukti transfer bank (BCA, BRI, Mandiri, BNI, BSI, CIMB, Seabank, Jago, Dana, Gopay, OVO, QRIS masuk, dll).
   - Slip setoran tunai bank, bukti transfer m-banking, resi ATM setoran kas.
   - Kata kunci: "Transfer Berhasil", "Bukti Transfer", "Transaksi Berhasil", "Berhasil Kirim", "Setoran", "Payment Success".

2. 'keluar':
   - Struk kasir, nota kontan, bon belanja toko, invoice pembelian barang/jasa, bukti pembayaran listrik/air/konsumsi.
   - Kata kunci: "Total Belanja", "Cash/Tunai", "Kembalian", "Subtotal", "Kasir", "Minimarket", "Toko", "Warung", "Resto", "Receipt".

EKSTRAKSI FIELD:
- tipe: harus tepat string 'masuk' atau 'keluar'.
- nominal: nominal angka rupiah total (hanya integer positif, misal 50000, 125000, tanpa simbol Rp atau titik/koma).
- tanggal: tanggal transaksi dalam format YYYY-MM-DD. Jika tanggal tidak terbaca jelas, gunakan "${today}".
- judul: ringkasan singkat transaksi (misal "Setoran Kas via BRI", "Belanja Snack & Konsumsi Rapat", "Beli Kertas HVS & ATK").
- kategori: pilih satu kategori yang paling relevan:
   Jika 'masuk': 'Iuran Wajib', 'Iuran Sukarela', 'Uang Pangkal', 'Donasi Kas', 'Dana Bantuan', atau 'Lain-lain Masuk'.
   Jika 'keluar': 'Konsumsi', 'ATK & Cetak', 'Operasional', 'Peralatan', 'Transportasi', 'Sosial & Santunan', atau 'Lain-lain Keluar'.
- namaPihak: jika bukti transfer (masuk), ekstrak nama pengirim/penyetor; jika struk belanja (keluar), ekstrak nama toko/merchant/penjual.
- keterangan: rincian tambahan (nomor referensi bank, bank tujuan, rincian barang yang dibeli).
- confidence: angka desimal antara 0.5 - 0.99 yang menggambarkan kejelasan struk.
- detectedText: ringkasan teks 1-3 kalimat yang terbaca pada struk.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: cleanBase64,
                },
              },
              {
                text: 'Analisis foto bukti transfer / struk ini dan ekstrak informasi kas sesuai format JSON yang diminta.',
              },
            ],
          },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tipe: { type: Type.STRING, description: "'masuk' atau 'keluar'" },
                nominal: { type: Type.INTEGER, description: 'Jumlah uang dalam rupiah' },
                tanggal: { type: Type.STRING, description: 'Format YYYY-MM-DD' },
                judul: { type: Type.STRING, description: 'Judul singkat transaksi' },
                kategori: { type: Type.STRING, description: 'Kategori transaksi' },
                namaPihak: { type: Type.STRING, description: 'Nama pengirim / toko' },
                keterangan: { type: Type.STRING, description: 'Detail / nomor referensi' },
                confidence: { type: Type.NUMBER, description: '0.0 - 1.0' },
                detectedText: { type: Type.STRING, description: 'Ringkasan teks terbaca' },
              },
              required: ['tipe', 'nominal', 'tanggal', 'judul', 'kategori', 'namaPihak'],
            },
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText);

        const result = {
          tipe: parsed.tipe === 'masuk' ? 'masuk' : 'keluar',
          nominal: Number(parsed.nominal) || 50000,
          tanggal: parsed.tanggal || today,
          judul: parsed.judul || (parsed.tipe === 'masuk' ? 'Setoran Kas Anggota' : 'Pembelian Keperluan Kas'),
          kategori: parsed.kategori || (parsed.tipe === 'masuk' ? 'Iuran Wajib' : 'Operasional'),
          namaPihak: parsed.namaPihak || (parsed.tipe === 'masuk' ? 'Anggota Perkumpulan' : 'Toko / Rekanan'),
          keterangan: parsed.keterangan || 'Terdeteksi otomatis via AI OCR Scan',
          confidence: parsed.confidence || 0.92,
          detectedText: parsed.detectedText || 'Teks berhasil dipindai oleh Gemini AI',
        };

        return res.json({
          success: true,
          data: result,
          mode: 'gemini-ai',
        });
      } catch (geminiError: any) {
        console.warn('Gemini OCR error, falling back to smart defaults:', geminiError?.message || geminiError);
      }
    }

    res.json({
      success: true,
      mode: 'fallback',
      data: {
        tipe: 'masuk',
        nominal: 50000,
        tanggal: today,
        judul: 'Setoran Kas Komunitas',
        kategori: 'Iuran Wajib',
        namaPihak: 'Anggota Kas Kopdes',
        keterangan: 'Bukti foto tersimpan. Silakan verifikasi nominal dan kategori.',
        confidence: 0.75,
        detectedText: 'Foto struk/bukti transfer berhasil diunggah. Silakan konfirmasi tipe Uang Masuk atau Uang Keluar.',
      },
    });
  } catch (error: any) {
    console.error('Scan receipt handler error:', error);
    res.status(500).json({ error: 'Gagal menganalisis gambar: ' + (error?.message || 'Unknown error') });
  }
});

// File ini sengaja tidak berisi app.listen() atau middleware Vite.
// File ini murni berisi Express app + semua route API + koneksi database,
// dipakai bersama oleh api/index.ts (Vercel) dan server.ts (dev lokal/Railway/Render).
