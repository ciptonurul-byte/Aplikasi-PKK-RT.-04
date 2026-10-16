import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Edit2,
  Trash2,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Shield,
  CreditCard,
  X,
  Home,
  Camera,
  Layers,
  MessageCircle,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { AnggotaPKK, JabatanPKK, PokjaType, KartuKeluargaData, AnggotaKeluargaKK } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScanKKModal } from '../common/ScanKKModal';
import { KwitansiIuranModal } from '../keuangan/KwitansiIuranModal';
import { printKTAPKK } from '../../utils/printHelper';

export const AnggotaView: React.FC = () => {
  const {
    anggotaList,
    addAnggota,
    updateAnggota,
    deleteAnggota,
    profil,
    searchGlobal,
    keluargaList,
    addKeluarga,
    iuranList,
    updatePesertaIuran,
  } = usePKK();

  const [search, setSearch] = useState('');
  const [filterPokja, setFilterPokja] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterJabatan, setFilterJabatan] = useState<string>('Semua');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanKKOpen, setIsScanKKOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<AnggotaPKK | null>(null);
  const [viewingKta, setViewingKta] = useState<AnggotaPKK | null>(null);
  const [viewingFamilyData, setViewingFamilyData] = useState<AnggotaPKK | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showKkSuccessNotice, setShowKkSuccessNotice] = useState(false);

  // Kwitansi Iuran Modal State
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
  const [kwitansiModalData, setKwitansiModalData] = useState<{
    anggotaId: string;
    namaPenerimaIuran: string;
    noHp?: string;
    jabatan?: string;
    dasawisma?: string;
    bulanList: number[];
    tahun: number;
    nominalPerBulan: number;
    tanggalBayar?: string;
    metodeBayar?: 'Tunai' | 'Transfer';
    catatan?: string;
  } | null>(null);

  // Form State
  const initialForm: Omit<AnggotaPKK, 'id'> = {
    nik: '',
    nama: '',
    noHp: '',
    alamat: `Jl. Mawar Indah No. `,
    rt: profil.namaRT.replace('RT ', ''),
    rw: profil.namaRW.replace('RW ', ''),
    jabatan: 'Anggota Pokja',
    pokja: 'Pokja I',
    status: 'Aktif',
    tanggalBergabung: new Date().toISOString().split('T')[0],
    pekerjaan: 'Ibu Rumah Tangga',
    pendidikanTerakhir: 'SMA / SMK',
    pelatihanDiikuti: [],
    catatan: '',
    noKk: '',
    namaKepalaKeluarga: '',
    statusKeluarga: '',
    tempatLahir: '',
    tanggalLahir: '',
    anggotaKeluarga: [],
  };

  const [formData, setFormData] = useState<Omit<AnggotaPKK, 'id'>>(initialForm);
  const [newTrainingInput, setNewTrainingInput] = useState('');

  // Combine topbar search + local search
  const effectiveSearch = search || searchGlobal;

  const filteredAnggota = useMemo(() => {
    return anggotaList.filter((a) => {
      const matchSearch =
        a.nama.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        a.nik.includes(effectiveSearch) ||
        a.alamat.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        a.jabatan.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        (a.noKk && a.noKk.includes(effectiveSearch));

      const matchPokja = filterPokja === 'Semua' || a.pokja === filterPokja;
      const matchStatus = filterStatus === 'Semua' || a.status === filterStatus;
      const matchJabatan = filterJabatan === 'Semua' || a.jabatan === filterJabatan;

      return matchSearch && matchPokja && matchStatus && matchJabatan;
    });
  }, [anggotaList, effectiveSearch, filterPokja, filterStatus, filterJabatan]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingAnggota(null);
    setShowKkSuccessNotice(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (agt: AnggotaPKK) => {
    setEditingAnggota(agt);
    setShowKkSuccessNotice(false);
    setFormData({
      nik: agt.nik,
      nama: agt.nama,
      noHp: agt.noHp,
      alamat: agt.alamat,
      rt: agt.rt,
      rw: agt.rw,
      jabatan: agt.jabatan,
      pokja: agt.pokja,
      status: agt.status,
      tanggalBergabung: agt.tanggalBergabung,
      pekerjaan: agt.pekerjaan || '',
      pendidikanTerakhir: agt.pendidikanTerakhir || '',
      pelatihanDiikuti: agt.pelatihanDiikuti || [],
      catatan: agt.catatan || '',
      noKk: agt.noKk || '',
      namaKepalaKeluarga: agt.namaKepalaKeluarga || '',
      statusKeluarga: agt.statusKeluarga || '',
      tempatLahir: agt.tempatLahir || '',
      tanggalLahir: agt.tanggalLahir || '',
      anggotaKeluarga: agt.anggotaKeluarga || [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenKwitansiForMember = (agt: AnggotaPKK) => {
    const matchingIuran = iuranList.find(
      (r) => r.anggotaId === agt.id || r.namaAnggota.trim().toLowerCase() === agt.nama.trim().toLowerCase()
    );
    const matchingKK = keluargaList.find(
      (k) =>
        k.noKk === agt.noKk ||
        (k.namaIbu && k.namaIbu.trim().toLowerCase() === agt.nama.trim().toLowerCase()) ||
        (k.namaKepalaKeluarga && k.namaKepalaKeluarga.trim().toLowerCase() === agt.nama.trim().toLowerCase())
    );

    const paidMonths: number[] = [];
    let lastDate: string | undefined;
    let lastMetode: 'Tunai' | 'Transfer' = 'Tunai';
    let lastNominal = profil.iuranBulananNominal || 10000;

    if (matchingIuran?.bulan) {
      for (let m = 1; m <= 12; m++) {
        const b = matchingIuran.bulan[m];
        if (b?.lunas) {
          paidMonths.push(m);
          if (b.tanggalBayar) lastDate = b.tanggalBayar;
          if (b.metodeBayar) lastMetode = b.metodeBayar;
          if (b.nominal) lastNominal = b.nominal;
        }
      }
    }

    const currentMonth = new Date().getMonth() + 1;
    const targetMonths = paidMonths.length > 0 ? [paidMonths[paidMonths.length - 1]] : [currentMonth];

    setKwitansiModalData({
      anggotaId: matchingIuran?.anggotaId || agt.id,
      namaPenerimaIuran: agt.nama,
      noHp: agt.noHp || matchingIuran?.noHp || matchingKK?.noHpIbu || '',
      jabatan: agt.jabatan,
      dasawisma: matchingKK?.dasawisma || 'Dasawisma Flamboyan 9',
      bulanList: targetMonths,
      tahun: new Date().getFullYear(),
      nominalPerBulan: lastNominal,
      tanggalBayar: lastDate || new Date().toISOString().split('T')[0],
      metodeBayar: lastMetode,
      catatan: '',
    });
    setIsKwitansiModalOpen(true);
  };

  const handleSelectFromScanKK = (
    selectedMember: AnggotaKeluargaKK,
    kkData: KartuKeluargaData,
    saveToDasawismaToo: boolean = true
  ) => {
    setFormData((prev) => ({
      ...prev,
      nama: selectedMember.nama,
      nik: selectedMember.nik,
      alamat: `${kkData.alamat}`,
      rt: kkData.rt || prev.rt,
      rw: kkData.rw || prev.rw,
      pekerjaan: selectedMember.jenisPekerjaan || prev.pekerjaan,
      pendidikanTerakhir: selectedMember.pendidikan || prev.pendidikanTerakhir,
      tempatLahir: selectedMember.tempatLahir || '',
      tanggalLahir: selectedMember.tanggalLahir || '',
      noKk: kkData.noKk,
      namaKepalaKeluarga: kkData.namaKepalaKeluarga,
      statusKeluarga: selectedMember.statusHubungan,
      anggotaKeluarga: kkData.anggotaKeluarga,
      catatan: `Keluarga ${kkData.namaKepalaKeluarga} (${kkData.jumlahAnggotaKeluarga} Jiwa). Terverifikasi dari KK AI.`,
    }));

    if (saveToDasawismaToo) {
      const existing = keluargaList.find((k) => k.noKk === kkData.noKk);
      if (!existing) {
        addKeluarga({
          noKk: kkData.noKk,
          namaKepalaKeluarga: kkData.namaKepalaKeluarga,
          namaIbu: kkData.namaIbu || selectedMember.nama,
          alamat: kkData.alamat,
          dasawisma: 'Dasawisma Flamboyan 9',
          jumlahAnggotaKeluarga: kkData.jumlahAnggotaKeluarga || 4,
          jumlahLakiLaki: kkData.jumlahLakiLaki || 2,
          jumlahPerempuan: kkData.jumlahPerempuan || 2,
          jumlahBalita: kkData.jumlahBalita || 0,
          jumlahIbuHamil: kkData.jumlahIbuHamil || 0,
          jumlahLansia: kkData.jumlahLansia || 0,
          statusPUS: kkData.statusPUS,
          statusWUS: kkData.statusWUS,
          statusRumahSehat: true,
          memilikiJambanSehat: true,
          memilikiSPAL: true,
          memilikiTempatSampah: true,
          memilikiSumberAirBersih: true,
          memilikiPekaranganToga: true,
          makananPokok: 'Beras',
          kategoriSejahtera: 'Sejahtera II',
          anggotaKeluarga: kkData.anggotaKeluarga || [],
          catatanKesehatan: 'Sinkronisasi otomatis dari Scan KK AI Anggota.',
        });
      }
    }

    setShowKkSuccessNotice(true);
    setEditingAnggota(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    if (editingAnggota) {
      updateAnggota(editingAnggota.id, formData);
    } else {
      addAnggota(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleAddTraining = () => {
    if (newTrainingInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        pelatihanDiikuti: [...(prev.pelatihanDiikuti || []), newTrainingInput.trim()],
      }));
      setNewTrainingInput('');
    }
  };

  const handleRemoveTraining = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pelatihanDiikuti: (prev.pelatihanDiikuti || []).filter((_, i) => i !== index),
    }));
  };

  const exportCSV = () => {
    const headers = ['ID', 'NIK', 'Nama Lengkap', 'Jabatan', 'Pokja', 'No HP', 'Alamat', 'Status', 'Tanggal Bergabung'];
    const rows = filteredAnggota.map((a) => [
      a.id,
      `'${a.nik}`,
      `"${a.nama}"`,
      `"${a.jabatan}"`,
      a.pokja,
      `'${a.noHp}`,
      `"${a.alamat}"`,
      a.status,
      a.tanggalBergabung,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Anggota_PKK_${profil.namaRT}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Buku I: Daftar Anggota TP PKK & Kader
            </h2>
            <Badge variant="emerald" size="sm">
              {filteredAnggota.length} Anggota
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pendataan struktur kepengurusan TP PKK {profil.namaRT} / {profil.namaRW}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-scan-kk-header"
            onClick={() => setIsScanKKOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-500/20 hover:scale-[1.02]"
            title="Scan foto Kartu Keluarga dengan AI untuk input data instan"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Scan KK dengan AI</span>
          </button>

          <button
            id="btn-export-csv-anggota"
            onClick={exportCSV}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            id="btn-tambah-anggota"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-anggota"
              placeholder="Cari nama, NIK, alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Pokja */}
          <div>
            <select
              id="select-filter-pokja"
              value={filterPokja}
              onChange={(e) => setFilterPokja(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua POKJA</option>
              <option value="Sekretariat">Sekretariat</option>
              <option value="Pokja I">POKJA I (Pancasila & Gotong Royong)</option>
              <option value="Pokja II">POKJA II (Pendidikan & UP2K)</option>
              <option value="Pokja III">POKJA III (Pangan & HATINYA PKK)</option>
              <option value="Pokja IV">POKJA IV (Kesehatan & Posyandu)</option>
            </select>
          </div>

          {/* Filter Jabatan */}
          <div>
            <select
              id="select-filter-jabatan"
              value={filterJabatan}
              onChange={(e) => setFilterJabatan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Jabatan</option>
              <option value="Ketua TP PKK RT">Ketua TP PKK RT</option>
              <option value="Sekretaris">Sekretaris</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Ketua Pokja I">Ketua Pokja I</option>
              <option value="Ketua Pokja II">Ketua Pokja II</option>
              <option value="Ketua Pokja III">Ketua Pokja III</option>
              <option value="Ketua Pokja IV">Ketua Pokja IV</option>
              <option value="Kader Dasawisma">Kader Dasawisma</option>
              <option value="Kader Posyandu">Kader Posyandu</option>
              <option value="Anggota Pokja">Anggota Pokja</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              id="select-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status Keaktifan</option>
              <option value="Aktif">Aktif</option>
              <option value="Cuti">Cuti</option>
              <option value="Non-Aktif">Non-Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data Anggota */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Nama & NIK</th>
                <th className="px-4 py-3.5">Jabatan PKK</th>
                <th className="px-4 py-3.5">POKJA</th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Nomor WhatsApp</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Kwitansi Iuran</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">Alamat Domisili</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Tidak ditemukan data anggota dengan kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredAnggota.map((agt) => (
                  <tr
                    key={agt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {agt.nama.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {agt.nama}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            NIK: {agt.nik}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {agt.jabatan}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          agt.pokja === 'Sekretariat'
                            ? 'slate'
                            : agt.pokja === 'Pokja I'
                            ? 'purple'
                            : agt.pokja === 'Pokja II'
                            ? 'blue'
                            : agt.pokja === 'Pokja III'
                            ? 'emerald'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {agt.pokja}
                      </Badge>
                    </td>

                    {/* Kolom Nomor WhatsApp */}
                    <td className="px-4 py-3.5">
                      {agt.noHp && agt.noHp !== '-' ? (
                        <a
                          href={`https://wa.me/${agt.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs group"
                          title={`Kirim Pesan WhatsApp ke Ibu ${agt.nama} (${agt.noHp})`}
                        >
                          <Phone className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                          <span className="font-mono text-xs">{agt.noHp}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(agt)}
                          title="Klik untuk mengisi Nomor WhatsApp Ibu ini"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-dashed border-amber-300 px-2 py-1 rounded-lg font-medium cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>+ Isi No WA</span>
                        </button>
                      )}
                    </td>

                    {/* Kolom Kwitansi Iuran & WA */}
                    <td className="px-4 py-3.5 text-center">
                      {(() => {
                        const matchingIuran = iuranList.find(
                          (r) => r.anggotaId === agt.id || r.namaAnggota.trim().toLowerCase() === agt.nama.trim().toLowerCase()
                        );
                        const paidCount = matchingIuran?.bulan
                          ? (Object.values(matchingIuran.bulan) as { lunas?: boolean }[]).filter((b) => b?.lunas).length
                          : 0;

                        return (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenKwitansiForMember(agt)}
                              title={`Kirim Kwitansi / Bukti Iuran Ibu ${agt.nama} ke WhatsApp`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[11px] shadow-xs hover:shadow-sm active:scale-98 transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Kwitansi WA</span>
                            </button>
                            <span className="text-[10px] font-semibold">
                              {paidCount > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Lunas {paidCount}/12 Bln
                                </span>
                              ) : (
                                <span className="text-slate-400">Belum Dicatat</span>
                              )}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {agt.alamat}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          agt.status === 'Aktif'
                            ? 'emerald'
                            : agt.status === 'Cuti'
                            ? 'amber'
                            : 'slate'
                        }
                        dot
                        size="sm"
                      >
                        {agt.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`btn-kta-${agt.id}`}
                          onClick={() => setViewingKta(agt)}
                          title="Lihat Kartu Anggota (KTA)"
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-${agt.id}`}
                          onClick={() => handleOpenEdit(agt)}
                          title="Edit Anggota"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-${agt.id}`}
                          onClick={() => setDeletingId(agt.id)}
                          title="Hapus Anggota"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Anggota */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingAnggota ? 'Ubah Data Anggota / Pengurus PKK' : 'Tambah Anggota PKK Baru'}
        subtitle={`Formulir pendaftaran anggota TP PKK ${profil.namaRT}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* AI Scan KK Action Banner inside Form */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-sky-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Scan Kartu Keluarga (KK) dengan AI
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Isi otomatis NIK, Nama, Tanggal Lahir, Pekerjaan, Alamat, dan Data Keluarga dari foto KK.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-scan-kk-inside-form"
              onClick={() => setIsScanKKOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Foto KK</span>
            </button>
          </div>

          {/* Success Banner if data filled via KK */}
          {showKkSuccessNotice && formData.noKk && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Data berhasil diisi otomatis dari <b>KK No. {formData.noKk}</b> (Kepala Keluarga: {formData.namaKepalaKeluarga}).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKkSuccessNotice(false)}
                className="text-emerald-600 hover:text-emerald-800 text-[11px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Connected KK Summary Pill if present */}
          {formData.noKk && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Metadata Kartu Keluarga Terhubung:</span>
                </span>
                <Badge variant="emerald" size="sm">
                  {formData.statusKeluarga || 'Anggota Keluarga'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  No. KK: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.noKk}</span>
                </div>
                <div>
                  Kepala Keluarga: <span className="font-bold text-slate-800 dark:text-slate-200">{formData.namaKepalaKeluarga}</span>
                </div>
                {formData.anggotaKeluarga && formData.anggotaKeluarga.length > 0 && (
                  <div className="col-span-1 sm:col-span-2">
                    Total Anggota Keluarga:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formData.anggotaKeluarga.length} Jiwa (
                      {formData.anggotaKeluarga.map((m) => m.nama).join(', ')})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ny. Hj. Siti Aminah, S.Pd"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Kependudukan (NIK) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="16 digit NIK KTP"
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan dalam TP PKK *
              </label>
              <select
                value={formData.jabatan || 'Anggota Pokja'}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value as JabatanPKK })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Ketua TP PKK RT">Ketua TP PKK RT</option>
                <option value="Wakil Ketua">Wakil Ketua</option>
                <option value="Sekretaris">Sekretaris</option>
                <option value="Bendahara">Bendahara</option>
                <option value="Ketua Pokja I">Ketua Pokja I</option>
                <option value="Ketua Pokja II">Ketua Pokja II</option>
                <option value="Ketua Pokja III">Ketua Pokja III</option>
                <option value="Ketua Pokja IV">Ketua Pokja IV</option>
                <option value="Kader Dasawisma">Kader Dasawisma</option>
                <option value="Kader Posyandu">Kader Posyandu</option>
                <option value="Anggota Pokja">Anggota Pokja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelompok Kerja (POKJA) *
              </label>
              <select
                value={formData.pokja || 'Sekretariat'}
                onChange={(e) => setFormData({ ...formData, pokja: e.target.value as PokjaType })}
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Nomor WhatsApp / HP *</span>
                <span className="text-[10px] text-emerald-600 font-normal">Kirim Kwitansi WA</span>
              </label>
              <input
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                value={formData.noHp || ''}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Keanggotaan
              </label>
              <select
                value={formData.status || 'Aktif'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Cuti">Cuti</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Rumah Lengkap
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Mawar Indah No. 12"
              value={formData.alamat || ''}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pekerjaan / Aktivitas
              </label>
              <input
                type="text"
                placeholder="Contoh: Guru / Wirausaha / IRT"
                value={formData.pekerjaan || ''}
                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pendidikan Terakhir
              </label>
              <input
                type="text"
                placeholder="Contoh: SMA / D3 / S1"
                value={formData.pendidikanTerakhir || ''}
                onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Contoh: Depok / Jakarta"
                value={formData.tempatLahir || ''}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.tanggalLahir || ''}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pelatihan yang pernah diikuti */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pelatihan PKK yang Pernah Diikuti
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tambah nama pelatihan (contoh: Kader Posyandu, PAAR, UP2K)"
                value={newTrainingInput}
                onChange={(e) => setNewTrainingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTraining();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddTraining}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(formData.pelatihanDiikuti || []).map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800"
                >
                  <span>{t}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-500"
                    onClick={() => handleRemoveTraining(idx)}
                  />
                </span>
              ))}
            </div>
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
              {editingAnggota ? 'Simpan Perubahan' : 'Simpan Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal View Detail Keluarga (KK) */}
      <Modal
        isOpen={!!viewingFamilyData}
        onClose={() => setViewingFamilyData(null)}
        title="Rincian Dokumen Kartu Keluarga (KK)"
        subtitle={`Data silsilah keluarga anggota TP PKK ${viewingFamilyData?.nama || ''}`}
        maxWidth="3xl"
      >
        {viewingFamilyData && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400">Nomor Kartu Keluarga (KK):</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {viewingFamilyData.noKk || '3271012304050001'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Kepala Keluarga:</span>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {viewingFamilyData.namaKepalaKeluarga || 'Budi Santoso'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Alamat Lengkap:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingFamilyData.alamat} RT {viewingFamilyData.rt} / RW {viewingFamilyData.rw}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Status dalam Keluarga:</span>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {viewingFamilyData.statusKeluarga || 'ISTRI / IBU'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Anggota Keluarga Terdaftar:</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Nama & NIK</th>
                      <th className="px-3 py-2">Hubungan</th>
                      <th className="px-3 py-2">JK / Usia</th>
                      <th className="px-3 py-2">Pendidikan</th>
                      <th className="px-3 py-2">Pekerjaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(viewingFamilyData.anggotaKeluarga && viewingFamilyData.anggotaKeluarga.length > 0
                      ? viewingFamilyData.anggotaKeluarga
                      : [
                          {
                            nama: viewingFamilyData.namaKepalaKeluarga || 'Budi Santoso',
                            nik: '3271011205780002',
                            jenisKelamin: 'Laki-laki',
                            usia: 48,
                            pendidikan: 'S1',
                            jenisPekerjaan: 'Wiraswasta',
                            statusHubungan: 'KEPALA KELUARGA',
                          },
                          {
                            nama: viewingFamilyData.nama,
                            nik: viewingFamilyData.nik,
                            jenisKelamin: 'Perempuan',
                            usia: 44,
                            pendidikan: viewingFamilyData.pendidikanTerakhir || 'S1',
                            jenisPekerjaan: viewingFamilyData.pekerjaan || 'Ibu Rumah Tangga',
                            statusHubungan: viewingFamilyData.statusKeluarga || 'ISTRI',
                          },
                        ]
                    ).map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{m.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.nik}</div>
                        </td>
                        <td className="px-3 py-2 font-medium">
                          <Badge
                            variant={
                              m.statusHubungan?.includes('KEPALA')
                                ? 'slate'
                                : m.statusHubungan?.includes('ISTRI')
                                ? 'emerald'
                                : 'blue'
                            }
                            size="sm"
                          >
                            {m.statusHubungan}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {m.jenisKelamin} / {m.usia || '-'} thn
                        </td>
                        <td className="px-3 py-2">{m.pendidikan}</td>
                        <td className="px-3 py-2">{m.jenisPekerjaan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingFamilyData(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Scan KK AI */}
      <ScanKKModal
        isOpen={isScanKKOpen}
        onClose={() => setIsScanKKOpen(false)}
        onSelectAnggotaForForm={handleSelectFromScanKK}
        contextMode="anggota"
      />

      {/* Modal KTA Digital PKK */}
      <Modal
        isOpen={!!viewingKta}
        onClose={() => setViewingKta(null)}
        title="Kartu Tanda Anggota (KTA) Digital PKK"
        maxWidth="md"
      >
        {viewingKta && (
          <div className="space-y-4">
            {/* KTA Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-sky-900 p-6 text-white shadow-xl border-2 border-emerald-500/30">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-emerald-200">
                    KARTU TANDA ANGGOTA TP PKK
                  </h4>
                  <p className="text-[11px] text-white/80 font-medium">
                    {profil.namaRT} / {profil.namaRW}, KEL. {profil.namaKelurahan.toUpperCase()}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                  PKK
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl font-extrabold text-white shrink-0">
                  {viewingKta.nama.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">{viewingKta.nama}</h3>
                  <p className="text-xs font-bold text-amber-300">{viewingKta.jabatan}</p>
                  <p className="text-[11px] text-emerald-100 font-mono">NIK: {viewingKta.nik}</p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/80">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200">
                    POKJA
                  </span>
                  <span className="font-semibold text-white">{viewingKta.pokja}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200">
                    TERDAFTAR SEJAK
                  </span>
                  <span className="font-semibold text-white">{viewingKta.tanggalBergabung}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-200">
                    STATUS
                  </span>
                  <span className="font-bold text-emerald-300">{viewingKta.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  if (viewingKta) {
                    printKTAPKK(viewingKta, profil);
                  } else {
                    window.print();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak KTA</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteAnggota(deletingId);
        }}
        title="Hapus Data Anggota"
        message="Apakah Anda yakin ingin menghapus data anggota ini dari Buku I TP PKK? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Anggota"
      />

      {/* Kwitansi Iuran & WhatsApp Modal */}
      <KwitansiIuranModal
        isOpen={isKwitansiModalOpen}
        onClose={() => setIsKwitansiModalOpen(false)}
        profil={profil}
        initialData={kwitansiModalData}
        onSavePhone={(anggotaId, newPhone) => {
          updateAnggota(anggotaId, { noHp: newPhone });
          updatePesertaIuran(anggotaId, { noHp: newPhone });
        }}
      />
    </div>
  );
};
