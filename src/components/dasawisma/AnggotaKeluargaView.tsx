import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Home,
  Baby,
  Heart,
  Activity,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  LayoutList,
  LayoutGrid,
  X,
  UserCheck,
  Phone,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import {
  AnggotaKeluargaKK,
  AnggotaKeluargaTerpadu,
  DasawismaName,
  JabatanPKK,
  PokjaType,
  KartuKeluargaData,
  DASAWISMA_LIST,
} from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScanKKModal } from '../common/ScanKKModal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface AnggotaKeluargaViewProps {
  embeddedInDasawisma?: boolean;
  onSwitchToKKTab?: () => void;
}

export const AnggotaKeluargaView: React.FC<AnggotaKeluargaViewProps> = ({
  embeddedInDasawisma = false,
  onSwitchToKKTab,
}) => {
  const {
    semuaAnggotaKeluarga,
    keluargaList,
    addKeluarga,
    selectedKeluargaFilterId,
    setSelectedKeluargaFilterId,
    addAnggotaKeluargaItem,
    updateAnggotaKeluargaItem,
    deleteAnggotaKeluargaItem,
    promoteAnggotaKeluargaToPKK,
    syncSemuaDataKeluargaDanAnggota,
    profil,
    searchGlobal,
    setCurrentView,
  } = usePKK();

  // Filter States
  const [search, setSearch] = useState('');
  const [filterDasawisma, setFilterDasawisma] = useState<string>('Semua');
  const [filterHubungan, setFilterHubungan] = useState<string>('Semua');
  const [filterGender, setFilterGender] = useState<string>('Semua');
  const [filterSasaranUsia, setFilterSasaranUsia] = useState<string>('Semua');
  const [filterPendidikan, setFilterPendidikan] = useState<string>('Semua');
  const [filterStatusPKK, setFilterStatusPKK] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'table' | 'grouped-kk'>('table');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanKKOpen, setIsScanKKOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AnggotaKeluargaTerpadu | null>(null);
  const [detailMember, setDetailMember] = useState<AnggotaKeluargaTerpadu | null>(null);
  const [promotingMember, setPromotingMember] = useState<AnggotaKeluargaTerpadu | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{
    keluargaId: string;
    memberId: string;
    nama: string;
  } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Add / Edit Member Form State
  const [kkTargetMode, setKkTargetMode] = useState<'existing' | 'new'>('existing');
  const [targetKeluargaId, setTargetKeluargaId] = useState<string>('');
  const [newKKData, setNewKKData] = useState<{
    noKk: string;
    namaKepalaKeluarga: string;
    namaIbu: string;
    dasawisma: DasawismaName;
    alamat: string;
    kategoriSejahtera: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
  }>({
    noKk: '',
    namaKepalaKeluarga: '',
    namaIbu: '',
    dasawisma: 'Dasawisma Flamboyan 9',
    alamat: 'Jl. Mawar Indah No. ',
    kategoriSejahtera: 'Sejahtera II',
  });

  const initialMemberForm: AnggotaKeluargaKK = {
    nama: '',
    nik: '',
    jenisKelamin: 'Perempuan',
    tempatLahir: '',
    tanggalLahir: '',
    usia: 30,
    agama: 'Islam',
    pendidikan: 'SMA / SMK',
    jenisPekerjaan: 'Ibu Rumah Tangga',
    statusPernikahan: 'Kawin',
    statusHubungan: 'ISTRI',
    kategoriSasaran: 'WUS',
    noHp: '',
    catatan: '',
  };

  const [memberForm, setMemberForm] = useState<AnggotaKeluargaKK>(initialMemberForm);
  const [alsoRegisterPKK, setAlsoRegisterPKK] = useState<boolean>(false);
  const [pkkJabatan, setPkkJabatan] = useState<JabatanPKK>('Anggota Pokja');
  const [pkkPokja, setPkkPokja] = useState<PokjaType>('Pokja I');

  // Promote Modal Form
  const [promoteJabatan, setPromoteJabatan] = useState<JabatanPKK>('Kader Dasawisma');
  const [promotePokja, setPromotePokja] = useState<PokjaType>('Pokja I');
  const [promoteNoHp, setPromoteNoHp] = useState<string>('');

  const effectiveSearch = search || searchGlobal;

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return semuaAnggotaKeluarga.filter((m) => {
      const q = effectiveSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.nama.toLowerCase().includes(q) ||
        (m.nik && m.nik.toLowerCase().includes(q)) ||
        (m.noKk && m.noKk.toLowerCase().includes(q)) ||
        m.namaKepalaKeluarga.toLowerCase().includes(q) ||
        (m.namaIbuKeluarga && m.namaIbuKeluarga.toLowerCase().includes(q)) ||
        m.alamat.toLowerCase().includes(q) ||
        (m.jenisPekerjaan && m.jenisPekerjaan.toLowerCase().includes(q));

      const matchDasawisma = filterDasawisma === 'Semua' || m.dasawisma === filterDasawisma;
      const matchKK =
        selectedKeluargaFilterId === 'Semua' ||
        m.keluargaId === selectedKeluargaFilterId ||
        m.noKk === selectedKeluargaFilterId;

      const rel = (m.statusHubungan || '').toUpperCase();
      const matchHubungan =
        filterHubungan === 'Semua'
          ? true
          : filterHubungan === 'KEPALA KELUARGA'
          ? rel === 'KEPALA KELUARGA'
          : filterHubungan === 'ISTRI'
          ? rel === 'ISTRI'
          : filterHubungan === 'ANAK'
          ? rel === 'ANAK'
          : filterHubungan === 'ORANG TUA'
          ? rel === 'ORANG TUA' || rel === 'MERTUA'
          : rel !== 'KEPALA KELUARGA' && rel !== 'ISTRI' && rel !== 'ANAK';

      const matchGender = filterGender === 'Semua' || m.jenisKelamin === filterGender;

      const usia = m.usia ?? 30;
      const sasaran = m.kategoriSasaran || 'Umum';
      const matchSasaran =
        filterSasaranUsia === 'Semua'
          ? true
          : filterSasaranUsia === 'Balita'
          ? sasaran === 'Balita' || usia <= 5
          : filterSasaranUsia === 'Anak/Sekolah'
          ? sasaran === 'Anak/Sekolah' || (usia >= 6 && usia <= 17)
          : filterSasaranUsia === 'Remaja'
          ? sasaran === 'Remaja' || (usia >= 18 && usia <= 24)
          : filterSasaranUsia === 'Dewasa'
          ? usia >= 25 && usia <= 59
          : filterSasaranUsia === 'Lansia'
          ? sasaran === 'Lansia' || usia >= 60
          : filterSasaranUsia === 'Ibu Hamil'
          ? sasaran === 'Ibu Hamil'
          : filterSasaranUsia === 'WUS'
          ? sasaran === 'WUS' || (m.jenisKelamin === 'Perempuan' && usia >= 15 && usia <= 49)
          : filterSasaranUsia === 'PUS'
          ? sasaran === 'PUS' || m.statusPernikahan === 'Kawin'
          : true;

      const pend = (m.pendidikan || '').toLowerCase();
      const matchPendidikan =
        filterPendidikan === 'Semua'
          ? true
          : filterPendidikan === 'PAUD/TK'
          ? pend.includes('belum') || pend.includes('paud') || pend.includes('tk')
          : filterPendidikan === 'SD'
          ? pend.includes('sd')
          : filterPendidikan === 'SMP'
          ? pend.includes('smp') || pend.includes('sltp')
          : filterPendidikan === 'SMA/SMK'
          ? pend.includes('sma') || pend.includes('smk') || pend.includes('slta')
          : filterPendidikan === 'Perguruan Tinggi'
          ? pend.includes('d3') ||
            pend.includes('s1') ||
            pend.includes('s2') ||
            pend.includes('s3') ||
            pend.includes('sarjana') ||
            pend.includes('diploma')
          : true;

      const matchPKK =
        filterStatusPKK === 'Semua'
          ? true
          : filterStatusPKK === 'Kader/Anggota PKK'
          ? m.isAnggotaPKK
          : !m.isAnggotaPKK;

      return (
        matchSearch &&
        matchDasawisma &&
        matchKK &&
        matchHubungan &&
        matchGender &&
        matchSasaran &&
        matchPendidikan &&
        matchPKK
      );
    });
  }, [
    semuaAnggotaKeluarga,
    effectiveSearch,
    filterDasawisma,
    selectedKeluargaFilterId,
    filterHubungan,
    filterGender,
    filterSasaranUsia,
    filterPendidikan,
    filterStatusPKK,
  ]);

  // Grouped by KK for 'grouped-kk' view mode
  const groupedByKK = useMemo(() => {
    const map = new Map<
      string,
      {
        keluargaId: string;
        noKk: string;
        namaKepalaKeluarga: string;
        namaIbuKeluarga: string;
        dasawisma: DasawismaName;
        alamat: string;
        kategoriSejahtera: string;
        statusRumahSehat: boolean;
        members: AnggotaKeluargaTerpadu[];
      }
    >();

    filteredMembers.forEach((m) => {
      const key = m.keluargaId || m.noKk;
      if (!map.has(key)) {
        map.set(key, {
          keluargaId: m.keluargaId,
          noKk: m.noKk,
          namaKepalaKeluarga: m.namaKepalaKeluarga,
          namaIbuKeluarga: m.namaIbuKeluarga,
          dasawisma: m.dasawisma,
          alamat: m.alamat,
          kategoriSejahtera: m.kategoriSejahtera,
          statusRumahSehat: m.statusRumahSehat,
          members: [],
        });
      }
      map.get(key)!.members.push(m);
    });

    return Array.from(map.values());
  }, [filteredMembers]);

  // Summary Statistics based on all data
  const stats = useMemo(() => {
    const totalWarga = semuaAnggotaKeluarga.length;
    const totalLaki = semuaAnggotaKeluarga.filter((m) => m.jenisKelamin === 'Laki-laki').length;
    const totalPerempuan = semuaAnggotaKeluarga.filter((m) => m.jenisKelamin === 'Perempuan').length;
    const totalKepalaKK = semuaAnggotaKeluarga.filter(
      (m) => m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA'
    ).length;
    const totalIstri = semuaAnggotaKeluarga.filter(
      (m) => m.statusHubungan?.toUpperCase() === 'ISTRI'
    ).length;
    const totalAnak = semuaAnggotaKeluarga.filter(
      (m) => m.statusHubungan?.toUpperCase() === 'ANAK'
    ).length;
    const totalBalita = semuaAnggotaKeluarga.filter(
      (m) => m.kategoriSasaran === 'Balita' || (typeof m.usia === 'number' && m.usia <= 5)
    ).length;
    const totalBumil = semuaAnggotaKeluarga.filter((m) => m.kategoriSasaran === 'Ibu Hamil').length;
    const totalLansia = semuaAnggotaKeluarga.filter(
      (m) => m.kategoriSasaran === 'Lansia' || (typeof m.usia === 'number' && m.usia >= 60)
    ).length;
    const totalTerdaftarPKK = semuaAnggotaKeluarga.filter((m) => m.isAnggotaPKK).length;

    return {
      totalWarga,
      totalLaki,
      totalPerempuan,
      totalKepalaKK,
      totalIstri,
      totalAnak,
      totalBalita,
      totalBumil,
      totalLansia,
      totalTerdaftarPKK,
    };
  }, [semuaAnggotaKeluarga]);

  const activeFilterCount = [
    search !== '',
    filterDasawisma !== 'Semua',
    selectedKeluargaFilterId !== 'Semua',
    filterHubungan !== 'Semua',
    filterGender !== 'Semua',
    filterSasaranUsia !== 'Semua',
    filterPendidikan !== 'Semua',
    filterStatusPKK !== 'Semua',
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch('');
    setFilterDasawisma('Semua');
    setSelectedKeluargaFilterId('Semua');
    setFilterHubungan('Semua');
    setFilterGender('Semua');
    setFilterSasaranUsia('Semua');
    setFilterPendidikan('Semua');
    setFilterStatusPKK('Semua');
  };

  // Open Add Modal
  const handleOpenAddMember = (preselectKeluargaId?: string) => {
    setEditingMember(null);
    setMemberForm(initialMemberForm);
    setAlsoRegisterPKK(false);

    if (preselectKeluargaId && keluargaList.some((k) => k.id === preselectKeluargaId)) {
      setKkTargetMode('existing');
      setTargetKeluargaId(preselectKeluargaId);
    } else if (
      selectedKeluargaFilterId !== 'Semua' &&
      keluargaList.some((k) => k.id === selectedKeluargaFilterId)
    ) {
      setKkTargetMode('existing');
      setTargetKeluargaId(selectedKeluargaFilterId);
    } else if (keluargaList.length > 0) {
      setKkTargetMode('existing');
      setTargetKeluargaId(keluargaList[0].id);
    } else {
      setKkTargetMode('new');
      setTargetKeluargaId('');
    }

    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditMember = (member: AnggotaKeluargaTerpadu) => {
    setEditingMember(member);
    setKkTargetMode('existing');
    setTargetKeluargaId(member.keluargaId);
    setMemberForm({
      id: member.id,
      nama: member.nama,
      nik: member.nik || '',
      jenisKelamin: member.jenisKelamin || 'Perempuan',
      tempatLahir: member.tempatLahir || '',
      tanggalLahir: member.tanggalLahir || '',
      usia: member.usia ?? 30,
      agama: member.agama || 'Islam',
      pendidikan: member.pendidikan || 'SMA / SMK',
      jenisPekerjaan: member.jenisPekerjaan || 'Ibu Rumah Tangga',
      statusPernikahan: member.statusPernikahan || 'Kawin',
      statusHubungan: member.statusHubungan || 'ISTRI',
      kategoriSasaran: member.kategoriSasaran || 'Umum',
      noHp: member.noHp || '',
      catatan: member.catatan || '',
    });
    setIsAddModalOpen(true);
  };

  // Calculate age from birth date automatically
  const handleBirthDateChange = (dateStr: string) => {
    let calculatedAge = memberForm.usia;
    if (dateStr) {
      const birthYear = new Date(dateStr).getFullYear();
      const currentYear = new Date().getFullYear();
      if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
        calculatedAge = Math.max(0, currentYear - birthYear);
      }
    }
    let autoSasaran = memberForm.kategoriSasaran;
    if (typeof calculatedAge === 'number') {
      if (calculatedAge <= 5) autoSasaran = 'Balita';
      else if (calculatedAge >= 60) autoSasaran = 'Lansia';
      else if (calculatedAge >= 6 && calculatedAge <= 17) autoSasaran = 'Anak/Sekolah';
      else if (calculatedAge >= 18 && calculatedAge <= 24 && memberForm.statusPernikahan === 'Belum Kawin')
        autoSasaran = 'Remaja';
    }
    setMemberForm((prev) => ({
      ...prev,
      tanggalLahir: dateStr,
      usia: calculatedAge,
      kategoriSasaran: autoSasaran,
    }));
  };

  // Submit Add / Edit Member
  const handleSubmitMemberForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.nama.trim()) return;

    if (editingMember) {
      updateAnggotaKeluargaItem(editingMember.keluargaId, editingMember.id, memberForm);
      setIsAddModalOpen(false);
      return;
    }

    if (kkTargetMode === 'existing' && targetKeluargaId) {
      const targetKK = keluargaList.find((k) => k.id === targetKeluargaId);
      addAnggotaKeluargaItem(
        {
          keluargaId: targetKeluargaId,
          noKk: targetKK?.noKk,
          namaKepalaKeluarga: targetKK?.namaKepalaKeluarga,
          namaIbu: targetKK?.namaIbu,
          dasawisma: targetKK?.dasawisma,
          alamat: targetKK?.alamat,
          kategoriSejahtera: targetKK?.kategoriSejahtera,
        },
        memberForm,
        alsoRegisterPKK
          ? {
              registerAsAnggotaPKK: true,
              jabatan: pkkJabatan,
              pokja: pkkPokja,
              noHp: memberForm.noHp,
            }
          : undefined
      );
    } else {
      addAnggotaKeluargaItem(
        {
          noKk: newKKData.noKk || '3201010101010001',
          namaKepalaKeluarga: newKKData.namaKepalaKeluarga || memberForm.nama,
          namaIbu:
            newKKData.namaIbu ||
            (memberForm.statusHubungan === 'ISTRI' ? memberForm.nama : '-'),
          dasawisma: newKKData.dasawisma,
          alamat: newKKData.alamat,
          kategoriSejahtera: newKKData.kategoriSejahtera,
        },
        memberForm,
        alsoRegisterPKK
          ? {
              registerAsAnggotaPKK: true,
              jabatan: pkkJabatan,
              pokja: pkkPokja,
              noHp: memberForm.noHp,
            }
          : undefined
      );
    }

    setIsAddModalOpen(false);
  };

  // Handle Scan KK AI result
  const handleSelectFromScanKK = (
    _selectedMember: AnggotaKeluargaKK,
    kkData: KartuKeluargaData
  ) => {
    addKeluarga({
      noKk: kkData.noKk,
      namaKepalaKeluarga: kkData.namaKepalaKeluarga,
      namaIbu: kkData.namaIbu || '-',
      alamat: kkData.alamat,
      dasawisma: 'Dasawisma Flamboyan 9',
      jumlahAnggotaKeluarga: kkData.anggotaKeluarga?.length || kkData.jumlahAnggotaKeluarga || 4,
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
      catatanKesehatan: `Terintegrasi dari Scan AI KK No. ${kkData.noKk} (${kkData.anggotaKeluarga?.length || 0} Anggota Keluarga).`,
    });
    setSyncFeedback(
      `Berhasil mengimpor KK No. ${kkData.noKk} (${kkData.namaKepalaKeluarga}) beserta ${
        kkData.anggotaKeluarga?.length || 0
      } daftar nama anggota keluarga lengkap!`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Handle Sync All Data
  const handleSyncAll = () => {
    const res = syncSemuaDataKeluargaDanAnggota();
    setSyncFeedback(
      `Sinkronisasi Terpadu Berhasil! Seluruh data KK Dasawisma, ${semuaAnggotaKeluarga.length} Anggota Keluarga, Buku I Anggota PKK, dan Matriks Iuran telah terintegrasi (${res.syncedKK} KK baru disinkronkan).`
    );
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Export Excel (.xlsx)
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredMembers.map((m, idx) => ({
      No: idx + 1,
      'Nama Lengkap Anggota Keluarga': m.nama,
      NIK: `'${m.nik || '-'}`,
      'Jenis Kelamin': m.jenisKelamin,
      'Hubungan Keluarga': m.statusHubungan,
      'Usia (Tahun)': m.usia ?? '-',
      'Tempat, Tgl Lahir': `${m.tempatLahir || '-'}, ${m.tanggalLahir || '-'}`,
      'Kategori Sasaran': m.kategoriSasaran || 'Umum',
      Pendidikan: m.pendidikan || '-',
      Pekerjaan: m.jenisPekerjaan || '-',
      'Status Kawin': m.statusPernikahan || '-',
      'Nomor KK': `'${m.noKk}`,
      'Nama Kepala Keluarga': m.namaKepalaKeluarga,
      'Nama Ibu': m.namaIbuKeluarga,
      'Kelompok Dasawisma': m.dasawisma,
      Alamat: m.alamat,
      'Kategori Sejahtera': m.kategoriSejahtera,
      'Status Kader/PKK': m.isAnggotaPKK ? `Ya (${m.jabatanPKK} - ${m.pokjaPKK})` : 'Warga Umum',
      'Iuran Lunas (Bln)': m.iuranLunasCount !== undefined ? `${m.iuranLunasCount} Bulan` : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 22 },
      { wch: 22 },
      { wch: 26 },
      { wch: 16 },
      { wch: 26 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Anggota Keluarga');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    saveAs(
      data,
      `Daftar_Anggota_Keluarga_Lengkap_${profil.namaRT.replace(/\s+/g, '_')}.xlsx`
    );
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'No',
      'Nama Anggota Keluarga',
      'NIK',
      'Jenis Kelamin',
      'Hubungan Keluarga',
      'Usia',
      'Kategori Sasaran',
      'Pendidikan',
      'Pekerjaan',
      'No KK',
      'Kepala Keluarga',
      'Kelompok Dasawisma',
      'Alamat',
      'Status PKK',
    ];
    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${m.nama}"`,
      `'${m.nik || '-'}`,
      m.jenisKelamin,
      `"${m.statusHubungan}"`,
      m.usia ?? '-',
      `"${m.kategoriSasaran || 'Umum'}"`,
      `"${m.pendidikan || '-'}"`,
      `"${m.jenisPekerjaan || '-'}"`,
      `'${m.noKk}`,
      `"${m.namaKepalaKeluarga}"`,
      `"${m.dasawisma}"`,
      `"${m.alamat}"`,
      `"${m.isAnggotaPKK ? m.jabatanPKK : 'Warga'}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Anggota_Keluarga_${profil.namaRT}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print Official Family Members Report
  const handlePrintDaftarAnggotaKeluarga = () => {
    const printWin = window.open('', '_blank', 'width=1100,height=800');
    if (!printWin) {
      window.print();
      return;
    }

    const rowsHtml = filteredMembers
      .map(
        (m, i) => `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td><strong>${m.nama}</strong><br/><span style="font-size:10px;color:#555;">NIK: ${m.nik || '-'}</span></td>
          <td style="text-align:center;">${m.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
          <td>${m.statusHubungan}</td>
          <td style="text-align:center;">${m.usia ?? '-'} Th</td>
          <td>${m.pendidikan || '-'}<br/><span style="font-size:10px;color:#555;">${m.jenisPekerjaan || '-'}</span></td>
          <td><strong>${m.namaKepalaKeluarga}</strong><br/><span style="font-size:10px;color:#555;">KK: ${m.noKk}</span></td>
          <td>${m.dasawisma}<br/><span style="font-size:10px;color:#555;">${m.alamat}</span></td>
          <td>${m.kategoriSasaran || 'Umum'}${m.isAnggotaPKK ? `<br/><strong style="color:#047857;font-size:10px;">Kader: ${m.jabatanPKK}</strong>` : ''}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Nama Anggota Keluarga Lengkap - TP PKK ${profil.namaRT}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
          .header { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
          .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #0f766e; }
          .header h3 { margin: 4px 0; font-size: 13px; }
          .header p { margin: 2px 0; font-size: 11px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
          .sign-box { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 40px; }
          .sign-col { text-align: center; width: 220px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>TIM PENGGERAK PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (TP PKK)</h2>
          <h3>DAFTAR NAMA ANGGOTA KELUARGA LENGKAP & SENSUS WARGA ${profil.namaRT} / ${profil.namaRW}</h3>
          <p>Kelurahan ${profil.namaKelurahan || '-'}, Kecamatan ${profil.namaKecamatan || '-'}, ${profil.namaKota || '-'}</p>
        </div>
        <div style="margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 11px;">
          <div><strong>Filter Dasawisma:</strong> ${filterDasawisma} | <strong>Hubungan:</strong> ${filterHubungan}</div>
          <div><strong>Total Warga Tercetak:</strong> ${filteredMembers.length} Jiwa</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:30px;text-align:center;">No</th>
              <th>Nama Lengkap & NIK</th>
              <th style="width:35px;text-align:center;">L/P</th>
              <th>Status Hubungan</th>
              <th style="width:55px;text-align:center;">Usia</th>
              <th>Pendidikan & Pekerjaan</th>
              <th>Kepala Keluarga & No. KK</th>
              <th>Dasawisma & Alamat</th>
              <th>Sasaran / Ket. PKK</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align:center;padding:20px;">Belum ada data anggota keluarga</td></tr>'}
          </tbody>
        </table>
        <div class="sign-box">
          <div class="sign-col">
            <p>Mengetahui,<br/><strong>Ketua TP PKK ${profil.namaRT}</strong></p>
            <br/><br/><br/>
            <p><strong><u>${profil.namaKetua || '................................'}</u></strong></p>
          </div>
          <div class="sign-col">
            <p>${profil.namaKota || 'Tempat'}, ${new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}<br/><strong>Sekretaris TP PKK ${profil.namaRT}</strong></p>
            <br/><br/><br/>
            <p><strong><u>${profil.namaSekretaris || '................................'}</u></strong></p>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Daftar Nama Anggota Keluarga Lengkap
            </h2>
            <Badge variant="emerald" size="sm">
              {filteredMembers.length} dari {stats.totalWarga} Jiwa
            </Badge>
            <Badge variant="blue" size="sm">
              {keluargaList.length} KK Terintegrasi
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Basis data individu seluruh anggota keluarga (Kepala Keluarga, Ibu, Anak, Lansia) yang terintegrasi otomatis dengan KK Dasawisma, Buku I Kader PKK, dan Iuran
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {embeddedInDasawisma && onSwitchToKKTab && (
            <button
              type="button"
              onClick={onSwitchToKKTab}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-sky-600" />
              <span>Tabel Rekap KK</span>
            </button>
          )}

          <button
            type="button"
            id="btn-sync-all-keluarga-anggota"
            onClick={handleSyncAll}
            className="px-3 py-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-200 dark:border-sky-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sinkronkan seluruh data antara KK Dasawisma, Daftar Anggota Keluarga, Buku I Anggota PKK, dan Matriks Iuran"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Sinkronkan Terpadu</span>
          </button>

          <button
            type="button"
            id="btn-scan-kk-anggota-keluarga"
            onClick={() => setIsScanKKOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>Scan KK AI</span>
          </button>

          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              type="button"
              onClick={exportExcel}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Unduh Daftar Anggota Keluarga dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Unduh format CSV"
            >
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintDaftarAnggotaKeluarga}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Cetak Daftar Anggota Keluarga Resmi"
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" />
              <span>Cetak</span>
            </button>
          </div>

          <button
            type="button"
            id="btn-tambah-anggota-keluarga"
            onClick={() => handleOpenAddMember()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Anggota Keluarga</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Banner */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Anggota Keluarga</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {stats.totalWarga} Jiwa
            </p>
            <p className="text-[10px] text-slate-500">
              {stats.totalLaki} Laki-laki • {stats.totalPerempuan} Perempuan
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Struktur Hubungan KK</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {stats.totalKepalaKK} Kepala KK • {stats.totalIstri} Istri
            </p>
            <p className="text-[10px] text-slate-500">
              {stats.totalAnak} Anak & Anggota Lainnya
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Sasaran Posyandu & Gizi</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {stats.totalBalita} Balita • {stats.totalLansia} Lansia
            </p>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
              {stats.totalBumil} Ibu Hamil Terpantau
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Terintegrasi Kader PKK</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.totalTerdaftarPKK} Pengurus / Kader
            </p>
            <p className="text-[10px] text-slate-500">
              Terhubung Buku I & Matriks Iuran
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Parameter Filter Panel */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Filter Terpadu Daftar Anggota Keluarga
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="emerald" size="sm">
                {activeFilterCount} Filter Aktif
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tabel Semua Warga</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped-kk')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grouped-kk'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Per Kartu Keluarga (KK)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 1 of Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-search-anggota-keluarga"
              placeholder="Cari nama warga, NIK, No KK, kepala keluarga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Kelompok Dasawisma */}
          <div>
            <select
              id="filter-ak-dasawisma"
              value={filterDasawisma}
              onChange={(e) => setFilterDasawisma(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kelompok Dasawisma</option>
              {DASAWISMA_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kartu Keluarga (Kepala Keluarga) */}
          <div>
            <select
              id="filter-ak-kk"
              value={selectedKeluargaFilterId}
              onChange={(e) => setSelectedKeluargaFilterId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kartu Keluarga ({keluargaList.length} KK)</option>
              {keluargaList.map((kk) => (
                <option key={kk.id} value={kk.id}>
                  KK: {kk.namaKepalaKeluarga} ({kk.noKk.slice(-4)}) - {kk.anggotaKeluarga?.length || kk.jumlahAnggotaKeluarga} Jiwa
                </option>
              ))}
            </select>
          </div>

          {/* Filter Hubungan Keluarga */}
          <div>
            <select
              id="filter-ak-hubungan"
              value={filterHubungan}
              onChange={(e) => setFilterHubungan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status Hubungan KK</option>
              <option value="KEPALA KELUARGA">Kepala Keluarga</option>
              <option value="ISTRI">Istri / Ibu Rumah Tangga</option>
              <option value="ANAK">Anak Kandung / Tiri</option>
              <option value="ORANG TUA">Orang Tua / Mertua / Lansia</option>
              <option value="FAMILI LAIN">Famili Lain</option>
            </select>
          </div>
        </div>

        {/* Row 2 of Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter Jenis Kelamin */}
          <div>
            <select
              id="filter-ak-gender"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Jenis Kelamin (L & P)</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Filter Sasaran & Kelompok Usia */}
          <div>
            <select
              id="filter-ak-sasaran"
              value={filterSasaranUsia}
              onChange={(e) => setFilterSasaranUsia(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Kelompok Usia & Sasaran PKK</option>
              <option value="Balita">Balita (0 - 5 Tahun)</option>
              <option value="Anak/Sekolah">Anak & Usia Sekolah (6 - 17 Tahun)</option>
              <option value="Remaja">Remaja / Pemuda (18 - 24 Tahun)</option>
              <option value="Dewasa">Usia Produktif / Dewasa (25 - 59 Tahun)</option>
              <option value="Lansia">Warga Lansia (60+ Tahun)</option>
              <option value="Ibu Hamil">Ibu Hamil (Sasaran Posyandu)</option>
              <option value="WUS">Wanita Usia Subur (WUS)</option>
              <option value="PUS">Pasangan Usia Subur (PUS)</option>
            </select>
          </div>

          {/* Filter Pendidikan */}
          <div>
            <select
              id="filter-ak-pendidikan"
              value={filterPendidikan}
              onChange={(e) => setFilterPendidikan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Tingkat Pendidikan</option>
              <option value="PAUD/TK">Belum Sekolah / PAUD / TK</option>
              <option value="SD">SD / Sederajat</option>
              <option value="SMP">SMP / Sederajat</option>
              <option value="SMA/SMK">SMA / SMK / Sederajat</option>
              <option value="Perguruan Tinggi">Diploma / Sarjana (D3/S1/S2)</option>
            </select>
          </div>

          {/* Filter Integrasi Status PKK */}
          <div>
            <select
              id="filter-ak-status-pkk"
              value={filterStatusPKK}
              onChange={(e) => setFilterStatusPKK(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="Semua">Semua Status Keanggotaan PKK</option>
              <option value="Kader/Anggota PKK">Sudah Terdaftar Pengurus/Kader PKK</option>
              <option value="Warga Umum">Warga Umum (Belum Jadi Pengurus)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter Cepat:</span>
          {[
            { label: 'Semua Warga', hub: 'Semua', sas: 'Semua', pkk: 'Semua' },
            { label: 'Kepala Keluarga', hub: 'KEPALA KELUARGA', sas: 'Semua', pkk: 'Semua' },
            { label: 'Ibu / Istri', hub: 'ISTRI', sas: 'Semua', pkk: 'Semua' },
            { label: 'Anak', hub: 'ANAK', sas: 'Semua', pkk: 'Semua' },
            { label: 'Balita (Posyandu)', hub: 'Semua', sas: 'Balita', pkk: 'Semua' },
            { label: 'Lansia', hub: 'Semua', sas: 'Lansia', pkk: 'Semua' },
            { label: 'Kader / Pengurus PKK', hub: 'Semua', sas: 'Semua', pkk: 'Kader/Anggota PKK' },
          ].map((chip) => {
            const isChipActive =
              filterHubungan === chip.hub &&
              filterSasaranUsia === chip.sas &&
              filterStatusPKK === chip.pkk;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setFilterHubungan(chip.hub);
                  setFilterSasaranUsia(chip.sas);
                  setFilterStatusPKK(chip.pkk);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isChipActive
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Mode 1 (Table All Members) OR Mode 2 (Grouped by KK) */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3.5 py-3.5 w-10 text-center">No</th>
                  <th className="px-4 py-3.5">Nama Lengkap Anggota Keluarga & NIK</th>
                  <th className="px-3.5 py-3.5">Hubungan KK</th>
                  <th className="px-3.5 py-3.5">L/P & Usia</th>
                  <th className="px-3.5 py-3.5">Pendidikan & Pekerjaan</th>
                  <th className="px-4 py-3.5">Kepala Keluarga & No. KK</th>
                  <th className="px-3.5 py-3.5">Dasawisma & Alamat</th>
                  <th className="px-3.5 py-3.5">Integrasi PKK & Iuran</th>
                  <th className="px-3.5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          Belum ada data anggota keluarga yang sesuai filter.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Klik tombol &ldquo;+ Tambah Anggota Keluarga&rdquo; atau &ldquo;Sinkronkan Terpadu&rdquo; untuk menampilkan seluruh daftar anggota keluarga.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => (
                    <tr
                      key={`${m.keluargaId}-${m.id}-${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3.5 py-3.5 text-center font-semibold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Nama & NIK */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-[11px] shrink-0 ${
                              m.jenisKelamin === 'Laki-laki'
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                                : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                            }`}
                          >
                            {m.nama
                              .replace(/^(Bpk\.?|Ibu|Ny\.?|Hj\.?|H\.?|Ananda)\s+/gi, '')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenEditMember(m)}
                              title="Klik untuk mengubah nama lengkap / biodata anggota ini"
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 text-left group cursor-pointer transition-colors"
                            >
                              <span>{m.nama}</span>
                              <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <div className="text-[10px] text-slate-400 font-mono">
                              NIK: {m.nik || '-'}
                            </div>
                            {m.noHp && m.noHp !== '-' && (
                              <div className="mt-0.5">
                                <a
                                  href={`https://wa.me/${m.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Kirim pesan WhatsApp ke ${m.nama}`}
                                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{m.noHp}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Hubungan Keluarga */}
                      <td className="px-3.5 py-3.5">
                        <Badge
                          variant={
                            m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA'
                              ? 'blue'
                              : m.statusHubungan?.toUpperCase() === 'ISTRI'
                              ? 'emerald'
                              : m.statusHubungan?.toUpperCase() === 'ANAK'
                              ? 'amber'
                              : 'purple'
                          }
                          size="sm"
                        >
                          {m.statusHubungan || 'Anggota'}
                        </Badge>
                      </td>

                      {/* L/P & Usia & Sasaran */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.jenisKelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}{' '}
                          {m.usia !== undefined ? `• ${m.usia} Th` : ''}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {m.kategoriSasaran && m.kategoriSasaran !== 'Umum' && (
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                m.kategoriSasaran === 'Balita'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                  : m.kategoriSasaran === 'Ibu Hamil'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                  : m.kategoriSasaran === 'Lansia'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                                  : 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300'
                              }`}
                            >
                              {m.kategoriSasaran}
                            </span>
                          )}
                          {m.tanggalLahir && (
                            <span className="text-[10px] text-slate-400">{m.tanggalLahir}</span>
                          )}
                        </div>
                      </td>

                      {/* Pendidikan & Pekerjaan */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {m.pendidikan || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.jenisPekerjaan || '-'}
                        </div>
                      </td>

                      {/* Kepala Keluarga & No KK */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedKeluargaFilterId(
                              selectedKeluargaFilterId === m.keluargaId ? 'Semua' : m.keluargaId
                            )
                          }
                          className="text-left group cursor-pointer"
                          title="Klik untuk memfilter seluruh anggota keluarga dalam KK ini"
                        >
                          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                            <span>{m.namaKepalaKeluarga}</span>
                          </div>
                          {m.namaIbuKeluarga && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Ibu: {m.namaIbuKeluarga}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            KK: {m.noKk}
                          </div>
                        </button>
                      </td>

                      {/* Dasawisma & Alamat */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {m.dasawisma}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {m.alamat}
                        </div>
                      </td>

                      {/* Integrasi PKK & Iuran */}
                      <td className="px-3.5 py-3.5">
                        {m.isAnggotaPKK ? (
                          <div className="space-y-1">
                            <Badge variant="emerald" size="sm" dot>
                              {m.jabatanPKK || 'Anggota PKK'}
                            </Badge>
                            {m.iuranLunasCount !== undefined && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                Iuran: {m.iuranLunasCount}/12 Bln Lunas
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPromotingMember(m);
                              setPromoteJabatan('Kader Dasawisma');
                              setPromotePokja('Pokja I');
                              setPromoteNoHp(m.noHp || '');
                            }}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Integrasikan warga ini ke Buku I Daftar Anggota & Kader PKK"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>+ Kader PKK</span>
                          </button>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-3.5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailMember(m)}
                            title="Lihat Rincian Anggota Keluarga"
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditMember(m)}
                            title="Ubah Data Anggota Keluarga"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingTarget({
                                keluargaId: m.keluargaId,
                                memberId: m.id,
                                nama: m.nama,
                              })
                            }
                            title="Hapus Anggota Keluarga"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
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
      ) : (
        /* Mode 2: Grouped by Kartu Keluarga (KK) Cards */
        <div className="space-y-4">
          {groupedByKK.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              Tidak ada data Kartu Keluarga yang cocok dengan filter pencarian.
            </div>
          ) : (
            groupedByKK.map((group) => (
              <div
                key={group.keluargaId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* KK Group Header */}
                <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      KK
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Keluarga {group.namaKepalaKeluarga}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          No. KK: {group.noKk}
                        </span>
                        <Badge variant="blue" size="sm">
                          {group.dasawisma}
                        </Badge>
                        <Badge variant={group.statusRumahSehat ? 'emerald' : 'amber'} size="sm">
                          {group.kategoriSejahtera}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ibu Rumah Tangga: <strong>{group.namaIbuKeluarga}</strong> • Alamat:{' '}
                        {group.alamat} • Total: <strong>{group.members.length} Anggota Keluarga</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddMember(group.keluargaId)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Anggota KK Ini</span>
                  </button>
                </div>

                {/* Members Table inside KK */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50/40 dark:bg-slate-800/30 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 w-10 text-center">No</th>
                        <th className="px-4 py-2.5">Nama Lengkap Anggota Keluarga</th>
                        <th className="px-4 py-2.5">NIK</th>
                        <th className="px-4 py-2.5">Status Hubungan</th>
                        <th className="px-4 py-2.5">Jenis Kelamin & Usia</th>
                        <th className="px-4 py-2.5">Pendidikan & Pekerjaan</th>
                        <th className="px-4 py-2.5">Sasaran / Status PKK</th>
                        <th className="px-4 py-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {group.members.map((m, idx) => (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                            {m.nama}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                            {m.nik || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant={
                                m.statusHubungan?.toUpperCase() === 'KEPALA KELUARGA'
                                  ? 'blue'
                                  : m.statusHubungan?.toUpperCase() === 'ISTRI'
                                  ? 'emerald'
                                  : 'amber'
                              }
                              size="sm"
                            >
                              {m.statusHubungan}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            {m.jenisKelamin} {m.usia !== undefined ? `(${m.usia} Th)` : ''}
                          </td>
                          <td className="px-4 py-2.5">
                            {m.pendidikan || '-'} • {m.jenisPekerjaan || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {m.kategoriSasaran && m.kategoriSasaran !== 'Umum' && (
                                <Badge variant="purple" size="sm">
                                  {m.kategoriSasaran}
                                </Badge>
                              )}
                              {m.isAnggotaPKK ? (
                                <Badge variant="emerald" size="sm" dot>
                                  {m.jabatanPKK}
                                </Badge>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPromotingMember(m);
                                    setPromoteJabatan('Kader Dasawisma');
                                    setPromotePokja('Pokja I');
                                    setPromoteNoHp(m.noHp || '');
                                  }}
                                  className="text-[11px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                                >
                                  + Jadikan Kader
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailMember(m)}
                                className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
                                title="Detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditMember(m)}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingTarget({
                                    keluargaId: m.keluargaId,
                                    memberId: m.id,
                                    nama: m.nama,
                                  })
                                }
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Add / Edit Anggota Keluarga */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          editingMember
            ? `Ubah Data Anggota Keluarga: ${editingMember.nama}`
            : 'Tambah Anggota Keluarga Baru (Terintegrasi KK & PKK)'
        }
        subtitle={`Pendataan biodata individu warga dalam Kartu Keluarga TP PKK ${profil.namaRT}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitMemberForm} className="space-y-4">
          {/* Step 1: Pilih KK Terdaftar atau Buat KK Baru */}
          {!editingMember && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>1. Kartu Keluarga (KK) Induk *</span>
                </label>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setKkTargetMode('existing')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      kkTargetMode === 'existing'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pilih KK Terdaftar
                  </button>
                  <button
                    type="button"
                    onClick={() => setKkTargetMode('new')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      kkTargetMode === 'new'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Buat KK Baru
                  </button>
                </div>
              </div>

              {kkTargetMode === 'existing' && keluargaList.length > 0 ? (
                <div>
                  <select
                    value={targetKeluargaId}
                    onChange={(e) => setTargetKeluargaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {keluargaList.map((kk) => (
                      <option key={kk.id} value={kk.id}>
                        No. KK: {kk.noKk} — Kepala Keluarga: {kk.namaKepalaKeluarga} ({kk.dasawisma})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nomor KK Baru (16 Digit) *
                    </label>
                    <input
                      type="text"
                      required={kkTargetMode === 'new'}
                      maxLength={16}
                      placeholder="Contoh: 3201010101010005"
                      value={newKKData.noKk}
                      onChange={(e) => setNewKKData({ ...newKKData, noKk: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Kelompok Dasawisma *
                    </label>
                    <select
                      value={newKKData.dasawisma}
                      onChange={(e) =>
                        setNewKKData({ ...newKKData, dasawisma: e.target.value as DasawismaName })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {DASAWISMA_LIST.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nama Kepala Keluarga *
                    </label>
                    <input
                      type="text"
                      required={kkTargetMode === 'new'}
                      placeholder="Contoh: Bpk. Ahmad Fauzi"
                      value={newKKData.namaKepalaKeluarga}
                      onChange={(e) =>
                        setNewKKData({ ...newKKData, namaKepalaKeluarga: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Alamat Rumah
                    </label>
                    <input
                      type="text"
                      placeholder="Jl. Mawar Indah No. 15"
                      value={newKKData.alamat}
                      onChange={(e) => setNewKKData({ ...newKKData, alamat: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Biodata Lengkap Anggota Keluarga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Anggota Keluarga *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ny. Siti Rahmawati / Ananda Rizky"
                value={memberForm.nama}
                onChange={(e) => setMemberForm({ ...memberForm, nama: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Kependudukan (NIK 16 Digit) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="16 digit NIK"
                value={memberForm.nik}
                onChange={(e) => setMemberForm({ ...memberForm, nik: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Hubungan dalam Keluarga (KK) *
              </label>
              <select
                value={memberForm.statusHubungan}
                onChange={(e) => {
                  const hub = e.target.value;
                  const autoGender =
                    hub === 'ISTRI'
                      ? 'Perempuan'
                      : hub === 'KEPALA KELUARGA'
                      ? 'Laki-laki'
                      : memberForm.jenisKelamin;
                  setMemberForm({
                    ...memberForm,
                    statusHubungan: hub,
                    jenisKelamin: autoGender,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="KEPALA KELUARGA">KEPALA KELUARGA</option>
                <option value="ISTRI">ISTRI</option>
                <option value="ANAK">ANAK</option>
                <option value="ORANG TUA">ORANG TUA</option>
                <option value="MERTUA">MERTUA</option>
                <option value="FAMILI LAIN">FAMILI LAIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={memberForm.jenisKelamin}
                onChange={(e) =>
                  setMemberForm({
                    ...memberForm,
                    jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Contoh: Jakarta / Bandung"
                value={memberForm.tempatLahir || ''}
                onChange={(e) => setMemberForm({ ...memberForm, tempatLahir: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={memberForm.tanggalLahir || ''}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Usia (Tahun) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={memberForm.usia ?? 0}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, usia: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pendidikan Terakhir
              </label>
              <select
                value={memberForm.pendidikan || 'SMA / SMK'}
                onChange={(e) => setMemberForm({ ...memberForm, pendidikan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Belum Sekolah / PAUD">Belum Sekolah / PAUD / TK</option>
                <option value="SD / Sederajat">SD / Sederajat</option>
                <option value="SMP / Sederajat">SMP / Sederajat</option>
                <option value="SMA / SMK">SMA / SMK / Sederajat</option>
                <option value="Diploma (D1-D3)">Diploma (D1-D3)</option>
                <option value="Sarjana (S1)">Sarjana (S1)</option>
                <option value="Pascasarjana (S2/S3)">Pascasarjana (S2/S3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pekerjaan / Aktivitas
              </label>
              <input
                type="text"
                placeholder="Contoh: Ibu Rumah Tangga / Karyawan Swasta / Pelajar"
                value={memberForm.jenisPekerjaan || ''}
                onChange={(e) => setMemberForm({ ...memberForm, jenisPekerjaan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Pernikahan
              </label>
              <select
                value={memberForm.statusPernikahan || 'Kawin'}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, statusPernikahan: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Sasaran Program PKK / Posyandu
              </label>
              <select
                value={memberForm.kategoriSasaran || 'Umum'}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, kategoriSasaran: e.target.value as any })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Umum">Warga Umum / Dewasa</option>
                <option value="Balita">Balita (0 - 5 Tahun)</option>
                <option value="Anak/Sekolah">Anak & Usia Sekolah (6 - 17 Tahun)</option>
                <option value="Remaja">Remaja / PIK-R (18 - 24 Tahun)</option>
                <option value="WUS">Wanita Usia Subur (WUS)</option>
                <option value="PUS">Pasangan Usia Subur (PUS)</option>
                <option value="Ibu Hamil">Ibu Hamil (Sasaran Prioritas Posyandu)</option>
                <option value="Lansia">Warga Lansia (60+ Tahun)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No. HP / WhatsApp (Ibu / Anggota)</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-normal">Kirim Kwitansi Iuran</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={memberForm.noHp || ''}
                onChange={(e) => setMemberForm({ ...memberForm, noHp: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Step 3: Integrasi Otomatis ke Buku I Daftar Anggota PKK */}
          {!editingMember && (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoRegisterPKK}
                  onChange={(e) => setAlsoRegisterPKK(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Integrasikan & Daftarkan juga sebagai Pengurus / Kader TP PKK (Buku I & Matriks Iuran)
                </span>
              </label>

              {alsoRegisterPKK && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                      Jabatan TP PKK
                    </label>
                    <select
                      value={pkkJabatan}
                      onChange={(e) => setPkkJabatan(e.target.value as JabatanPKK)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl"
                    >
                      <option value="Anggota Pokja">Anggota Pokja</option>
                      <option value="Kader Dasawisma">Kader Dasawisma</option>
                      <option value="Kader Posyandu">Kader Posyandu</option>
                      <option value="Ketua Pokja I">Ketua Pokja I</option>
                      <option value="Ketua Pokja II">Ketua Pokja II</option>
                      <option value="Ketua Pokja III">Ketua Pokja III</option>
                      <option value="Ketua Pokja IV">Ketua Pokja IV</option>
                      <option value="Sekretaris">Sekretaris</option>
                      <option value="Bendahara">Bendahara</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                      Kelompok Kerja (POKJA)
                    </label>
                    <select
                      value={pkkPokja}
                      onChange={(e) => setPkkPokja(e.target.value as PokjaType)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl"
                    >
                      <option value="Pokja I">Pokja I</option>
                      <option value="Pokja II">Pokja II</option>
                      <option value="Pokja III">Pokja III</option>
                      <option value="Pokja IV">Pokja IV</option>
                      <option value="Sekretariat">Sekretariat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={memberForm.noHp || ''}
                      onChange={(e) => setMemberForm({ ...memberForm, noHp: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
              {editingMember ? 'Simpan Perubahan' : 'Simpan Anggota Keluarga'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Biodata Anggota Keluarga */}
      <Modal
        isOpen={!!detailMember}
        onClose={() => setDetailMember(null)}
        title="Rincian Biodata Anggota Keluarga Terpadu"
        maxWidth="lg"
      >
        {detailMember && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/50 dark:to-sky-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">
                    {detailMember.statusHubungan}
                  </Badge>
                  <Badge variant="emerald" size="sm">
                    {detailMember.kategoriSasaran || 'Umum'}
                  </Badge>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">
                  {detailMember.nama}
                </h3>
                <p className="text-slate-500 font-mono text-[11px]">
                  NIK: {detailMember.nik || '-'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Kelompok Dasawisma</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {detailMember.dasawisma}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Jenis Kelamin & Usia
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.jenisKelamin} ({detailMember.usia ?? '-'} Tahun)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Tempat, Tanggal Lahir
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.tempatLahir || '-'}, {detailMember.tanggalLahir || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pendidikan Terakhir
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.pendidikan || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pekerjaan & Status Kawin
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.jenisPekerjaan || '-'} ({detailMember.statusPernikahan || 'Kawin'})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Kepala Keluarga & No. KK
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.namaKepalaKeluarga} ({detailMember.noKk})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Ibu Rumah Tangga & Alamat
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {detailMember.namaIbuKeluarga} • {detailMember.alamat}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  No. HP / WhatsApp Ibu
                </span>
                {detailMember.noHp && detailMember.noHp !== '-' ? (
                  <a
                    href={`https://wa.me/${detailMember.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{detailMember.noHp}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Belum terisi</span>
                )}
              </div>
            </div>

            {/* Integrasi Status di Modul Lain */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Status Integrasi Modul e-PKK</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Buku I Anggota & Kader</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {detailMember.isAnggotaPKK
                        ? `${detailMember.jabatanPKK} (${detailMember.pokjaPKK})`
                        : 'Warga Umum'}
                    </span>
                  </div>
                  {detailMember.isAnggotaPKK && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailMember(null);
                        setCurrentView('anggota');
                      }}
                      className="text-[11px] text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Buka Buku I →
                    </button>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Matriks Iuran Rutin</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {detailMember.iuranLunasCount !== undefined
                        ? `Lunas ${detailMember.iuranLunasCount} dari 12 Bulan`
                        : 'Tercatat per KK'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailMember(null);
                      setCurrentView('keuangan');
                    }}
                    className="text-[11px] text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Buka Iuran →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Promote Warga to Anggota / Kader PKK */}
      <Modal
        isOpen={!!promotingMember}
        onClose={() => setPromotingMember(null)}
        title="Integrasikan Warga ke Buku I Anggota & Kader PKK"
        subtitle={
          promotingMember
            ? `Daftarkan ${promotingMember.nama} (KK: ${promotingMember.namaKepalaKeluarga}) sebagai Pengurus/Kader PKK`
            : ''
        }
        maxWidth="md"
      >
        {promotingMember && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              promoteAnggotaKeluargaToPKK(
                promotingMember,
                promoteJabatan,
                promotePokja,
                promoteNoHp
              );
              setSyncFeedback(
                `${promotingMember.nama} berhasil diintegrasikan ke Buku I Daftar Anggota & Kader PKK serta Matriks Iuran!`
              );
              setPromotingMember(null);
              setTimeout(() => setSyncFeedback(null), 4000);
            }}
            className="space-y-4 text-xs"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {promotingMember.nama}
              </div>
              <div className="text-[11px] text-slate-500">
                NIK: {promotingMember.nik} • {promotingMember.dasawisma}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Jabatan di TP PKK *
              </label>
              <select
                value={promoteJabatan}
                onChange={(e) => setPromoteJabatan(e.target.value as JabatanPKK)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Kader Dasawisma">Kader Dasawisma</option>
                <option value="Kader Posyandu">Kader Posyandu</option>
                <option value="Anggota Pokja">Anggota Pokja</option>
                <option value="Ketua Pokja I">Ketua Pokja I</option>
                <option value="Ketua Pokja II">Ketua Pokja II</option>
                <option value="Ketua Pokja III">Ketua Pokja III</option>
                <option value="Ketua Pokja IV">Ketua Pokja IV</option>
                <option value="Sekretaris">Sekretaris</option>
                <option value="Bendahara">Bendahara</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelompok Kerja (POKJA) *
              </label>
              <select
                value={promotePokja}
                onChange={(e) => setPromotePokja(e.target.value as PokjaType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Pokja I">Pokja I (Pancasila & Gotong Royong)</option>
                <option value="Pokja II">Pokja II (Pendidikan & UP2K)</option>
                <option value="Pokja III">Pokja III (Pangan & HATINYA PKK)</option>
                <option value="Pokja IV">Pokja IV (Kesehatan & Posyandu)</option>
                <option value="Sekretariat">Sekretariat</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp / HP Aktif
              </label>
              <input
                type="tel"
                placeholder="0812xxxxxxxx"
                value={promoteNoHp}
                onChange={(e) => setPromoteNoHp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPromotingMember(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Simpan ke Buku I & Iuran
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Scan KK AI Modal */}
      <ScanKKModal
        isOpen={isScanKKOpen}
        onClose={() => setIsScanKKOpen(false)}
        onSelectAnggotaForForm={handleSelectFromScanKK}
        contextMode="anggota"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTarget}
        onClose={() => setDeletingTarget(null)}
        onConfirm={() => {
          if (deletingTarget) {
            deleteAnggotaKeluargaItem(deletingTarget.keluargaId, deletingTarget.memberId);
          }
        }}
        title="Hapus Anggota Keluarga"
        message={`Apakah Anda yakin ingin menghapus "${deletingTarget?.nama}" dari daftar anggota keluarga KK ini? Jumlah jiwa pada KK terkait akan otomatis disesuaikan.`}
        confirmLabel="Hapus Anggota"
      />
    </div>
  );
};
