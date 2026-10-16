import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  Search,
  MapPin,
  Clock,
  Users,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  FileText,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { KegiatanPKK, PokjaType, StatusKegiatan } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { printLembarNotula } from '../../utils/printHelper';

export const KegiatanView: React.FC = () => {
  const {
    kegiatanList,
    addKegiatan,
    updateKegiatan,
    deleteKegiatan,
    profil,
    searchGlobal,
    setCurrentView,
  } = usePKK();

  const [search, setSearch] = useState('');
  const [filterPokja, setFilterPokja] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<KegiatanPKK | null>(null);
  const [detailKegiatan, setDetailKegiatan] = useState<KegiatanPKK | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialForm: Omit<KegiatanPKK, 'id'> = {
    namaKegiatan: '',
    pokjaPengampu: 'Pokja I',
    programPokok: 'Pendidikan dan Keterampilan',
    tanggal: new Date().toISOString().split('T')[0],
    waktuMulai: '09:00',
    waktuSelesai: '11:30',
    lokasi: 'Balai Warga RT',
    penanggungJawab: profil.namaKetua,
    targetPeserta: 25,
    pesertaHadir: 0,
    status: 'Akan Datang',
    anggaranRencana: 150000,
    anggaranRealisasi: 0,
    deskripsi: '',
    notulensi: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const effectiveSearch = search || searchGlobal;

  const filteredKegiatan = useMemo(() => {
    return kegiatanList.filter((k) => {
      const matchSearch =
        k.namaKegiatan.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        k.lokasi.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        k.penanggungJawab.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (k.deskripsi && k.deskripsi.toLowerCase().includes(effectiveSearch.toLowerCase()));

      const matchPokja = filterPokja === 'Semua' || k.pokjaPengampu === filterPokja;
      const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;

      return matchSearch && matchPokja && matchStatus;
    });
  }, [kegiatanList, effectiveSearch, filterPokja, filterStatus]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingKegiatan(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (kgt: KegiatanPKK) => {
    setEditingKegiatan(kgt);
    setFormData({
      namaKegiatan: kgt.namaKegiatan,
      pokjaPengampu: kgt.pokjaPengampu,
      programPokok: kgt.programPokok,
      tanggal: kgt.tanggal,
      waktuMulai: kgt.waktuMulai,
      waktuSelesai: kgt.waktuSelesai,
      lokasi: kgt.lokasi,
      penanggungJawab: kgt.penanggungJawab,
      targetPeserta: kgt.targetPeserta,
      pesertaHadir: kgt.pesertaHadir || 0,
      status: kgt.status,
      anggaranRencana: kgt.anggaranRencana,
      anggaranRealisasi: kgt.anggaranRealisasi || 0,
      deskripsi: kgt.deskripsi,
      notulensi: kgt.notulensi || '',
      dokumentasiUrl: kgt.dokumentasiUrl,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKegiatan.trim()) return;

    if (editingKegiatan) {
      updateKegiatan(editingKegiatan.id, formData);
    } else {
      addKegiatan(formData);
    }
    setIsAddModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Buku V: Agenda & Giat TP PKK
            </h2>
            <Badge variant="emerald" size="sm">
              {filteredKegiatan.length} Agenda
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Jadwal kegiatan rutin, pertemuan bulanan, posyandu, dan notulensi resmi TP PKK {profil.namaRT}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-tambah-kegiatan"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Tambah Agenda Giat</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-kegiatan"
              placeholder="Cari kegiatan, lokasi, penanggung jawab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={filterPokja}
              onChange={(e) => setFilterPokja(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua POKJA</option>
              <option value="Sekretariat">Sekretariat</option>
              <option value="Pokja I">Pokja I (Pancasila & Gotong Royong)</option>
              <option value="Pokja II">Pokja II (Pendidikan & UP2K)</option>
              <option value="Pokja III">Pokja III (Pangan & HATINYA PKK)</option>
              <option value="Pokja IV">Pokja IV (Kesehatan & Posyandu)</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Sedang Berlangsung">Sedang Berlangsung</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kegiatan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKegiatan.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Belum ada kegiatan terdaftar yang cocok dengan filter.
          </div>
        ) : (
          filteredKegiatan.map((kgt) => (
            <div
              key={kgt.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      kgt.pokjaPengampu === 'Pokja I'
                        ? 'purple'
                        : kgt.pokjaPengampu === 'Pokja II'
                        ? 'blue'
                        : kgt.pokjaPengampu === 'Pokja III'
                        ? 'emerald'
                        : kgt.pokjaPengampu === 'Pokja IV'
                        ? 'rose'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {kgt.pokjaPengampu}
                  </Badge>

                  <Badge
                    variant={
                      kgt.status === 'Selesai'
                        ? 'emerald'
                        : kgt.status === 'Akan Datang'
                        ? 'blue'
                        : 'rose'
                    }
                    dot
                    size="sm"
                  >
                    {kgt.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {kgt.namaKegiatan}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{kgt.tanggal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>
                      {kgt.waktuMulai} - {kgt.waktuSelesai} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{kgt.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>
                      Target: {kgt.targetPeserta} Orang
                      {kgt.pesertaHadir ? ` (Hadir: ${kgt.pesertaHadir})` : ''}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {kgt.deskripsi || 'Tidak ada deskripsi rinci.'}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDetailKegiatan(kgt)}
                    title="Rincian & Notulensi"
                    className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(kgt)}
                    title="Edit Agenda"
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(kgt.id)}
                    title="Hapus Agenda"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentView('surat-ai')}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Surat AI</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Agenda Giat */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingKegiatan ? 'Ubah Agenda Kegiatan PKK' : 'Tambah Agenda Kegiatan Baru'}
        subtitle={`Formulir Buku V TP PKK ${profil.namaRT}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kegiatan PKK *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pertemuan Rutin & Arisan TP PKK Bulan Juni"
                value={formData.namaKegiatan || ''}
                onChange={(e) => setFormData({ ...formData, namaKegiatan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                POKJA Pengampu *
              </label>
              <select
                value={formData.pokjaPengampu || 'Pokja I'}
                onChange={(e) => setFormData({ ...formData, pokjaPengampu: e.target.value as PokjaType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Sekretariat">Sekretariat</option>
                <option value="Pokja I">Pokja I (Pancasila & Gotong Royong)</option>
                <option value="Pokja II">Pokja II (Pendidikan & UP2K)</option>
                <option value="Pokja III">Pokja III (Pangan & HATINYA PKK)</option>
                <option value="Pokja IV">Pokja IV (Kesehatan & Posyandu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Kegiatan
              </label>
              <select
                value={formData.status || 'Akan Datang'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusKegiatan })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Akan Datang">Akan Datang</option>
                <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Waktu Mulai
                </label>
                <input
                  type="time"
                  value={formData.waktuMulai || ''}
                  onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selesai
                </label>
                <input
                  type="time"
                  value={formData.waktuSelesai || ''}
                  onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi / Tempat *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Balai Pertemuan RT 04 / Rumah Ny. Siti"
                value={formData.lokasi || ''}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Penanggung Jawab (PJ)
              </label>
              <input
                type="text"
                placeholder="Nama Pengurus PJ"
                value={formData.penanggungJawab || ''}
                onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Peserta (Orang)
              </label>
              <input
                type="number"
                min={1}
                value={formData.targetPeserta ?? 1}
                onChange={(e) =>
                  setFormData({ ...formData, targetPeserta: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Realisasi Hadir (Orang)
              </label>
              <input
                type="number"
                min={0}
                value={formData.pesertaHadir ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, pesertaHadir: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi & Agenda Kegiatan
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan ringkasan susunan acara atau topik pembahasan..."
              value={formData.deskripsi || ''}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notulensi / Kesimpulan Hasil Kegiatan (Buku V)
            </label>
            <textarea
              rows={3}
              placeholder="Catat hasil rapat, keputusan, atau ringkasan notula..."
              value={formData.notulensi || ''}
              onChange={(e) => setFormData({ ...formData, notulensi: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingKegiatan ? 'Simpan Perubahan' : 'Simpan Agenda Giat'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Notulensi */}
      <Modal
        isOpen={!!detailKegiatan}
        onClose={() => setDetailKegiatan(null)}
        title="Rincian Kegiatan & Notulensi (Buku V)"
        maxWidth="lg"
      >
        {detailKegiatan && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="emerald" size="sm">
                  {detailKegiatan.pokjaPengampu}
                </Badge>
                <Badge
                  variant={
                    detailKegiatan.status === 'Selesai'
                      ? 'emerald'
                      : detailKegiatan.status === 'Akan Datang'
                      ? 'blue'
                      : 'rose'
                  }
                  size="sm"
                >
                  {detailKegiatan.status}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {detailKegiatan.namaKegiatan}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <strong>Tanggal:</strong> {detailKegiatan.tanggal}
                </div>
                <div>
                  <strong>Waktu:</strong> {detailKegiatan.waktuMulai} - {detailKegiatan.waktuSelesai} WIB
                </div>
                <div>
                  <strong>Lokasi:</strong> {detailKegiatan.lokasi}
                </div>
                <div>
                  <strong>PJ:</strong> {detailKegiatan.penanggungJawab}
                </div>
                <div>
                  <strong>Anggaran Rencana:</strong> {formatCurrency(detailKegiatan.anggaranRencana)}
                </div>
                <div>
                  <strong>Program Pokok:</strong> {detailKegiatan.programPokok}
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Deskripsi Kegiatan:</h5>
              <p className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                {detailKegiatan.deskripsi || 'Tidak ada deskripsi.'}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Notulensi & Hasil Keputusan Rapat (Buku V):
              </h5>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {detailKegiatan.notulensi || (
                  <span className="text-slate-400 italic">Belum ada notulensi tercatat.</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setDetailKegiatan(null);
                  setCurrentView('surat-ai');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buat Surat Undangan AI</span>
              </button>

              <button
                onClick={() => {
                  if (detailKegiatan) {
                    printLembarNotula(detailKegiatan, profil);
                  } else {
                    window.print();
                  }
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Cetak Lembar Notula</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteKegiatan(deletingId);
        }}
        title="Hapus Agenda Kegiatan"
        message="Apakah Anda yakin ingin menghapus agenda kegiatan ini dari Buku V TP PKK?"
        confirmLabel="Hapus Kegiatan"
      />
    </div>
  );
};
