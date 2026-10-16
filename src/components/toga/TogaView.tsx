import React, { useState, useMemo } from 'react';
import {
  Sprout,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Scissors,
  ShoppingBag,
  Apple,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { TanamanToga, KategoriToga, DasawismaName } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TogaView: React.FC = () => {
  const {
    togaList,
    addToga,
    updateToga,
    deleteToga,
    catatPanenToga,
    profil,
    searchGlobal,
    totalPolybagToga,
    togaSiapPanenCount,
  } = usePKK();

  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingToga, setEditingToga] = useState<TanamanToga | null>(null);
  const [detailToga, setDetailToga] = useState<TanamanToga | null>(null);
  const [panenModalToga, setPanenModalToga] = useState<TanamanToga | null>(null);
  const [panenKg, setPanenKg] = useState<number>(2);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialForm: Omit<TanamanToga, 'id'> = {
    namaTanaman: '',
    namaLatin: '',
    kategori: 'Rimpang & Umbi',
    khasiat: '',
    caraPemanfaatan: 'Direbus atau diseduh menjadi simplisia herbal',
    jumlahPolybag: 10,
    lokasiDasawisma: 'Pekarangan HATINYA PKK RT',
    tanggalTanam: new Date().toISOString().split('T')[0],
    statusPanen: 'Masa Pertumbuhan',
    penanggungJawab: profil.namaKetua,
    catatan: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const effectiveSearch = search || searchGlobal;

  const filteredToga = useMemo(() => {
    return togaList.filter((t) => {
      const matchSearch =
        t.namaTanaman.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (t.namaLatin && t.namaLatin.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
        t.khasiat.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        t.lokasiDasawisma.toLowerCase().includes(effectiveSearch.toLowerCase());

      const matchKat = filterKategori === 'Semua' || t.kategori === filterKategori;
      const matchStat = filterStatus === 'Semua' || t.statusPanen === filterStatus;

      return matchSearch && matchKat && matchStat;
    });
  }, [togaList, effectiveSearch, filterKategori, filterStatus]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingToga(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: TanamanToga) => {
    setEditingToga(t);
    setFormData({
      namaTanaman: t.namaTanaman,
      namaLatin: t.namaLatin || '',
      kategori: t.kategori,
      khasiat: t.khasiat,
      caraPemanfaatan: t.caraPemanfaatan,
      jumlahPolybag: t.jumlahPolybag,
      lokasiDasawisma: t.lokasiDasawisma,
      tanggalTanam: t.tanggalTanam,
      statusPanen: t.statusPanen,
      hasilPanenKg: t.hasilPanenKg,
      penanggungJawab: t.penanggungJawab,
      catatan: t.catatan || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaTanaman.trim()) return;

    if (editingToga) {
      updateToga(editingToga.id, formData);
    } else {
      addToga(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleConfirmPanen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panenModalToga || panenKg <= 0) return;
    catatPanenToga(panenModalToga.id, panenKg);
    setPanenModalToga(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Inventaris TOGA & HATINYA PKK
            </h2>
            <Badge variant="emerald" size="sm">
              {filteredToga.length} Varietas
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerakan Halaman Asri, Teratur, Indah dan Nyaman (POKJA III) & Potensi UP2K Herbal (POKJA II)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-tambah-toga"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tanaman TOGA</span>
          </button>
        </div>
      </div>

      {/* Mini Stat Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Polybag</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {totalPolybagToga} Pot / Polybag
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Siap Panen</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {togaSiapPanenCount} Varietas
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Potensi UP2K</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Jamu & Simplisia
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Apple className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">HATINYA PKK</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Pangan B2SA
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-toga"
              placeholder="Cari nama tanaman, latin, khasiat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kategori Tanaman</option>
              <option value="Rimpang & Umbi">Rimpang & Umbi</option>
              <option value="Daun & Herbal">Daun & Herbal</option>
              <option value="Batang & Kulit">Batang & Kulit</option>
              <option value="Buah & Biji">Buah & Biji</option>
              <option value="Bunga">Bunga</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status Pertumbuhan</option>
              <option value="Siap Panen">Siap Panen</option>
              <option value="Masa Pertumbuhan">Masa Pertumbuhan</option>
              <option value="Telah Dipanen">Telah Dipanen</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOGA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredToga.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Belum ada data tanaman TOGA yang cocok dengan pencarian.
          </div>
        ) : (
          filteredToga.map((t) => (
            <div
              key={t.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="emerald" size="sm">
                    {t.kategori}
                  </Badge>

                  <Badge
                    variant={
                      t.statusPanen === 'Siap Panen'
                        ? 'emerald'
                        : t.statusPanen === 'Masa Pertumbuhan'
                        ? 'blue'
                        : 'amber'
                    }
                    dot
                    size="sm"
                  >
                    {t.statusPanen}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.namaTanaman}
                  </h3>
                  {t.namaLatin && (
                    <p className="text-xs text-slate-400 italic">{t.namaLatin}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between font-medium">
                    <span>Jumlah Polybag:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {t.jumlahPolybag} Pot
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lokasi:</span>
                    <span className="truncate max-w-[150px] font-medium">{t.lokasiDasawisma}</span>
                  </div>
                  {t.hasilPanenKg ? (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Total Panen:</span>
                      <span className="font-bold">{t.hasilPanenKg} kg</span>
                    </div>
                  ) : null}
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Khasiat Herbal:</span>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{t.khasiat}</p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDetailToga(t)}
                    title="Rincian Khasiat & Resep"
                    className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    title="Edit Tanaman"
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingId(t.id)}
                    title="Hapus Tanaman"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {t.statusPanen === 'Siap Panen' ? (
                  <button
                    onClick={() => {
                      setPanenModalToga(t);
                      setPanenKg(2);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Catat Panen</span>
                  </button>
                ) : (
                  <button
                    onClick={() => updateToga(t.id, { statusPanen: 'Siap Panen' })}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Siap Panen</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Tanaman TOGA */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingToga ? 'Ubah Data Tanaman TOGA' : 'Tambah Tanaman TOGA / HATINYA PKK'}
        subtitle={`Inventarisasi pekarangan TP PKK ${profil.namaRT}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Tanaman TOGA *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Jahe Merah / Daun Sirih"
                value={formData.namaTanaman || ''}
                onChange={(e) => setFormData({ ...formData, namaTanaman: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Ilmiah / Latin
              </label>
              <input
                type="text"
                placeholder="Contoh: Zingiber officinale var. rubrum"
                value={formData.namaLatin || ''}
                onChange={(e) => setFormData({ ...formData, namaLatin: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Tanaman *
              </label>
              <select
                value={formData.kategori || 'Rimpang & Umbi'}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as KategoriToga })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Rimpang & Umbi">Rimpang & Umbi</option>
                <option value="Daun & Herbal">Daun & Herbal</option>
                <option value="Batang & Kulit">Batang & Kulit</option>
                <option value="Buah & Biji">Buah & Biji</option>
                <option value="Bunga">Bunga</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Pertumbuhan *
              </label>
              <select
                value={formData.statusPanen || 'Masa Pertumbuhan'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusPanen: e.target.value as 'Masa Pertumbuhan' | 'Siap Panen' | 'Telah Dipanen',
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Masa Pertumbuhan">Masa Pertumbuhan</option>
                <option value="Siap Panen">Siap Panen</option>
                <option value="Telah Dipanen">Telah Dipanen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Polybag / Pot *
              </label>
              <input
                type="number"
                min={1}
                value={formData.jumlahPolybag ?? 1}
                onChange={(e) =>
                  setFormData({ ...formData, jumlahPolybag: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi Dasawisma / Kebun
              </label>
              <select
                value={formData.lokasiDasawisma || 'Pekarangan HATINYA PKK RT'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lokasiDasawisma: e.target.value as DasawismaName | 'Pekarangan HATINYA PKK RT',
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Pekarangan HATINYA PKK RT">Pekarangan HATINYA PKK RT</option>
                <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Tanam
              </label>
              <input
                type="date"
                value={formData.tanggalTanam || ''}
                onChange={(e) => setFormData({ ...formData, tanggalTanam: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Penanggung Jawab
              </label>
              <input
                type="text"
                value={formData.penanggungJawab || ''}
                onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Khasiat & Manfaat Kesehatan *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Mengobati masuk angin, meningkatkan imunitas, meredakan batuk..."
              value={formData.khasiat || ''}
              onChange={(e) => setFormData({ ...formData, khasiat: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cara Pengolahan / Pemanfaatan
            </label>
            <input
              type="text"
              placeholder="Contoh: Direbus, diseduh menjadi jamu hangat atau simplisia kering"
              value={formData.caraPemanfaatan || ''}
              onChange={(e) => setFormData({ ...formData, caraPemanfaatan: e.target.value })}
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
              {editingToga ? 'Simpan Perubahan' : 'Simpan Data TOGA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Panen TOGA */}
      <Modal
        isOpen={!!panenModalToga}
        onClose={() => setPanenModalToga(null)}
        title="Catat Hasil Panen TOGA"
        maxWidth="sm"
      >
        {panenModalToga && (
          <form onSubmit={handleConfirmPanen} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Mencatat hasil panen tanaman <strong>{panenModalToga.namaTanaman}</strong> untuk
              kegiatan warga atau usaha bersama UP2K PKK.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Berat Hasil Panen (Kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={panenKg}
                onChange={(e) => setPanenKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPanenModalToga(null)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                Simpan Panen
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Detail TOGA */}
      <Modal
        isOpen={!!detailToga}
        onClose={() => setDetailToga(null)}
        title="Rincian Tanaman TOGA & Potensi UP2K"
        maxWidth="md"
      >
        {detailToga && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="emerald" size="sm">
                  {detailToga.kategori}
                </Badge>
                <Badge
                  variant={detailToga.statusPanen === 'Siap Panen' ? 'emerald' : 'blue'}
                  size="sm"
                >
                  {detailToga.statusPanen}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {detailToga.namaTanaman}
              </h3>
              {detailToga.namaLatin && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
                  {detailToga.namaLatin}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="block text-slate-400 text-[10px]">Jumlah Pot:</span>
                <span className="font-bold">{detailToga.jumlahPolybag} Polybag</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="block text-slate-400 text-[10px]">Lokasi:</span>
                <span className="font-bold">{detailToga.lokasiDasawisma}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="block text-slate-400 text-[10px]">Tgl Tanam:</span>
                <span className="font-bold">{detailToga.tanggalTanam}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="block text-slate-400 text-[10px]">PJ:</span>
                <span className="font-bold">{detailToga.penanggungJawab}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Khasiat & Manfaat:</h5>
              <p className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                {detailToga.khasiat}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                Cara Pemanfaatan / Resep Herbal:
              </h5>
              <p className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                {detailToga.caraPemanfaatan}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteToga(deletingId);
        }}
        title="Hapus Tanaman TOGA"
        message="Apakah Anda yakin ingin menghapus catatan tanaman ini dari inventaris TOGA?"
        confirmLabel="Hapus Tanaman"
      />
    </div>
  );
};
