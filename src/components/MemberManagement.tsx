import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  MessageCircle,
  DollarSign,
  X,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { Anggota } from '../types';
import { formatRupiah, formatTanggalSingkat } from '../utils/formatters';

interface MemberManagementProps {
  members: Anggota[];
  onAddMember: (memberData: Omit<Anggota, 'id'>) => Promise<void>;
  onUpdateMember: (id: string, memberData: Partial<Anggota>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Anggota | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Anggota | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [nomorAnggota, setNomorAnggota] = useState('');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingMember(null);
    const nextNum = 'KOP-' + String(members.length + 1).padStart(3, '0');
    setNomorAnggota(nextNum);
    setNama('');
    setNoHp('');
    setAlamat('');
    setStatus('aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (m: Anggota) => {
    setEditingMember(m);
    setNomorAnggota(m.nomorAnggota);
    setNama(m.nama);
    setNoHp(m.noHp);
    setAlamat(m.alamat);
    setStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama anggota wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMember) {
        await onUpdateMember(editingMember.id, {
          nomorAnggota: nomorAnggota.trim(),
          nama: nama.trim(),
          noHp: noHp.trim(),
          alamat: alamat.trim(),
          status,
        });
      } else {
        await onAddMember({
          nomorAnggota: nomorAnggota.trim() || 'KOP-' + String(members.length + 1).padStart(3, '0'),
          nama: nama.trim(),
          noHp: noHp.trim(),
          alamat: alamat.trim(),
          tanggalBergabung: new Date().toISOString().split('T')[0],
          status,
          totalSetoran: 0,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Gagal menyimpan anggota: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.nama.toLowerCase().includes(term) ||
      m.nomorAnggota.toLowerCase().includes(term) ||
      m.alamat.toLowerCase().includes(term) ||
      m.noHp.includes(term)
    );
  });

  const formatWhatsAppUrl = (phone: string, memberName: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${memberName}, ini pemberitahuan dari Bendahara Kas Kopdes.`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-[#0D0D0F] rounded-2xl p-4 sm:p-5 shadow-xs border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Daftar Anggota / Member Kas
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola data anggota komunitas/perkumpulan, rekap iuran dan informasi kontak
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Tambah Anggota
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari anggota berdasarkan nama, nomor anggota, atau alamat..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#0D0D0F] border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 shadow-xs"
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

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-[#0D0D0F] rounded-2xl p-8 text-center border border-zinc-800">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <p className="font-semibold text-zinc-300 text-sm">
              Belum ada anggota yang terdaftar
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Klik tombol "+ Tambah Anggota" untuk mendaftarkan anggota baru
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-[#0D0D0F] rounded-2xl p-4 border border-zinc-800 hover:border-zinc-700/80 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded-md border border-zinc-700">
                        {member.nomorAnggota}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          member.status === 'aktif'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {member.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-zinc-100 mt-1.5">
                      {member.nama}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Data Anggota"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMemberToDelete(member)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Hapus Anggota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-800">
                  {member.noHp && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{member.noHp}</span>
                      </span>
                      <a
                        href={formatWhatsAppUrl(member.noHp, member.nama)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md hover:bg-emerald-900/50 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                        Chat WA
                      </a>
                    </div>
                  )}

                  {member.alamat && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{member.alamat}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Gabung: {formatTanggalSingkat(member.tanggalBergabung)}</span>
                  </div>
                </div>
              </div>

              {/* Total Setoran Card Strip */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/70 -mx-4 -mb-4 p-3 rounded-b-2xl">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Total Setoran Masuk:
                </span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {formatRupiah(member.totalSetoran || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-[#0D0D0F] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-black text-white border-b border-zinc-800">
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nomor Anggota *
                </label>
                <input
                  type="text"
                  required
                  value={nomorAnggota}
                  onChange={(e) => setNomorAnggota(e.target.value)}
                  placeholder="Contoh: KOP-001"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-mono text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama Lengkap Anggota *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Alamat / Unit / RT-RW
                </label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Dusun Sukamaju RT 02/RW 03"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Status Anggota
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="aktif">Aktif (Berhak mengikuti iuran kas)</option>
                  <option value="nonaktif">Non-Aktif (Cuti / Pindah)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-zinc-400 hover:bg-zinc-800 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS ANGGOTA (Elegant Dark Dialog) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0D0D0F] border border-zinc-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Hapus Data Anggota?</h4>
                <p className="text-xs text-zinc-400">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p className="font-semibold text-white">
                {memberToDelete.nama}{' '}
                <span className="text-zinc-500 font-normal font-mono">
                  ({memberToDelete.nomorAnggota})
                </span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Total Setoran Tercatat:{' '}
                <strong className="text-emerald-400">
                  {formatRupiah(memberToDelete.totalSetoran || 0)}
                </strong>
              </p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus anggota ini dari perkumpulan? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteMember(memberToDelete.id);
                    setMemberToDelete(null);
                  } catch (err: any) {
                    console.error('Gagal menghapus:', err);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
