import React, { useState, useMemo } from 'react';
import {
  Home,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Heart,
  Baby,
  Activity,
  Trees,
  Droplets,
  Trash,
  Sparkles,
  Camera,
  X,
  FileSpreadsheet,
  Upload,
  Users,
  Plus,
  ExternalLink,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { KeluargaDasawisma, DasawismaName, KartuKeluargaData, AnggotaKeluargaKK } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScanKKModal } from '../common/ScanKKModal';
import { ImportKeluargaModal } from './ImportKeluargaModal';
import { AnggotaKeluargaView } from './AnggotaKeluargaView';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const DasawismaView: React.FC = () => {
  const {
    keluargaList,
    addKeluarga,
    updateKeluarga,
    deleteKeluarga,
    profil,
    searchGlobal,
    totalJiwaDasawisma,
    totalBalita,
    totalIbuHamil,
    totalLansia,
    persentaseRumahSehat,
    semuaAnggotaKeluarga,
    setSelectedKeluargaFilterId,
    setCurrentView,
  } = usePKK();

  const [activeSubTab, setActiveSubTab] = useState<'kk' | 'anggota-keluarga'>('kk');
  const [search, setSearch] = useState('');
  const [filterDasawisma, setFilterDasawisma] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterRumahSehat, setFilterRumahSehat] = useState<string>('Semua');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanKKOpen, setIsScanKKOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<KeluargaDasawisma | null>(null);
  const [detailKeluarga, setDetailKeluarga] = useState<KeluargaDasawisma | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showKkSuccessNotice, setShowKkSuccessNotice] = useState(false);

  const initialForm: Omit<KeluargaDasawisma, 'id' | 'terakhirDiperbarui'> = {
    noKk: '',
    namaKepalaKeluarga: '',
    namaIbu: '',
    noHpIbu: '',
    alamat: 'Jl. Mawar Indah No. ',
    dasawisma: 'Dasawisma Flamboyan 9',
    jumlahAnggotaKeluarga: 4,
    jumlahLakiLaki: 2,
    jumlahPerempuan: 2,
    jumlahBalita: 0,
    jumlahIbuHamil: 0,
    jumlahLansia: 0,
    statusPUS: true,
    statusWUS: true,
    statusRumahSehat: true,
    memilikiJambanSehat: true,
    memilikiSPAL: true,
    memilikiTempatSampah: true,
    memilikiSumberAirBersih: true,
    memilikiPekaranganToga: true,
    makananPokok: 'Beras',
    kategoriSejahtera: 'Sejahtera II',
    catatanKesehatan: '',
    anggotaKeluarga: [],
  };

  const [formData, setFormData] = useState(initialForm);
  const [newMemberDraft, setNewMemberDraft] = useState<AnggotaKeluargaKK>({
    nama: '',
    nik: '',
    jenisKelamin: 'Laki-laki',
    usia: 10,
    statusHubungan: 'ANAK',
    pendidikan: 'SD / Sederajat',
    jenisPekerjaan: 'Pelajar',
    statusPernikahan: 'Belum Kawin',
    kategoriSasaran: 'Anak/Sekolah',
  });

  const effectiveSearch = search || searchGlobal;

  const filteredKeluarga = useMemo(() => {
    return keluargaList.filter((k) => {
      const q = effectiveSearch.toLowerCase();
      const matchMemberName = (k.anggotaKeluarga || []).some(
        (m) =>
          m.nama.toLowerCase().includes(q) ||
          (m.nik && m.nik.toLowerCase().includes(q))
      );
      const matchSearch =
        k.namaKepalaKeluarga.toLowerCase().includes(q) ||
        k.namaIbu.toLowerCase().includes(q) ||
        k.noKk.includes(effectiveSearch) ||
        k.alamat.toLowerCase().includes(q) ||
        matchMemberName;

      const matchDasa = filterDasawisma === 'Semua' || k.dasawisma === filterDasawisma;
      const matchKat = filterKategori === 'Semua' || k.kategoriSejahtera === filterKategori;
      const matchSehat =
        filterRumahSehat === 'Semua'
          ? true
          : filterRumahSehat === 'Sehat'
          ? k.statusRumahSehat
          : !k.statusRumahSehat;

      return matchSearch && matchDasa && matchKat && matchSehat;
    });
  }, [keluargaList, effectiveSearch, filterDasawisma, filterKategori, filterRumahSehat]);

  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      anggotaKeluarga: [
        {
          id: 'ak-init-1',
          nama: '',
          nik: '',
          jenisKelamin: 'Laki-laki',
          usia: 40,
          statusHubungan: 'KEPALA KELUARGA',
          pendidikan: 'SMA / SMK',
          jenisPekerjaan: 'Karyawan / Wiraswasta',
          statusPernikahan: 'Kawin',
          kategoriSasaran: 'PUS',
        },
        {
          id: 'ak-init-2',
          nama: '',
          nik: '',
          jenisKelamin: 'Perempuan',
          usia: 36,
          statusHubungan: 'ISTRI',
          pendidikan: 'SMA / SMK',
          jenisPekerjaan: 'Ibu Rumah Tangga',
          statusPernikahan: 'Kawin',
          kategoriSasaran: 'WUS',
        },
        {
          id: 'ak-init-3',
          nama: '',
          nik: '',
          jenisKelamin: 'Laki-laki',
          usia: 12,
          statusHubungan: 'ANAK',
          pendidikan: 'SMP / Sederajat',
          jenisPekerjaan: 'Pelajar',
          statusPernikahan: 'Belum Kawin',
          kategoriSasaran: 'Anak/Sekolah',
        },
        {
          id: 'ak-init-4',
          nama: '',
          nik: '',
          jenisKelamin: 'Perempuan',
          usia: 7,
          statusHubungan: 'ANAK',
          pendidikan: 'SD / Sederajat',
          jenisPekerjaan: 'Pelajar',
          statusPernikahan: 'Belum Kawin',
          kategoriSasaran: 'Anak/Sekolah',
        },
      ],
    });
    setEditingKeluarga(null);
    setShowKkSuccessNotice(false);
    setIsAddModalOpen(true);
  };

  const handleSelectFromScanKK = (
    _selectedMember: AnggotaKeluargaKK,
    kkData: KartuKeluargaData
  ) => {
    setFormData((prev) => ({
      ...prev,
      noKk: kkData.noKk,
      namaKepalaKeluarga: kkData.namaKepalaKeluarga,
      namaIbu: kkData.namaIbu || prev.namaIbu,
      noHpIbu: kkData.noHpIbu || prev.noHpIbu || '',
      alamat: kkData.alamat,
      jumlahAnggotaKeluarga: kkData.anggotaKeluarga?.length || kkData.jumlahAnggotaKeluarga || 4,
      jumlahLakiLaki: kkData.jumlahLakiLaki || 2,
      jumlahPerempuan: kkData.jumlahPerempuan || 2,
      jumlahBalita: kkData.jumlahBalita || 0,
      jumlahIbuHamil: kkData.jumlahIbuHamil || 0,
      jumlahLansia: kkData.jumlahLansia || 0,
      statusPUS: kkData.statusPUS,
      statusWUS: kkData.statusWUS,
      anggotaKeluarga: kkData.anggotaKeluarga || [],
      catatanKesehatan: `Terverifikasi dari Scan AI KK No. ${kkData.noKk}. Komposisi: ${kkData.jumlahAnggotaKeluarga} Jiwa (${kkData.jumlahLakiLaki} L / ${kkData.jumlahPerempuan} P).`,
    }));
    setShowKkSuccessNotice(true);
    setEditingKeluarga(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (k: KeluargaDasawisma) => {
    setEditingKeluarga(k);
    setFormData({
      noKk: k.noKk,
      namaKepalaKeluarga: k.namaKepalaKeluarga,
      namaIbu: k.namaIbu,
      noHpIbu: k.noHpIbu || k.anggotaKeluarga?.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI')?.noHp || '',
      alamat: k.alamat,
      dasawisma: k.dasawisma,
      jumlahAnggotaKeluarga: k.jumlahAnggotaKeluarga,
      jumlahLakiLaki: k.jumlahLakiLaki,
      jumlahPerempuan: k.jumlahPerempuan,
      jumlahBalita: k.jumlahBalita,
      jumlahIbuHamil: k.jumlahIbuHamil,
      jumlahLansia: k.jumlahLansia,
      statusPUS: k.statusPUS,
      statusWUS: k.statusWUS,
      statusRumahSehat: k.statusRumahSehat,
      memilikiJambanSehat: k.memilikiJambanSehat,
      memilikiSPAL: k.memilikiSPAL,
      memilikiTempatSampah: k.memilikiTempatSampah,
      memilikiSumberAirBersih: k.memilikiSumberAirBersih,
      memilikiPekaranganToga: k.memilikiPekaranganToga,
      makananPokok: k.makananPokok,
      kategoriSejahtera: k.kategoriSejahtera,
      catatanKesehatan: k.catatanKesehatan || '',
      anggotaKeluarga: k.anggotaKeluarga || [],
    });
    setIsAddModalOpen(true);
  };

  const handleAddDraftMemberToForm = () => {
    if (!newMemberDraft.nama.trim()) return;
    const currentList = formData.anggotaKeluarga || [];
    const nextList: AnggotaKeluargaKK[] = [
      ...currentList,
      {
        ...newMemberDraft,
        id: `ak-form-${Date.now()}`,
        nik:
          newMemberDraft.nik ||
          `${(formData.noKk || '320101010101').slice(0, 12)}${String(currentList.length + 1).padStart(4, '0')}`,
      },
    ];
    const jmlLaki = nextList.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const jmlPerempuan = nextList.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const jmlBalita = nextList.filter(
      (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
    ).length;
    const jmlLansia = nextList.filter(
      (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
    ).length;

    setFormData((prev) => ({
      ...prev,
      anggotaKeluarga: nextList,
      jumlahAnggotaKeluarga: nextList.length,
      jumlahLakiLaki: jmlLaki,
      jumlahPerempuan: jmlPerempuan,
      jumlahBalita: jmlBalita,
      jumlahLansia: jmlLansia,
    }));
    setNewMemberDraft({
      nama: '',
      nik: '',
      jenisKelamin: 'Laki-laki',
      usia: 10,
      statusHubungan: 'ANAK',
      pendidikan: 'SD / Sederajat',
      jenisPekerjaan: 'Pelajar',
      statusPernikahan: 'Belum Kawin',
      kategoriSasaran: 'Anak/Sekolah',
    });
  };

  const handleUpdateMemberInForm = (
    index: number,
    updates: Partial<AnggotaKeluargaKK>
  ) => {
    const currentList = formData.anggotaKeluarga || [];
    const nextList = currentList.map((item, i) => {
      if (i !== index) return item;
      const merged = { ...item, ...updates };
      if (updates.usia !== undefined) {
        if (updates.usia <= 5) merged.kategoriSasaran = 'Balita';
        else if (updates.usia >= 60) merged.kategoriSasaran = 'Lansia';
        else if (updates.usia <= 17 && merged.statusHubungan === 'ANAK') {
          merged.kategoriSasaran = 'Anak/Sekolah';
        }
      }
      return merged;
    });

    const kepala = nextList.find((m) => m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA');
    const istri = nextList.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI');
    const jmlLaki = nextList.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const jmlPerempuan = nextList.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const jmlBalita = nextList.filter(
      (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
    ).length;
    const jmlLansia = nextList.filter(
      (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
    ).length;

    setFormData((prev) => ({
      ...prev,
      namaKepalaKeluarga:
        kepala && kepala.nama.trim() ? kepala.nama : prev.namaKepalaKeluarga,
      namaIbu: istri && istri.nama.trim() ? istri.nama : prev.namaIbu,
      anggotaKeluarga: nextList,
      jumlahAnggotaKeluarga: nextList.length,
      jumlahLakiLaki: jmlLaki,
      jumlahPerempuan: jmlPerempuan,
      jumlahBalita: jmlBalita,
      jumlahLansia: jmlLansia,
    }));
  };

  const handleAddEmptyChildRow = () => {
    const currentList = formData.anggotaKeluarga || [];
    const nextList: AnggotaKeluargaKK[] = [
      ...currentList,
      {
        id: `ak-anak-${Date.now()}-${currentList.length + 1}`,
        nama: '',
        nik: `${(formData.noKk || '320101010101').slice(0, 12)}${String(
          currentList.length + 1
        ).padStart(4, '0')}`,
        jenisKelamin: 'Laki-laki',
        usia: 8,
        statusHubungan: 'ANAK',
        pendidikan: 'SD / Sederajat',
        jenisPekerjaan: 'Pelajar',
        statusPernikahan: 'Belum Kawin',
        kategoriSasaran: 'Anak/Sekolah',
      },
    ];
    setFormData((prev) => ({
      ...prev,
      anggotaKeluarga: nextList,
      jumlahAnggotaKeluarga: nextList.length,
      jumlahLakiLaki: nextList.filter((m) => m.jenisKelamin === 'Laki-laki').length,
      jumlahPerempuan: nextList.filter((m) => m.jenisKelamin === 'Perempuan').length,
    }));
  };

  const handleRemoveMemberFromForm = (index: number) => {
    const nextList = (formData.anggotaKeluarga || []).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      anggotaKeluarga: nextList,
      jumlahAnggotaKeluarga: Math.max(1, nextList.length),
      jumlahLakiLaki: nextList.filter((m) => m.jenisKelamin === 'Laki-laki').length,
      jumlahPerempuan: nextList.filter((m) => m.jenisKelamin === 'Perempuan').length,
    }));
  };

  const handleTotalJiwaChange = (newTotalRaw: number) => {
    const newTotal = Math.max(1, newTotalRaw || 1);
    let nextList = [...(formData.anggotaKeluarga || [])];

    if (newTotal > nextList.length) {
      while (nextList.length < newTotal) {
        const idx = nextList.length + 1;
        const gender: 'Laki-laki' | 'Perempuan' = idx % 2 === 1 ? 'Laki-laki' : 'Perempuan';
        nextList.push({
          id: `ak-anak-${Date.now()}-${idx}`,
          nama: '',
          nik: `${(formData.noKk || '320101010101').slice(0, 12)}${String(idx).padStart(4, '0')}`,
          jenisKelamin: gender,
          usia: 8,
          statusHubungan: 'ANAK',
          pendidikan: 'SD / Sederajat',
          jenisPekerjaan: 'Pelajar',
          statusPernikahan: 'Belum Kawin',
          kategoriSasaran: 'Anak/Sekolah',
        });
      }
    } else if (newTotal < nextList.length) {
      while (nextList.length > newTotal) {
        // Prefer removing empty-named non-head row from the end first
        let removeIdx = -1;
        for (let i = nextList.length - 1; i >= 0; i--) {
          const rel = (nextList[i].statusHubungan || '').toUpperCase();
          if (!nextList[i].nama.trim() && rel !== 'KEPALA KELUARGA' && rel !== 'ISTRI') {
            removeIdx = i;
            break;
          }
        }
        if (removeIdx === -1) {
          removeIdx = nextList.length - 1;
        }
        nextList.splice(removeIdx, 1);
      }
    }

    setFormData((prev) => ({
      ...prev,
      anggotaKeluarga: nextList,
      jumlahAnggotaKeluarga: newTotal,
      jumlahLakiLaki: nextList.filter((m) => m.jenisKelamin === 'Laki-laki').length,
      jumlahPerempuan: nextList.filter((m) => m.jenisKelamin === 'Perempuan').length,
      jumlahBalita: nextList.filter(
        (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
      ).length,
      jumlahLansia: nextList.filter(
        (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
      ).length,
    }));
  };

  const handleBalitaCountChange = (newBalitaRaw: number) => {
    const newBalita = Math.max(0, newBalitaRaw || 0);
    let balitaAssigned = 0;
    const nextList = (formData.anggotaKeluarga || []).map((m) => {
      const rel = (m.statusHubungan || '').toUpperCase();
      if (rel === 'ANAK') {
        if (balitaAssigned < newBalita) {
          balitaAssigned++;
          return {
            ...m,
            usia: typeof m.usia === 'number' && m.usia <= 5 ? m.usia : 3,
            kategoriSasaran: 'Balita' as const,
            pendidikan: 'Belum Sekolah / PAUD',
          };
        } else if (m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)) {
          return {
            ...m,
            usia: 8,
            kategoriSasaran: 'Anak/Sekolah' as const,
            pendidikan: 'SD / Sederajat',
          };
        }
      }
      return m;
    });

    setFormData((prev) => ({
      ...prev,
      jumlahBalita: newBalita,
      anggotaKeluarga: nextList,
    }));
  };

  const handleIbuHamilCountChange = (newBumilRaw: number) => {
    const newBumil = Math.max(0, newBumilRaw || 0);
    const nextList = (formData.anggotaKeluarga || []).map((m) => {
      if ((m.statusHubungan || '').toUpperCase() === 'ISTRI') {
        return {
          ...m,
          kategoriSasaran: (newBumil > 0 ? 'Ibu Hamil' : 'WUS') as any,
        };
      }
      return m;
    });

    setFormData((prev) => ({
      ...prev,
      jumlahIbuHamil: newBumil,
      anggotaKeluarga: nextList,
    }));
  };

  const handleLansiaCountChange = (newLansiaRaw: number) => {
    const newLansia = Math.max(0, newLansiaRaw || 0);
    let lansiaAssigned = 0;
    const nextList = (formData.anggotaKeluarga || []).map((m, idx, arr) => {
      const rel = (m.statusHubungan || '').toUpperCase();
      const isCandidate = rel === 'ORANG TUA' || idx >= arr.length - newLansia;
      if (isCandidate && lansiaAssigned < newLansia && rel !== 'KEPALA KELUARGA' && rel !== 'ISTRI') {
        lansiaAssigned++;
        return {
          ...m,
          statusHubungan: 'ORANG TUA',
          usia: typeof m.usia === 'number' && m.usia >= 60 ? m.usia : 65,
          kategoriSasaran: 'Lansia' as const,
        };
      } else if (m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)) {
        if (lansiaAssigned < newLansia) {
          lansiaAssigned++;
          return m;
        }
        return {
          ...m,
          statusHubungan: rel === 'ORANG TUA' ? 'ANAK' : m.statusHubungan,
          usia: 12,
          kategoriSasaran: 'Anak/Sekolah' as const,
        };
      }
      return m;
    });

    setFormData((prev) => ({
      ...prev,
      jumlahLansia: newLansia,
      anggotaKeluarga: nextList,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKepalaKeluarga.trim() || !formData.noKk.trim()) return;

    const targetJiwa = Math.max(1, Number(formData.jumlahAnggotaKeluarga) || 1);

    // Populate Kepala Keluarga and Istri names if blank; sync noHp on Istri row
    const normalizedFormMembers = (formData.anggotaKeluarga || []).map((m) => {
      if (m.statusHubungan === 'KEPALA KELUARGA' && !m.nama.trim()) {
        return { ...m, nama: formData.namaKepalaKeluarga.trim() };
      }
      if (m.statusHubungan === 'ISTRI') {
        return {
          ...m,
          nama: m.nama.trim() || formData.namaIbu.trim(),
          noHp: formData.noHpIbu ? formData.noHpIbu.trim() : m.noHp,
        };
      }
      return m;
    });

    const payload = {
      ...formData,
      noHpIbu: formData.noHpIbu ? formData.noHpIbu.trim() : '',
      anggotaKeluarga: normalizedFormMembers,
      jumlahAnggotaKeluarga: Math.max(targetJiwa, normalizedFormMembers.length),
    };

    if (editingKeluarga) {
      updateKeluarga(editingKeluarga.id, payload);
    } else {
      addKeluarga(payload);
    }
    setIsAddModalOpen(false);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredKeluarga.map((k, idx) => ({
      'No': idx + 1,
      'No KK': `'${k.noKk}`,
      'Nama Kepala Keluarga': k.namaKepalaKeluarga,
      'Nama Ibu': k.namaIbu,
      'Kelompok Dasawisma': k.dasawisma,
      'Alamat': k.alamat,
      'Jumlah Jiwa': k.jumlahAnggotaKeluarga,
      'Laki-laki': k.jumlahLakiLaki,
      'Perempuan': k.jumlahPerempuan,
      'Balita': k.jumlahBalita,
      'Ibu Hamil': k.jumlahIbuHamil,
      'Lansia': k.jumlahLansia,
      'PUS': k.statusPUS ? 'Ya' : 'Tidak',
      'WUS': k.statusWUS ? 'Ya' : 'Tidak',
      'Rumah Sehat': k.statusRumahSehat ? 'Ya' : 'Tidak',
      'Jamban Sehat': k.memilikiJambanSehat ? 'Ya' : 'Tidak',
      'SPAL': k.memilikiSPAL ? 'Ya' : 'Tidak',
      'Tempat Sampah': k.memilikiTempatSampah ? 'Ya' : 'Tidak',
      'Air Bersih': k.memilikiSumberAirBersih ? 'Ya' : 'Tidak',
      'Pekarangan TOGA': k.memilikiPekaranganToga ? 'Ya' : 'Tidak',
      'Makanan Pokok': k.makananPokok,
      'Kategori Sejahtera': k.kategoriSejahtera,
      'Catatan Kesehatan': k.catatanKesehatan || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 26 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Catatan Keluarga Dasawisma');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    saveAs(data, `Catatan_Dasawisma_${profil.namaRT.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportCSV = () => {
    const headers = [
      'No KK',
      'Kepala Keluarga',
      'Nama Ibu',
      'Kelompok Dasawisma',
      'Alamat',
      'Jumlah Jiwa',
      'Balita',
      'Ibu Hamil',
      'Lansia',
      'Rumah Sehat',
      'Jamban',
      'SPAL',
      'TOGA',
      'Kategori Sejahtera',
      'Catatan Kesehatan',
    ];
    const rows = filteredKeluarga.map((k) => [
      `'${k.noKk}`,
      `"${k.namaKepalaKeluarga}"`,
      `"${k.namaIbu}"`,
      `"${k.dasawisma}"`,
      `"${k.alamat}"`,
      k.jumlahAnggotaKeluarga,
      k.jumlahBalita,
      k.jumlahIbuHamil,
      k.jumlahLansia,
      k.statusRumahSehat ? 'Ya' : 'Tidak',
      k.memilikiJambanSehat ? 'Ya' : 'Tidak',
      k.memilikiSPAL ? 'Ya' : 'Tidak',
      k.memilikiPekaranganToga ? 'Ya' : 'Tidak',
      k.kategoriSejahtera,
      `"${k.catatanKesehatan || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Catatan_Dasawisma_${profil.namaRT}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Sub-Menu Navigation Tabs inside Data Keluarga */}
      <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="subtab-data-kk"
            onClick={() => setActiveSubTab('kk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'kk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Sub-Menu 1: Data Keluarga & Dasawisma ({keluargaList.length} KK)</span>
          </button>

          <button
            type="button"
            id="subtab-daftar-anggota-keluarga"
            onClick={() => setActiveSubTab('anggota-keluarga')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'anggota-keluarga'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sub-Menu 2: Daftar Nama Anggota Keluarga Lengkap ({semuaAnggotaKeluarga.length} Jiwa)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCurrentView('anggota-keluarga')}
          className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          title="Buka di Menu Khusus Daftar Anggota Keluarga Lengkap"
        >
          <span>Buka Menu Khusus Anggota Keluarga</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeSubTab === 'anggota-keluarga' ? (
        <AnggotaKeluargaView
          embeddedInDasawisma
          onSwitchToKKTab={() => setActiveSubTab('kk')}
        />
      ) : (
        <>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Catatan Data Keluarga & Dasawisma
            </h2>
            <Badge variant="blue" size="sm">
              {filteredKeluarga.length} KK Terdaftar
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pendataan terpadu indikator sanitasi, pangan, kesehatan ibu/anak, dan tingkat kesejahteraan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-scan-kk-dasawisma"
            onClick={() => setIsScanKKOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-500/20 hover:scale-[1.02]"
            title="Scan foto Kartu Keluarga dengan AI untuk input data Dasawisma instan"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Scan KK AI</span>
          </button>

          <button
            id="btn-import-dasawisma-excel"
            onClick={() => setIsImportExcelOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Impor banyak data keluarga sekaligus dari berkas Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Impor Excel</span>
          </button>

          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              id="btn-export-dasawisma-excel"
              onClick={exportExcel}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Unduh data dalam format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              id="btn-export-dasawisma-csv"
              onClick={exportCSV}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Unduh data dalam format CSV"
            >
              <span>CSV</span>
            </button>
          </div>

          <button
            id="btn-tambah-keluarga"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah KK</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Populasi</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {totalJiwaDasawisma} Jiwa
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Balita & Bumil</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {totalBalita} Balita • {totalIbuHamil} Bumil
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Warga Lansia</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {totalLansia} Orang
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Rumah Sehat</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {persentaseRumahSehat}% Memenuhi
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-dasawisma"
              placeholder="Cari Kepala KK, Ibu, No KK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={filterDasawisma}
              onChange={(e) => setFilterDasawisma(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kelompok Dasawisma</option>
              <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
              <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
              <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
            </select>
          </div>

          <div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kategori Sejahtera</option>
              <option value="Sejahtera III">Sejahtera III</option>
              <option value="Sejahtera II">Sejahtera II</option>
              <option value="Sejahtera I">Sejahtera I</option>
              <option value="Pra Sejahtera">Pra Sejahtera</option>
            </select>
          </div>

          <div>
            <select
              value={filterRumahSehat}
              onChange={(e) => setFilterRumahSehat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status Sanitasi</option>
              <option value="Sehat">Rumah Sehat (Memenuhi)</option>
              <option value="Belum">Perlu Pembenahan Sanitasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data Keluarga */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Kepala KK & Nama Ibu</th>
                <th className="px-4 py-3.5">Daftar Nama Anggota Keluarga Lengkap</th>
                <th className="px-4 py-3.5">Kelompok Dasawisma</th>
                <th className="px-4 py-3.5">Jumlah Jiwa & Sasaran</th>
                <th className="px-4 py-3.5">Indikator Sanitasi & TOGA</th>
                <th className="px-4 py-3.5">Status Rumah</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredKeluarga.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Tidak ditemukan data keluarga yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredKeluarga.map((k) => {
                  const membersList = k.anggotaKeluarga || [];
                  return (
                  <tr
                    key={k.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {k.namaKepalaKeluarga}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>Ibu: {k.namaIbu}</span>
                          {(k.noHpIbu || membersList.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI')?.noHp) && (
                            <a
                              href={`https://wa.me/${(k.noHpIbu || membersList.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI')?.noHp || '').replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Chat WhatsApp Ibu ${k.namaIbu}`}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold text-[10px] transition-colors"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{k.noHpIbu || membersList.find((m) => m.statusHubungan?.toUpperCase() === 'ISTRI')?.noHp}</span>
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">KK: {k.noKk}</div>
                      </div>
                    </td>

                    {/* Daftar Nama Anggota Keluarga Lengkap */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="space-y-1">
                        {membersList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {membersList.map((m, idx) => (
                              <button
                                type="button"
                                key={m.id || idx}
                                onClick={() => handleOpenEdit(k)}
                                title={`Klik untuk ubah nama / data ${m.nama} (${m.statusHubungan})`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer hover:ring-2 hover:ring-emerald-500/30 ${
                                  m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA'
                                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800'
                                    : m.statusHubungan?.toUpperCase() === 'ISTRI'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50/70 dark:bg-amber-950/40 text-slate-800 dark:text-slate-200 border-amber-200/80 dark:border-amber-800/60'
                                }`}
                              >
                                <span className="font-bold">{idx + 1}.</span>
                                <span className="font-semibold">{m.nama}</span>
                                <span className="text-[9px] opacity-75">
                                  ({m.statusHubungan === 'KEPALA KELUARGA' ? 'KK' : m.statusHubungan})
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {k.namaKepalaKeluarga}, {k.namaIbu}
                          </span>
                        )}
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKeluargaFilterId(k.id);
                              setActiveSubTab('anggota-keluarga');
                            }}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Users className="w-3 h-3" />
                            <span>Kelola / Filter {membersList.length || k.jumlahAnggotaKeluarga} Anggota KK Ini →</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {k.dasawisma}
                      </span>
                      <div className="text-[11px] text-slate-400">{k.alamat}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {k.jumlahAnggotaKeluarga} Jiwa ({k.jumlahLakiLaki} L / {k.jumlahPerempuan} P)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {k.jumlahBalita > 0 && (
                          <Badge variant="rose" size="sm">
                            {k.jumlahBalita} Balita
                          </Badge>
                        )}
                        {k.jumlahIbuHamil > 0 && (
                          <Badge variant="amber" size="sm">
                            {k.jumlahIbuHamil} Bumil
                          </Badge>
                        )}
                        {k.jumlahLansia > 0 && (
                          <Badge variant="purple" size="sm">
                            {k.jumlahLansia} Lansia
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          title="Jamban Sehat"
                          className={k.memilikiJambanSehat ? 'text-emerald-600 font-bold' : 'text-slate-300'}
                        >
                          Jamban
                        </span>
                        <span>•</span>
                        <span
                          title="SPAL Tertutup"
                          className={k.memilikiSPAL ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}
                        >
                          SPAL
                        </span>
                        <span>•</span>
                        <span
                          title="Pekarangan TOGA"
                          className={k.memilikiPekaranganToga ? 'text-emerald-600 font-bold' : 'text-slate-300'}
                        >
                          TOGA
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant={k.statusRumahSehat ? 'emerald' : 'amber'} size="sm" dot>
                        {k.statusRumahSehat ? 'Rumah Sehat' : 'Perlu Binaan'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailKeluarga(k)}
                          title="Lihat Rincian KK"
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(k)}
                          title="Edit KK"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(k.id)}
                          title="Hapus KK"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Data Keluarga */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingKeluarga ? 'Ubah Data Catatan Keluarga Dasawisma' : 'Tambah Catatan Keluarga Baru'}
        subtitle={`Format Buku Dasawisma TP PKK ${profil.namaRT}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  Isi otomatis No KK, Kepala Keluarga, Nama Ibu, Jumlah Jiwa (L/P), Balita, Lansia, dan PUS/WUS dari foto KK.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-scan-kk-inside-dasawisma-form"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Kartu Keluarga (No KK) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="16 digit No KK"
                value={formData.noKk || ''}
                onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelompok Dasawisma *
              </label>
              <select
                value={formData.dasawisma || 'Dasawisma Flamboyan 9'}
                onChange={(e) => setFormData({ ...formData, dasawisma: e.target.value as DasawismaName })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kepala Keluarga (Suami) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bpk. Hendra Gunawan"
                value={formData.namaKepalaKeluarga || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextMembers = (formData.anggotaKeluarga || []).map((m) =>
                    m.statusHubungan === 'KEPALA KELUARGA' ? { ...m, nama: val } : m
                  );
                  setFormData({
                    ...formData,
                    namaKepalaKeluarga: val,
                    anggotaKeluarga: nextMembers,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Ibu Rumah Tangga (Istri) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ny. Hj. Siti Aminah"
                value={formData.namaIbu || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextMembers = (formData.anggotaKeluarga || []).map((m) =>
                    m.statusHubungan === 'ISTRI' ? { ...m, nama: val } : m
                  );
                  setFormData({
                    ...formData,
                    namaIbu: val,
                    anggotaKeluarga: nextMembers,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No. HP / WhatsApp Ibu</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-normal">Kwitansi WA</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={formData.noHpIbu || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextMembers = (formData.anggotaKeluarga || []).map((m) =>
                    m.statusHubungan === 'ISTRI' ? { ...m, noHp: val } : m
                  );
                  setFormData({
                    ...formData,
                    noHpIbu: val,
                    anggotaKeluarga: nextMembers,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Rumah
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Mawar Indah No. 12"
              value={formData.alamat || ''}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Jumlah Anggota Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Total Jiwa
              </label>
              <input
                type="number"
                min={1}
                value={formData.jumlahAnggotaKeluarga ?? 1}
                onChange={(e) => handleTotalJiwaChange(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Balita (0-5 Th)
              </label>
              <input
                type="number"
                min={0}
                value={formData.jumlahBalita ?? 0}
                onChange={(e) => handleBalitaCountChange(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Ibu Hamil
              </label>
              <input
                type="number"
                min={0}
                value={formData.jumlahIbuHamil ?? 0}
                onChange={(e) => handleIbuHamilCountChange(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Lansia (60+ Th)
              </label>
              <input
                type="number"
                min={0}
                value={formData.jumlahLansia ?? 0}
                onChange={(e) => handleLansiaCountChange(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kategori
              </label>
              <select
                value={formData.kategoriSejahtera || 'Sejahtera II'}
                onChange={(e) => setFormData({ ...formData, kategoriSejahtera: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Sejahtera III">Sejahtera III</option>
                <option value="Sejahtera II">Sejahtera II</option>
                <option value="Sejahtera I">Sejahtera I</option>
                <option value="Pra Sejahtera">Pra Sejahtera</option>
              </select>
            </div>
          </div>

          {/* Checklist Indikator Rumah Sehat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Indikator Rumah Sehat & HATINYA PKK
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.memilikiJambanSehat}
                  onChange={(e) => setFormData({ ...formData, memilikiJambanSehat: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Jamban Sehat (Leher Angsa)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.memilikiSPAL}
                  onChange={(e) => setFormData({ ...formData, memilikiSPAL: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">SPAL Tertutup</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.memilikiTempatSampah}
                  onChange={(e) => setFormData({ ...formData, memilikiTempatSampah: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Tempat Sampah Terpilah</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.memilikiSumberAirBersih}
                  onChange={(e) =>
                    setFormData({ ...formData, memilikiSumberAirBersih: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Sumber Air Bersih / PDAM</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.memilikiPekaranganToga}
                  onChange={(e) =>
                    setFormData({ ...formData, memilikiPekaranganToga: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Pekarangan TOGA / Pot</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.statusRumahSehat}
                  onChange={(e) => setFormData({ ...formData, statusRumahSehat: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Lolos Kriteria Rumah Sehat
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Kesehatan & Pendampingan Kader
            </label>
            <input
              type="text"
              placeholder="Contoh: Balita rutin posyandu / Ibu hamil minum TTD / Lansia butuh kunjungan"
              value={formData.catatanKesehatan || ''}
              onChange={(e) => setFormData({ ...formData, catatanKesehatan: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Daftar Nama Anggota Keluarga & Anak Lengkap Section inside KK Modal */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>
                    Daftar Nama Anggota Keluarga & Data Anak ({formData.anggotaKeluarga?.length || 0} Jiwa)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tulis nama lengkap setiap anak dan anggota keluarga sesuai Kartu Keluarga (KK) / Akta Kelahiran
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddEmptyChildRow}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Data Anak</span>
              </button>
            </div>

            {formData.anggotaKeluarga && formData.anggotaKeluarga.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {formData.anggotaKeluarga.map((mem, idx) => {
                  const isAnak = mem.statusHubungan?.toUpperCase() === 'ANAK';
                  const anakOrder =
                    formData.anggotaKeluarga
                      ?.slice(0, idx + 1)
                      .filter((x) => x.statusHubungan?.toUpperCase() === 'ANAK').length || 1;

                  return (
                    <div
                      key={mem.id || idx}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isAnak
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-400 w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={mem.nama}
                            onChange={(e) =>
                              handleUpdateMemberInForm(idx, { nama: e.target.value })
                            }
                            placeholder={
                              isAnak
                                ? `Tulis nama lengkap Anak ke-${anakOrder}...`
                                : `Nama lengkap ${mem.statusHubungan?.toLowerCase()}...`
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={mem.statusHubungan || 'ANAK'}
                            onChange={(e) =>
                              handleUpdateMemberInForm(idx, { statusHubungan: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-200"
                          >
                            <option value="KEPALA KELUARGA">Kepala Keluarga</option>
                            <option value="ISTRI">Istri</option>
                            <option value="ANAK">Anak</option>
                            <option value="ORANG TUA">Orang Tua / Lansia</option>
                            <option value="FAMILI LAIN">Famili Lain</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <select
                            value={mem.jenisKelamin}
                            onChange={(e) =>
                              handleUpdateMemberInForm(idx, {
                                jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            title="Usia (Tahun)"
                            placeholder="Usia"
                            value={mem.usia ?? ''}
                            onChange={(e) =>
                              handleUpdateMemberInForm(idx, {
                                usia: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                          />
                          <span className="text-[10px] text-slate-400 shrink-0">Th</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromForm(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer shrink-0"
                            title="Hapus baris anggota keluarga ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Add Family Member Row */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tambah Cepat Anggota Keluarga / Anak Baru:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama lengkap anak / anggota keluarga..."
                  value={newMemberDraft.nama}
                  onChange={(e) => setNewMemberDraft({ ...newMemberDraft, nama: e.target.value })}
                  className="sm:col-span-4 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <select
                  value={newMemberDraft.statusHubungan}
                  onChange={(e) =>
                    setNewMemberDraft({ ...newMemberDraft, statusHubungan: e.target.value })
                  }
                  className="sm:col-span-3 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="ANAK">Anak</option>
                  <option value="KEPALA KELUARGA">Kepala KK</option>
                  <option value="ISTRI">Istri</option>
                  <option value="ORANG TUA">Orang Tua</option>
                  <option value="FAMILI LAIN">Famili Lain</option>
                </select>
                <select
                  value={newMemberDraft.jenisKelamin}
                  onChange={(e) =>
                    setNewMemberDraft({
                      ...newMemberDraft,
                      jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
                    })
                  }
                  className="sm:col-span-2 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="Usia"
                  value={newMemberDraft.usia ?? ''}
                  onChange={(e) =>
                    setNewMemberDraft({ ...newMemberDraft, usia: parseInt(e.target.value) || 0 })
                  }
                  className="sm:col-span-1 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleAddDraftMemberToForm}
                  className="sm:col-span-2 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              {editingKeluarga ? 'Simpan Perubahan' : 'Simpan Data KK'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Keluarga */}
      <Modal
        isOpen={!!detailKeluarga}
        onClose={() => setDetailKeluarga(null)}
        title="Rincian Catatan Keluarga Dasawisma"
        maxWidth="lg"
      >
        {detailKeluarga && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400">No. KK: {detailKeluarga.noKk}</span>
                <Badge variant={detailKeluarga.statusRumahSehat ? 'emerald' : 'amber'} size="sm">
                  {detailKeluarga.kategoriSejahtera}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {detailKeluarga.namaKepalaKeluarga} & {detailKeluarga.namaIbu}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {detailKeluarga.dasawisma} • {detailKeluarga.alamat}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp Ibu:</span>
                {detailKeluarga.noHpIbu ? (
                  <a
                    href={`https://wa.me/${detailKeluarga.noHpIbu.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{detailKeluarga.noHpIbu}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Belum ada nomor HP</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Jiwa</span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {detailKeluarga.jumlahAnggotaKeluarga} Orang
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Balita & Bumil</span>
                <span className="text-base font-bold text-rose-600">
                  {detailKeluarga.jumlahBalita} Balita / {detailKeluarga.jumlahIbuHamil} Bumil
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-slate-400 text-[10px] uppercase font-bold">Lansia</span>
                <span className="text-base font-bold text-purple-600">
                  {detailKeluarga.jumlahLansia} Orang
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                Indikator Sanitasi & Lingkungan
              </h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  {detailKeluarga.memilikiJambanSehat ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Jamban Sehat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {detailKeluarga.memilikiSPAL ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>SPAL Tertutup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {detailKeluarga.memilikiTempatSampah ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Tempat Sampah</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {detailKeluarga.memilikiPekaranganToga ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Pekarangan TOGA</span>
                </div>
              </div>
            </div>

            {detailKeluarga.catatanKesehatan && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800">
                <strong>Catatan Kader:</strong> {detailKeluarga.catatanKesehatan}
              </div>
            )}

            {/* Daftar Nama Anggota Keluarga Lengkap inside Detail Modal */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Nama Anggota Keluarga Lengkap ({detailKeluarga.anggotaKeluarga?.length || 0} Jiwa)</span>
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    const kkId = detailKeluarga.id;
                    setDetailKeluarga(null);
                    setSelectedKeluargaFilterId(kkId);
                    setActiveSubTab('anggota-keluarga');
                  }}
                  className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Kelola di Menu Anggota Keluarga →
                </button>
              </div>

              {detailKeluarga.anggotaKeluarga && detailKeluarga.anggotaKeluarga.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  {detailKeluarga.anggotaKeluarga.map((mem, idx) => (
                    <div
                      key={mem.id || idx}
                      className="px-3 py-2 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {idx + 1}. {mem.nama}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {mem.nik || '-'} • {mem.pendidikan || '-'} • {mem.jenisPekerjaan || '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="blue" size="sm">
                          {mem.statusHubungan}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {mem.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}{' '}
                          {mem.usia !== undefined ? `(${mem.usia} Th)` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px]">Belum ada rincian anggota keluarga.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Scan KK AI */}
      <ScanKKModal
        isOpen={isScanKKOpen}
        onClose={() => setIsScanKKOpen(false)}
        onSelectAnggotaForForm={handleSelectFromScanKK}
        contextMode="keluarga"
      />

      {/* Modal Impor Excel Data Keluarga */}
      <ImportKeluargaModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteKeluarga(deletingId);
        }}
        title="Hapus Data Keluarga"
        message="Apakah Anda yakin ingin menghapus catatan KK Dasawisma ini? Tindakan ini akan menghapus data populasi terkait."
        confirmLabel="Hapus KK"
      />
        </>
      )}
    </div>
  );
};
