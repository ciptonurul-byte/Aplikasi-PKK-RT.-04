import React, { useState, useMemo } from 'react';
import {
  Wallet,
  PlusCircle,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Filter,
  PieChart,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ShieldCheck,
  Layers,
  UserPlus,
  Users,
  RefreshCw,
  CreditCard,
  ClipboardList,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { TransaksiKas, KategoriKas, JenisKas, RekapIuranAnggota, IuranBulanStatus } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { KwitansiIuranModal } from './KwitansiIuranModal';
import { printMatriksIuran, printLaporanKeuangan } from '../../utils/printHelper';
import {
  exportLaporanKeuanganPDF,
  exportLaporanKeuanganExcel,
  exportLaporanKeuanganWord,
} from '../../utils/reportExporter';

export const KeuanganView: React.FC = () => {
  const {
    transaksiList,
    addTransaksi,
    updateTransaksi,
    deleteTransaksi,
    iuranList,
    toggleIuranBulan,
    inputIuranAnggota,
    addPesertaIuran,
    updatePesertaIuran,
    deletePesertaIuran,
    syncIuranFromAnggotaDanDasawisma,
    saldoKas,
    totalKasMasuk,
    totalKasKeluar,
    profil,
    searchGlobal,
  } = usePKK();

  const [activeTab, setActiveTab] = useState<'buku-kas' | 'iuran-warga' | 'laporan-keuangan'>('buku-kas');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // State untuk Tab Iuran Anggota
  const [searchIuran, setSearchIuran] = useState('');
  const [filterStatusIuran, setFilterStatusIuran] = useState<string>('Semua');
  const [filterDasawismaIuran, setFilterDasawismaIuran] = useState<string>('Semua');
  const [iuranNotice, setIuranNotice] = useState<string | null>(null);

  // Modal 1: Input Pembayaran Iuran Per Anggota
  const [isInputIuranModalOpen, setIsInputIuranModalOpen] = useState(false);
  const [iuranInputMode, setIuranInputMode] = useState<'existing' | 'new'>('existing');
  const [selectedAnggotaIdIuran, setSelectedAnggotaIdIuran] = useState<string>('');
  const [newMemberIuranName, setNewMemberIuranName] = useState('');
  const [newMemberIuranJabatan, setNewMemberIuranJabatan] = useState('Anggota Pokja');
  const [newMemberIuranDasawisma, setNewMemberIuranDasawisma] = useState('Dasawisma Flamboyan 9');
  const [newMemberIuranNoHp, setNewMemberIuranNoHp] = useState('');
  const [selectedBulanIuran, setSelectedBulanIuran] = useState<number[]>([new Date().getMonth() + 1]);
  const [nominalIuranInput, setNominalIuranInput] = useState<number>(profil.iuranBulananNominal || 10000);
  const [tanggalBayarIuran, setTanggalBayarIuran] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodeBayarIuran, setMetodeBayarIuran] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [catatanIuran, setCatatanIuran] = useState<string>('');
  const [autoCatatKeKas, setAutoCatatKeKas] = useState<boolean>(true);

  // Modal 2: Detail & Edit Kartu Iuran 12 Bulan Per Anggota
  const [editingMemberIuran, setEditingMemberIuran] = useState<RekapIuranAnggota | null>(null);
  const [memberEditForm, setMemberEditForm] = useState<{
    namaAnggota: string;
    jabatan: string;
    dasawisma: string;
    noHp: string;
    bulan: { [k: number]: IuranBulanStatus };
  } | null>(null);

  // Modal 3: Tambah Peserta / Anggota Iuran Baru
  const [isAddPesertaModalOpen, setIsAddPesertaModalOpen] = useState(false);
  const [addPesertaForm, setAddPesertaForm] = useState({
    namaAnggota: '',
    jabatan: 'Anggota Pokja',
    dasawisma: 'Dasawisma Flamboyan 9',
    noHp: '',
  });
  const [deletingIuranAnggotaId, setDeletingIuranAnggotaId] = useState<string | null>(null);

  // Modal 4: Kwitansi Bukti Pembayaran Iuran & Kirim WhatsApp
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
  const [kwitansiData, setKwitansiData] = useState<{
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

  // State untuk Tab Laporan Keuangan
  const [selectedTahunLaporan, setSelectedTahunLaporan] = useState<number>(new Date().getFullYear());
  const [selectedBulanLaporan, setSelectedBulanLaporan] = useState<string>('Semua');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<TransaksiKas | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialForm: Omit<TransaksiKas, 'id'> = {
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'Masuk',
    kategori: 'Iuran Rutin Anggota',
    jumlah: 100000,
    keterangan: '',
    penanggungJawab: profil.namaBendahara,
    noBukti: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const effectiveSearch = search || searchGlobal;

  const filteredTransaksi = useMemo(() => {
    return transaksiList.filter((t) => {
      const matchSearch =
        t.keterangan.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        t.kategori.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        t.penanggungJawab.toLowerCase().includes(effectiveSearch.toLowerCase());

      const matchJenis = filterJenis === 'Semua' || t.jenis === filterJenis;
      const matchKat = filterKategori === 'Semua' || t.kategori === filterKategori;

      return matchSearch && matchJenis && matchKat;
    });
  }, [transaksiList, effectiveSearch, filterJenis, filterKategori]);

  // Transaksi untuk Laporan Keuangan (Filter Tahun & Bulan)
  const kasLaporanFiltered = useMemo(() => {
    return transaksiList.filter((t) => {
      if (!t.tanggal) return true;
      const d = new Date(t.tanggal);
      const matchYear = !isNaN(d.getFullYear()) ? d.getFullYear() === selectedTahunLaporan : true;
      const matchMonth = selectedBulanLaporan !== 'Semua' ? d.getMonth() + 1 === Number(selectedBulanLaporan) : true;
      return matchYear && matchMonth;
    });
  }, [transaksiList, selectedTahunLaporan, selectedBulanLaporan]);

  const totalMasukLaporan = useMemo(() => {
    return kasLaporanFiltered.filter((t) => t.jenis === 'Masuk').reduce((a, b) => a + (b.jumlah || 0), 0);
  }, [kasLaporanFiltered]);

  const totalKeluarLaporan = useMemo(() => {
    return kasLaporanFiltered.filter((t) => t.jenis === 'Keluar').reduce((a, b) => a + (b.jumlah || 0), 0);
  }, [kasLaporanFiltered]);

  const saldoLaporan = totalMasukLaporan - totalKeluarLaporan;

  // Breakdown kategori pemasukan
  const breakdownPemasukan = useMemo(() => {
    const map: { [k: string]: number } = {};
    kasLaporanFiltered.filter((t) => t.jenis === 'Masuk').forEach((t) => {
      map[t.kategori] = (map[t.kategori] || 0) + (t.jumlah || 0);
    });
    return Object.entries(map).map(([kategori, total]) => ({
      kategori,
      total,
      persen: totalMasukLaporan > 0 ? (total / totalMasukLaporan) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [kasLaporanFiltered, totalMasukLaporan]);

  // Breakdown kategori pengeluaran
  const breakdownPengeluaran = useMemo(() => {
    const map: { [k: string]: number } = {};
    kasLaporanFiltered.filter((t) => t.jenis === 'Keluar').forEach((t) => {
      map[t.kategori] = (map[t.kategori] || 0) + (t.jumlah || 0);
    });
    return Object.entries(map).map(([kategori, total]) => ({
      kategori,
      total,
      persen: totalKeluarLaporan > 0 ? (total / totalKeluarLaporan) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [kasLaporanFiltered, totalKeluarLaporan]);

  // Rekap bulanan untuk tahun berjalan
  const rekapBulananTahun = useMemo(() => {
    const bulanArr = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    let kumulatif = 0;
    return bulanArr.map((namaBln, idx) => {
      const blnNum = idx + 1;
      const txsInMonth = transaksiList.filter((t) => {
        if (!t.tanggal) return false;
        const d = new Date(t.tanggal);
        return d.getFullYear() === selectedTahunLaporan && d.getMonth() + 1 === blnNum;
      });
      const masuk = txsInMonth.filter((t) => t.jenis === 'Masuk').reduce((a, b) => a + (b.jumlah || 0), 0);
      const keluar = txsInMonth.filter((t) => t.jenis === 'Keluar').reduce((a, b) => a + (b.jumlah || 0), 0);
      kumulatif += masuk - keluar;
      return {
        bulanNum: blnNum,
        namaBulan: namaBln,
        masuk,
        keluar,
        surplus: masuk - keluar,
        saldoKumulatif: kumulatif,
        jumlahTx: txsInMonth.length,
      };
    });
  }, [transaksiList, selectedTahunLaporan]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingTransaksi(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: TransaksiKas) => {
    setEditingTransaksi(t);
    setFormData({
      tanggal: t.tanggal,
      jenis: t.jenis,
      kategori: t.kategori,
      jumlah: t.jumlah,
      keterangan: t.keterangan,
      noBukti: t.noBukti || '',
      penanggungJawab: t.penanggungJawab,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan.trim() || formData.jumlah <= 0) return;

    if (editingTransaksi) {
      updateTransaksi(editingTransaksi.id, formData);
    } else {
      addTransaksi(formData);
    }
    setIsAddModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const exportKasCSV = () => {
    const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Uraian / Keterangan', 'Jumlah', 'Penanggung Jawab', 'No Bukti'];
    const rows = filteredTransaksi.map((t) => [
      t.id,
      t.tanggal,
      t.jenis,
      `"${t.kategori}"`,
      `"${t.keterangan}"`,
      t.jumlah,
      `"${t.penanggungJawab}"`,
      `"${t.noBukti || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_PKK_${profil.namaRT}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Handlers Ekspor Laporan Keuangan
  const handleExportPDF = () => {
    setIsExporting('pdf');
    try {
      exportLaporanKeuanganPDF(profil, transaksiList, iuranList, {
        tahun: selectedTahunLaporan,
        bulan: selectedBulanLaporan,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      exportLaporanKeuanganExcel(profil, transaksiList, iuranList, {
        tahun: selectedTahunLaporan,
        bulan: selectedBulanLaporan,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  const handleExportWord = async () => {
    setIsExporting('word');
    try {
      await exportLaporanKeuanganWord(profil, transaksiList, iuranList, {
        tahun: selectedTahunLaporan,
        bulan: selectedBulanLaporan,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsExporting(null), 500);
    }
  };

  const handlePrintLPJ = () => {
    printLaporanKeuangan(profil, transaksiList, iuranList, {
      tahun: selectedTahunLaporan,
      bulan: selectedBulanLaporan,
    });
  };

  const bulanNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Ags',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  const bulanFullNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const showTemporaryIuranNotice = (msg: string) => {
    setIuranNotice(msg);
    setTimeout(() => {
      setIuranNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Filtered Iuran List
  const effectiveSearchIuran = searchIuran || searchGlobal;
  const filteredIuranList = useMemo(() => {
    return iuranList.filter((item) => {
      const matchSearch =
        item.namaAnggota.toLowerCase().includes(effectiveSearchIuran.toLowerCase()) ||
        item.jabatan.toLowerCase().includes(effectiveSearchIuran.toLowerCase()) ||
        (item.dasawisma || '').toLowerCase().includes(effectiveSearchIuran.toLowerCase());

      const matchDasawisma =
        filterDasawismaIuran === 'Semua' || (item.dasawisma || 'Dasawisma Flamboyan 9') === filterDasawismaIuran;

      const paidCount = (Object.values(item.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas).length;
      let matchStatus = true;
      if (filterStatusIuran === 'Lunas Penuh') matchStatus = paidCount === 12;
      else if (filterStatusIuran === 'Sebagian Lunas') matchStatus = paidCount > 0 && paidCount < 12;
      else if (filterStatusIuran === 'Belum Bayar') matchStatus = paidCount === 0;

      return matchSearch && matchDasawisma && matchStatus;
    });
  }, [iuranList, effectiveSearchIuran, filterDasawismaIuran, filterStatusIuran]);

  // Statistik Iuran
  const statsIuran = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    let totalTerkumpul = 0;
    let totalBulanTerbayar = 0;
    let lunasBulanIni = 0;
    let lunasSetahunPenuh = 0;

    iuranList.forEach((item) => {
      let memberPaidMonths = 0;
      for (let m = 1; m <= 12; m++) {
        const b = item.bulan?.[m];
        if (b?.lunas) {
          memberPaidMonths++;
          totalBulanTerbayar++;
          totalTerkumpul += b.nominal || profil.iuranBulananNominal || 10000;
        }
      }
      if (item.bulan?.[currentMonth]?.lunas) {
        lunasBulanIni++;
      }
      if (memberPaidMonths === 12) {
        lunasSetahunPenuh++;
      }
    });

    return {
      totalPeserta: iuranList.length,
      totalTerkumpul,
      totalBulanTerbayar,
      lunasBulanIni,
      lunasSetahunPenuh,
      currentMonthName: bulanFullNames[currentMonth - 1],
    };
  }, [iuranList, profil.iuranBulananNominal]);

  const handleOpenInputIuran = (preselectAnggotaId?: string) => {
    setActiveTab('iuran-warga');
    const targetId = preselectAnggotaId || (iuranList.length > 0 ? iuranList[0].anggotaId : '');
    setSelectedAnggotaIdIuran(targetId);
    setIuranInputMode(iuranList.length > 0 || preselectAnggotaId ? 'existing' : 'new');
    setNewMemberIuranName('');
    setNewMemberIuranJabatan('Anggota Pokja');
    setNewMemberIuranDasawisma('Dasawisma Flamboyan 9');
    setNewMemberIuranNoHp('');

    // Preselect first unpaid month for this member if available
    const targetRec = iuranList.find((r) => r.anggotaId === targetId);
    if (targetRec) {
      let firstUnpaid = new Date().getMonth() + 1;
      for (let m = 1; m <= 12; m++) {
        if (!targetRec.bulan?.[m]?.lunas) {
          firstUnpaid = m;
          break;
        }
      }
      setSelectedBulanIuran([firstUnpaid]);
    } else {
      setSelectedBulanIuran([new Date().getMonth() + 1]);
    }

    setNominalIuranInput(profil.iuranBulananNominal || 10000);
    setTanggalBayarIuran(new Date().toISOString().split('T')[0]);
    setMetodeBayarIuran('Tunai');
    setCatatanIuran('');
    setAutoCatatKeKas(true);
    setIsInputIuranModalOpen(true);
  };

  const handleToggleMonthSelect = (m: number) => {
    setSelectedBulanIuran((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleSubmitInputIuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBulanIuran.length === 0 || nominalIuranInput <= 0) return;

    let targetId = selectedAnggotaIdIuran;
    let targetName = '';

    if (iuranInputMode === 'new') {
      if (!newMemberIuranName.trim()) return;
      targetId = addPesertaIuran({
        namaAnggota: newMemberIuranName.trim(),
        jabatan: newMemberIuranJabatan,
        dasawisma: newMemberIuranDasawisma,
        noHp: newMemberIuranNoHp,
        syncToAnggota: true,
      });
      targetName = newMemberIuranName.trim();
    } else {
      const found = iuranList.find((r) => r.anggotaId === targetId);
      if (!found) return;
      targetName = found.namaAnggota;
    }

    // Small timeout if newly created so state updates cleanly, or call directly
    setTimeout(() => {
      inputIuranAnggota({
        anggotaId: targetId,
        bulanList: selectedBulanIuran,
        nominalPerBulan: nominalIuranInput,
        tanggalBayar: tanggalBayarIuran,
        metodeBayar: metodeBayarIuran,
        catatan: catatanIuran,
        catatKeKas: autoCatatKeKas,
      });
    }, 0);

    setIsInputIuranModalOpen(false);

    // Buka otomatis Kwitansi Bukti Pembayaran Iuran dengan opsi langsung kirim ke WhatsApp
    const existingRec = iuranList.find((r) => r.anggotaId === targetId);
    const targetPhone = iuranInputMode === 'new' ? newMemberIuranNoHp : existingRec?.noHp || '';
    const targetJab = iuranInputMode === 'new' ? newMemberIuranJabatan : existingRec?.jabatan || 'Anggota Pokja';
    const targetDasa = iuranInputMode === 'new' ? newMemberIuranDasawisma : existingRec?.dasawisma || 'Dasawisma Flamboyan 9';

    setKwitansiData({
      anggotaId: targetId,
      namaPenerimaIuran: targetName,
      noHp: targetPhone,
      jabatan: targetJab,
      dasawisma: targetDasa,
      bulanList: [...selectedBulanIuran],
      tahun: new Date().getFullYear(),
      nominalPerBulan: nominalIuranInput,
      tanggalBayar: tanggalBayarIuran,
      metodeBayar: metodeBayarIuran,
      catatan: catatanIuran,
    });
    setIsKwitansiModalOpen(true);

    showTemporaryIuranNotice(
      `Berhasil mencatat pembayaran iuran ${targetName} untuk ${selectedBulanIuran.length} bulan (${formatCurrency(
        selectedBulanIuran.length * nominalIuranInput
      )}). Bukti kwitansi siap dikirim via WhatsApp.`
    );
  };

  const handleOpenKwitansi = (rec: RekapIuranAnggota, specificMonth?: number) => {
    const paidMonths: number[] = [];
    let lastPaidDate: string | undefined;
    let lastMetode: 'Tunai' | 'Transfer' = 'Tunai';
    let lastCatatan: string | undefined;
    let nominalPerBln = profil.iuranBulananNominal || 10000;

    for (let m = 1; m <= 12; m++) {
      const b = rec.bulan?.[m];
      if (b?.lunas) {
        paidMonths.push(m);
        if (b.tanggalBayar) lastPaidDate = b.tanggalBayar;
        if (b.metodeBayar) lastMetode = b.metodeBayar;
        if (b.catatan) lastCatatan = b.catatan;
        if (b.nominal) nominalPerBln = b.nominal;
      }
    }

    const targetBulan = specificMonth
      ? [specificMonth]
      : paidMonths.length > 0
      ? [paidMonths[paidMonths.length - 1]]
      : [new Date().getMonth() + 1];

    setKwitansiData({
      anggotaId: rec.anggotaId,
      namaPenerimaIuran: rec.namaAnggota,
      noHp: rec.noHp || '',
      jabatan: rec.jabatan,
      dasawisma: rec.dasawisma,
      bulanList: targetBulan,
      tahun: rec.tahun || new Date().getFullYear(),
      nominalPerBulan: nominalPerBln,
      tanggalBayar: lastPaidDate || new Date().toISOString().split('T')[0],
      metodeBayar: lastMetode,
      catatan: lastCatatan || '',
    });
    setIsKwitansiModalOpen(true);
  };

  const handleOpenEditMemberIuran = (rec: RekapIuranAnggota) => {
    const clonedBulan: { [k: number]: IuranBulanStatus } = {};
    for (let m = 1; m <= 12; m++) {
      const existing = rec.bulan?.[m];
      clonedBulan[m] = {
        lunas: existing?.lunas || false,
        nominal: existing?.nominal || profil.iuranBulananNominal || 10000,
        tanggalBayar: existing?.tanggalBayar || new Date().toISOString().split('T')[0],
        metodeBayar: existing?.metodeBayar || 'Tunai',
        catatan: existing?.catatan || '',
      };
    }
    setEditingMemberIuran(rec);
    setMemberEditForm({
      namaAnggota: rec.namaAnggota,
      jabatan: rec.jabatan,
      dasawisma: rec.dasawisma || 'Dasawisma Flamboyan 9',
      noHp: rec.noHp || '',
      bulan: clonedBulan,
    });
  };

  const handleSaveMemberIuranDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberIuran || !memberEditForm) return;
    updatePesertaIuran(editingMemberIuran.anggotaId, {
      namaAnggota: memberEditForm.namaAnggota.trim() || editingMemberIuran.namaAnggota,
      jabatan: memberEditForm.jabatan,
      dasawisma: memberEditForm.dasawisma,
      noHp: memberEditForm.noHp,
      bulan: memberEditForm.bulan,
    });
    const savedName = memberEditForm.namaAnggota;
    setEditingMemberIuran(null);
    setMemberEditForm(null);
    showTemporaryIuranNotice(`Data kartu iuran 12 bulan untuk ${savedName} berhasil diperbarui.`);
  };

  const handleSubmitAddPeserta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPesertaForm.namaAnggota.trim()) return;
    addPesertaIuran({
      namaAnggota: addPesertaForm.namaAnggota.trim(),
      jabatan: addPesertaForm.jabatan,
      dasawisma: addPesertaForm.dasawisma,
      noHp: addPesertaForm.noHp,
      syncToAnggota: true,
    });
    const addedName = addPesertaForm.namaAnggota.trim();
    setAddPesertaForm({
      namaAnggota: '',
      jabatan: 'Anggota Pokja',
      dasawisma: 'Dasawisma Flamboyan 9',
      noHp: '',
    });
    setIsAddPesertaModalOpen(false);
    showTemporaryIuranNotice(`Anggota "${addedName}" berhasil ditambahkan ke daftar peserta wajib iuran.`);
  };

  const handleSyncIuran = () => {
    const { addedCount } = syncIuranFromAnggotaDanDasawisma();
    if (addedCount > 0) {
      showTemporaryIuranNotice(`Berhasil menyinkronkan ${addedCount} anggota/warga ke dalam daftar iuran.`);
    } else {
      showTemporaryIuranNotice(`Seluruh data anggota & dasawisma sudah terdaftar pada matriks iuran.`);
    }
  };

  const exportIuranCSV = () => {
    const headers = [
      'No',
      'Nama Anggota',
      'Jabatan',
      'Kelompok Dasawisma',
      ...bulanNames,
      'Total Bulan Lunas',
      'Total Nominal Dibayar (Rp)',
    ];
    const rows = filteredIuranList.map((r, idx) => {
      let lunasCount = 0;
      let totalRp = 0;
      const monthCells = bulanNames.map((_, mIdx) => {
        const b = r.bulan?.[mIdx + 1];
        if (b?.lunas) {
          lunasCount++;
          const nom = b.nominal || profil.iuranBulananNominal || 10000;
          totalRp += nom;
          return `"Lunas (${nom})"`;
        }
        return '"Belum"';
      });
      return [
        idx + 1,
        `"${r.namaAnggota}"`,
        `"${r.jabatan}"`,
        `"${r.dasawisma || '-'}"`,
        ...monthCells,
        lunasCount,
        totalRp,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriks_Iuran_Anggota_PKK_${profil.namaRT}.csv`);
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
              Buku III: Buku Kas Umum & Laporan Keuangan
            </h2>
            <Badge variant="emerald" size="sm">
              {profil.namaRT} / {profil.namaRW}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pengelolaan akuntabilitas keuangan PKK, iuran rutin, belanja kegiatan, dan Laporan Pertanggungjawaban (LPJ) Kas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-switch-to-lpj"
            onClick={() => setActiveTab('laporan-keuangan')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              activeTab === 'laporan-keuangan'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Laporan Keuangan</span>
          </button>

          <button
            id="btn-input-iuran-header"
            onClick={() => handleOpenInputIuran()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Input Iuran Anggota</span>
          </button>

          <button
            id="btn-tambah-transaksi"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Transaksi Kas</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saldo Kas Tersedia
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {formatCurrency(saldoKas)}
            </h3>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Bendahara: {profil.namaBendahara}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <Wallet className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan (Debit)
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalKasMasuk)}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">Termasuk Iuran & Swadaya</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <ArrowDownLeft className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran (Kredit)
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalKasKeluar)}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">Kegiatan Giat, ATK & PMT</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
            <ArrowUpRight className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('buku-kas')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'buku-kas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          1. Buku Kas Umum (Buku III)
        </button>
        <button
          onClick={() => setActiveTab('iuran-warga')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'iuran-warga'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          2. Matriks Iuran Rutin Anggota (Jan - Des)
        </button>
        <button
          id="tab-laporan-keuangan-lpj"
          onClick={() => setActiveTab('laporan-keuangan')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'laporan-keuangan'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>3. Laporan Pertanggungjawaban (LPJ) Keuangan & Kas</span>
        </button>
      </div>

      {/* TAB 1: BUKU KAS UMUM */}
      {activeTab === 'buku-kas' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari uraian transaksi, nomor bukti, kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Semua">Semua Aliran (Masuk & Keluar)</option>
                  <option value="Masuk">Pemasukan Saja (Debit)</option>
                  <option value="Keluar">Pengeluaran Saja (Kredit)</option>
                </select>
              </div>

              <div>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Semua">Semua Kategori Kas</option>
                  <option value="Iuran Rutin Anggota">Iuran Rutin Anggota</option>
                  <option value="Dana Swadaya Warga">Dana Swadaya Warga</option>
                  <option value="Bantuan RW / Kelurahan">Bantuan RW / Kelurahan</option>
                  <option value="Hasil Usaha UP2K">Hasil Usaha UP2K</option>
                  <option value="Konsumsi & Logistik Pertemuan">Konsumsi & Logistik Pertemuan</option>
                  <option value="Operasional Posyandu & PMT">Operasional Posyandu & PMT</option>
                  <option value="Pengadaan Bibit TOGA & Pupuk">Pengadaan Bibit TOGA & Pupuk</option>
                  <option value="ATK & Administrasi Buku 6">ATK & Administrasi Buku 6</option>
                  <option value="Perlengkapan & Kebersihan">Perlengkapan & Kebersihan</option>
                  <option value="Sosial & Santunan Warga">Sosial & Santunan Warga</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>Menampilkan <strong>{filteredTransaksi.length}</strong> transaksi</span>
              <button
                id="btn-export-kas-csv"
                onClick={exportKasCSV}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Kas CSV</span>
              </button>
            </div>
          </div>

          {/* Table Kas Umum */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Jenis & Kategori</th>
                    <th className="px-4 py-3.5">Uraian / Keterangan</th>
                    <th className="px-4 py-3.5 text-right">Pemasukan (Rp)</th>
                    <th className="px-4 py-3.5 text-right">Pengeluaran (Rp)</th>
                    <th className="px-4 py-3.5">Penanggung Jawab</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="font-semibold text-slate-600 dark:text-slate-400">Belum Ada Transaksi Kas</p>
                          <p className="text-xs text-slate-400">Klik tombol "Catat Transaksi Kas" di atas untuk menambahkan penerimaan atau pengeluaran kas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransaksi.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium whitespace-nowrap">{t.tanggal}</td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={t.jenis === 'Masuk' ? 'emerald' : 'rose'}
                              size="sm"
                              dot
                            >
                              {t.jenis === 'Masuk' ? 'Masuk' : 'Keluar'}
                            </Badge>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {t.kategori}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-900 dark:text-slate-100 font-medium">
                          {t.keterangan}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {t.jenis === 'Masuk' ? formatCurrency(t.jumlah) : '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
                          {t.jenis === 'Keluar' ? formatCurrency(t.jumlah) : '-'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {t.penanggungJawab}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              title="Edit Transaksi"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(t.id)}
                              title="Hapus Transaksi"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 2: MATRIKS & INPUT IURAN ANGGOTA */}
      {activeTab === 'iuran-warga' && (
        <div className="space-y-4">
          {/* Notification Banner */}
          {iuranNotice && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{iuranNotice}</span>
              </div>
              <button
                onClick={() => setIuranNotice(null)}
                className="text-emerald-600 hover:text-emerald-800 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Iuran KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Peserta Wajib Iuran
                </p>
                <h4 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {statsIuran.totalPeserta} Anggota
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Lunas 12 Bulan: <strong>{statsIuran.lunasSetahunPenuh}</strong> orang
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Iuran Terkumpul
                </p>
                <h4 className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(statsIuran.totalTerkumpul)}
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Dari {statsIuran.totalBulanTerbayar} bulan setoran lunas
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Lunas Bulan {statsIuran.currentMonthName}
                </p>
                <h4 className="mt-1 text-xl font-extrabold text-teal-600 dark:text-teal-400">
                  {statsIuran.lunasBulanIni} / {statsIuran.totalPeserta}
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {statsIuran.totalPeserta > 0
                    ? `${Math.round((statsIuran.lunasBulanIni / statsIuran.totalPeserta) * 100)}% sudah membayar`
                    : 'Belum ada peserta'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tarif Standar Iuran
                </p>
                <h4 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(profil.iuranBulananNominal)}
                </h4>
                <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Per Anggota / Bulan
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action & Filter Control Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Input & Matriks Rekapitulasi Iuran Per Anggota (Tahun {selectedTahunLaporan})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Klik tombol <strong>"Input Pembayaran Iuran"</strong> untuk mencatat setoran per anggota (bisa pilih beberapa bulan sekaligus & nominal sesuai setoran), atau klik tombol <strong>"Input Bayar"</strong> / <strong>"Edit 12 Bln"</strong> pada baris anggota.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  id="btn-open-input-iuran-modal"
                  onClick={() => handleOpenInputIuran()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Input Pembayaran Iuran</span>
                </button>

                <button
                  id="btn-tambah-peserta-iuran"
                  onClick={() => setIsAddPesertaModalOpen(true)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Anggota Iuran</span>
                </button>

                <button
                  id="btn-sync-iuran-anggota"
                  onClick={handleSyncIuran}
                  title="Tarik otomatis daftar nama dari menu Anggota & Catatan Keluarga Dasawisma"
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan Anggota/Warga</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama anggota, jabatan, atau kelompok dasawisma..."
                  value={searchIuran}
                  onChange={(e) => setSearchIuran(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={filterDasawismaIuran}
                  onChange={(e) => setFilterDasawismaIuran(e.target.value)}
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
                  value={filterStatusIuran}
                  onChange={(e) => setFilterStatusIuran(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Semua">Semua Status Kelunasan</option>
                  <option value="Lunas Penuh">Lunas Penuh (12 Bulan)</option>
                  <option value="Sebagian Lunas">Sebagian Lunas (1-11 Bulan)</option>
                  <option value="Belum Bayar">Belum Ada Pembayaran (0 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>
                Menampilkan <strong>{filteredIuranList.length}</strong> dari <strong>{iuranList.length}</strong> anggota wajib iuran
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportIuranCSV}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CSV Iuran</span>
                </button>
                <button
                  onClick={() => printMatriksIuran(filteredIuranList, selectedTahunLaporan, profil)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Matriks Iuran</span>
                </button>
              </div>
            </div>
          </div>

          {/* Matriks Iuran Per Anggota Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-3 text-center w-9">No</th>
                    <th className="px-3 py-3 min-w-[170px]">Nama Anggota & Kelompok</th>
                    {bulanNames.map((b) => (
                      <th key={b} className="px-1.5 py-3 text-center">
                        {b}
                      </th>
                    ))}
                    <th className="px-2.5 py-3 text-center">Lunas</th>
                    <th className="px-3 py-3 text-right">Total Dibayar</th>
                    <th className="px-3 py-3 text-center min-w-[155px]">Aksi Input Per Anggota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredIuranList.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            Belum Ada Data Anggota pada Daftar Iuran
                          </p>
                          <p className="text-xs text-slate-400">
                            Anda dapat langsung menambahkan peserta dan menginput pembayaran iuran per anggota melalui tombol di bawah ini:
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                            <button
                              onClick={() => handleOpenInputIuran()}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Input Anggota & Bayar Iuran</span>
                            </button>
                            <button
                              onClick={() => setIsAddPesertaModalOpen(true)}
                              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Tambah Anggota Baru</span>
                            </button>
                            <button
                              onClick={handleSyncIuran}
                              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Tarik dari Daftar Anggota / Dasawisma</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredIuranList.map((iw, idx) => {
                      const paidMonths = (Object.values(iw.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas);
                      const lunasCount = paidMonths.length;
                      const totalNominalMember = paidMonths.reduce(
                        (acc: number, b: IuranBulanStatus) => acc + (b?.nominal || profil.iuranBulananNominal || 10000),
                        0
                      );

                      return (
                        <tr
                          key={iw.anggotaId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {iw.namaAnggota}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span>{iw.jabatan}</span>
                              {iw.dasawisma && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    {iw.dasawisma}
                                  </span>
                                </>
                              )}
                              {iw.noHp && iw.noHp !== '-' ? (
                                <>
                                  <span>·</span>
                                  <a
                                    href={`https://wa.me/${iw.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`Chat WhatsApp Ibu ${iw.namaAnggota}`}
                                    className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{iw.noHp}</span>
                                  </a>
                                </>
                              ) : (
                                <>
                                  <span>·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMemberIuran(iw)}
                                    title="Klik untuk mengisi nomor HP / WhatsApp Ibu"
                                    className="text-[10px] text-amber-600 hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>+ Isi No WA</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          {bulanNames.map((bName, mIdx) => {
                            const mNum = mIdx + 1;
                            const bStat = iw.bulan?.[mNum];
                            const isPaid = bStat?.lunas;
                            const nom = bStat?.nominal || profil.iuranBulananNominal || 10000;
                            return (
                              <td key={mNum} className="px-1 py-2 text-center">
                                <button
                                  onClick={() => toggleIuranBulan(iw.anggotaId, mNum)}
                                  title={
                                    isPaid
                                      ? `Bulan ${bName}: LUNAS (${formatCurrency(nom)})${bStat?.tanggalBayar ? ` pada ${bStat.tanggalBayar}` : ''} — Klik untuk batalkan`
                                      : `Bulan ${bName}: BELUM LUNAS — Klik untuk tandai Lunas (${formatCurrency(profil.iuranBulananNominal)})`
                                  }
                                  className={`w-7 h-7 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center mx-auto transition-all cursor-pointer ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-rose-100 hover:text-rose-700'
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-700'
                                  }`}
                                >
                                  <span>{isPaid ? '✓' : '—'}</span>
                                </button>
                              </td>
                            );
                          })}

                          <td className="px-2.5 py-2.5 text-center whitespace-nowrap">
                            <span
                              className={`font-bold text-xs ${
                                lunasCount === 12
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : lunasCount > 0
                                  ? 'text-teal-600 dark:text-teal-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {lunasCount}/12 Bln
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatCurrency(totalNominalMember)}
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                              <button
                                onClick={() => handleOpenInputIuran(iw.anggotaId)}
                                title={`Input pembayaran iuran untuk ${iw.namaAnggota}`}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Input Bayar</span>
                              </button>
                              <button
                                onClick={() => handleOpenKwitansi(iw)}
                                title={`Kirim Kwitansi / Bukti Iuran ${iw.namaAnggota} ke WhatsApp`}
                                className="px-2 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-emerald-300 dark:border-emerald-800 shadow-2xs"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Kwitansi WA</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditMemberIuran(iw)}
                                title={`Kelola rincian 12 bulan & nominal iuran ${iw.namaAnggota}`}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-slate-700 dark:text-slate-200 hover:text-amber-600 font-semibold text-[11px] flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>12 Bln</span>
                              </button>
                              <button
                                onClick={() => setDeletingIuranAnggotaId(iw.anggotaId)}
                                title="Hapus dari daftar iuran"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredIuranList.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-200">
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-right uppercase tracking-wider text-[10px] text-slate-500">
                        Total Anggota Lunas Per Bulan :
                      </td>
                      {bulanNames.map((_, mIdx) => {
                        const mNum = mIdx + 1;
                        const countPaid = filteredIuranList.filter((r) => r.bulan?.[mNum]?.lunas).length;
                        return (
                          <td key={mNum} className="px-1 py-3 text-center text-emerald-600 dark:text-emerald-400">
                            {countPaid}
                          </td>
                        );
                      })}
                      <td className="px-2.5 py-3 text-center text-slate-900 dark:text-slate-100">
                        {filteredIuranList.reduce(
                          (acc, r) => acc + (Object.values(r.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas).length,
                          0
                        )}{' '}
                        Bln
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(
                          filteredIuranList.reduce((acc, r) => {
                            const sumMember = (Object.values(r.bulan || {}) as IuranBulanStatus[])
                              .filter((b) => b?.lunas)
                              .reduce((s: number, b: IuranBulanStatus) => s + (b?.nominal || profil.iuranBulananNominal || 10000), 0);
                            return acc + sumMember;
                          }, 0)
                        )}
                      </td>
                      <td className="px-3 py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN & KAS */}
      {activeTab === 'laporan-keuangan' && (
        <div className="space-y-6">
          {/* Export Action Card & Filters */}
          <div className="p-6 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Format Laporan Keuangan Resmi TP PKK
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Laporan Pertanggungjawaban (LPJ) Keuangan & Kas
                </h3>
                <p className="text-emerald-100/80 text-xs leading-relaxed">
                  Generate berkas pertanggungjawaban kas resmi dilengkapi Kop Surat, rincian per pos belanja/penerimaan, neraca kas, dan kolom tanda tangan pengesahan Ketua & Bendahara.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  Unduh Dokumen Laporan:
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    id="btn-dl-keuangan-pdf"
                    onClick={handleExportPDF}
                    disabled={isExporting !== null}
                    className="flex-1 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isExporting === 'pdf' ? 'Memproses...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    id="btn-dl-keuangan-excel"
                    onClick={handleExportExcel}
                    disabled={isExporting !== null}
                    className="flex-1 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isExporting === 'excel' ? 'Memproses...' : 'Unduh Excel'}</span>
                  </button>

                  <button
                    id="btn-dl-keuangan-word"
                    onClick={handleExportWord}
                    disabled={isExporting !== null}
                    className="flex-1 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{isExporting === 'word' ? 'Memproses...' : 'Unduh Word'}</span>
                  </button>

                  <button
                    id="btn-print-keuangan"
                    onClick={handlePrintLPJ}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Periode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 mt-5 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span className="font-semibold text-emerald-100">Tahun Anggaran:</span>
                <select
                  value={selectedTahunLaporan}
                  onChange={(e) => setSelectedTahunLaporan(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value={2026} className="bg-slate-900 text-white">Tahun 2026</option>
                  <option value={2025} className="bg-slate-900 text-white">Tahun 2025</option>
                  <option value={2024} className="bg-slate-900 text-white">Tahun 2024</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-300" />
                <span className="font-semibold text-emerald-100">Filter Bulan:</span>
                <select
                  value={selectedBulanLaporan}
                  onChange={(e) => setSelectedBulanLaporan(e.target.value)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-slate-900 text-white">Semua Bulan (Setahun Penuh)</option>
                  <option value="1" className="bg-slate-900 text-white">Januari</option>
                  <option value="2" className="bg-slate-900 text-white">Februari</option>
                  <option value="3" className="bg-slate-900 text-white">Maret</option>
                  <option value="4" className="bg-slate-900 text-white">April</option>
                  <option value="5" className="bg-slate-900 text-white">Mei</option>
                  <option value="6" className="bg-slate-900 text-white">Juni</option>
                  <option value="7" className="bg-slate-900 text-white">Juli</option>
                  <option value="8" className="bg-slate-900 text-white">Agustus</option>
                  <option value="9" className="bg-slate-900 text-white">September</option>
                  <option value="10" className="bg-slate-900 text-white">Oktober</option>
                  <option value="11" className="bg-slate-900 text-white">November</option>
                  <option value="12" className="bg-slate-900 text-white">Desember</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posisi Arus Kas Statement */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Penerimaan</p>
              <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalMasukLaporan)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Debit Kas Terkumpul</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
              <h4 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(totalKeluarLaporan)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Kredit Belanja Operasional</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Surplus / (Defisit)</p>
              <h4 className={`text-xl font-extrabold mt-1 ${saldoLaporan >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatCurrency(saldoLaporan)}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                {saldoLaporan >= 0 ? 'Surplus Anggaran' : 'Defisit Anggaran'}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Saldo Kas Riil</p>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {formatCurrency(saldoLaporan)}
              </h4>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                Di Kas Bendahara
              </p>
            </div>
          </div>

          {/* Breakdown Pos Pemasukan & Pengeluaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pemasukan Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Rincian Pos Penerimaan Kas (Debit)
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(totalMasukLaporan)}</span>
              </div>

              {breakdownPemasukan.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada catatan penerimaan pada periode ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {breakdownPemasukan.map((item) => (
                    <div key={item.kategori} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{item.kategori}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.total)}</span>
                          <span className="text-[11px] text-slate-400">({item.persen.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(item.persen, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pengeluaran Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Rincian Pos Belanja & Pengeluaran (Kredit)
                  </h4>
                </div>
                <span className="text-xs font-bold text-rose-600">{formatCurrency(totalKeluarLaporan)}</span>
              </div>

              {breakdownPengeluaran.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada catatan pengeluaran pada periode ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {breakdownPengeluaran.map((item) => (
                    <div key={item.kategori} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{item.kategori}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.total)}</span>
                          <span className="text-[11px] text-slate-400">({item.persen.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(item.persen, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabel Realisasi Arus Kas Bulanan (12 Bulan) */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Matriks Arus Kas Bulanan (Januari - Desember {selectedTahunLaporan})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rekapitulasi penerimaan, pengeluaran, surplus/defisit, dan saldo berjalan per bulan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Bulan</th>
                    <th className="p-3 text-right">Pemasukan (Rp)</th>
                    <th className="p-3 text-right">Pengeluaran (Rp)</th>
                    <th className="p-3 text-right">Surplus / (Defisit)</th>
                    <th className="p-3 text-right">Saldo Kas Akhir</th>
                    <th className="p-3 text-center">Jml Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rekapBulananTahun.map((bln) => (
                    <tr key={bln.bulanNum} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{bln.namaBulan}</td>
                      <td className="p-3 text-right text-emerald-600 font-medium">{formatCurrency(bln.masuk)}</td>
                      <td className="p-3 text-right text-rose-600 font-medium">{formatCurrency(bln.keluar)}</td>
                      <td className={`p-3 text-right font-semibold ${bln.surplus >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                        {formatCurrency(bln.surplus)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(bln.saldoKumulatif)}
                      </td>
                      <td className="p-3 text-center text-slate-500">{bln.jumlahTx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lembar Berita Acara & Pengesahan */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lembar Verifikasi & Pengesahan Kas
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Laporan Keuangan ini telah dicocokkan dengan bukti kuitansi fisik, saldo tunai di bendahara, dan matriks rekapitulasi iuran anggota PKK RT.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-slate-500 text-[11px]">Diperiksa & Disusun:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">Bendahara TP PKK</p>
                <p className="text-emerald-600 font-semibold pt-6">{profil.namaBendahara || 'Bendahara'}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-slate-500 text-[11px]">Disetujui:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">Ketua TP PKK RT</p>
                <p className="text-emerald-600 font-semibold pt-6">{profil.namaKetua}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-slate-500 text-[11px]">Mengetahui:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">Ketua RW {profil.namaRW.replace(/[^0-9]/g, '') || '01'}</p>
                <p className="text-slate-500 font-semibold pt-6">( ................................... )</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Transaksi */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTransaksi ? 'Ubah Catatan Kas' : 'Catat Transaksi Buku Kas'}
        subtitle={`Buku Kas Umum TP PKK ${profil.namaRT}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Aliran Kas *
              </label>
              <select
                value={formData.jenis || 'Masuk'}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as JenisKas })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              >
                <option value="Masuk">Pemasukan / Penerimaan (Debit)</option>
                <option value="Keluar">Pengeluaran / Belanja (Kredit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Transaksi *
              </label>
              <select
                value={formData.kategori || 'Iuran Rutin Anggota'}
                onChange={(e) =>
                  setFormData({ ...formData, kategori: e.target.value as KategoriKas })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Iuran Rutin Anggota">Iuran Rutin Anggota</option>
                <option value="Dana Swadaya Warga">Dana Swadaya Warga</option>
                <option value="Bantuan RW / Kelurahan">Bantuan RW / Kelurahan</option>
                <option value="Hasil Usaha UP2K">Hasil Usaha UP2K</option>
                <option value="Konsumsi & Logistik Pertemuan">Konsumsi & Logistik Pertemuan</option>
                <option value="Operasional Posyandu & PMT">Operasional Posyandu & PMT</option>
                <option value="Pengadaan Bibit TOGA & Pupuk">Pengadaan Bibit TOGA & Pupuk</option>
                <option value="ATK & Administrasi Buku 6">ATK & Administrasi Buku 6</option>
                <option value="Perlengkapan & Kebersihan">Perlengkapan & Kebersihan</option>
                <option value="Sosial & Santunan Warga">Sosial & Santunan Warga</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Nominal (Rp) *
              </label>
              <input
                type="number"
                min={1000}
                required
                value={formData.jumlah ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Uraian / Keterangan Lengkap *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Penerimaan iuran 10 anggota / Pembelian bibit toga"
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Kuitansi / Bukti Kas
              </label>
              <input
                type="text"
                placeholder="Contoh: KW/2026/05/01"
                value={formData.noBukti || ''}
                onChange={(e) => setFormData({ ...formData, noBukti: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Penanggung Jawab / Bendahara
              </label>
              <input
                type="text"
                value={formData.penanggungJawab || ''}
                onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
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
              {editingTransaksi ? 'Simpan Perubahan' : 'Simpan Transaksi Kas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog Transaksi Kas */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteTransaksi(deletingId);
        }}
        title="Hapus Transaksi Kas"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini dari Buku Kas Umum PKK?"
        confirmLabel="Hapus Transaksi"
      />

      {/* Delete Dialog Peserta Iuran */}
      <ConfirmDialog
        isOpen={!!deletingIuranAnggotaId}
        onClose={() => setDeletingIuranAnggotaId(null)}
        onConfirm={() => {
          if (deletingIuranAnggotaId) {
            deletePesertaIuran(deletingIuranAnggotaId);
            setDeletingIuranAnggotaId(null);
            showTemporaryIuranNotice('Data anggota telah dihapus dari daftar matriks iuran.');
          }
        }}
        title="Hapus Anggota dari Daftar Iuran"
        message="Apakah Anda yakin ingin menghapus data iuran anggota ini dari tabel rekapitulasi iuran?"
        confirmLabel="Hapus Data Iuran"
      />

      {/* MODAL 1: INPUT PEMBAYARAN IURAN PER ANGGOTA */}
      <Modal
        isOpen={isInputIuranModalOpen}
        onClose={() => setIsInputIuranModalOpen(false)}
        title="Input Pembayaran Iuran Per Anggota"
        subtitle={`Pencatatan Setoran Iuran Rutin Anggota TP PKK ${profil.namaRT}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitInputIuran} className="space-y-4">
          {/* Mode Pemilih Anggota: Pilih Terdaftar vs Input Anggota Baru */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setIuranInputMode('existing')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                iuranInputMode === 'existing'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pilih Anggota Terdaftar ({iuranList.length})
            </button>
            <button
              type="button"
              onClick={() => setIuranInputMode('new')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                iuranInputMode === 'new'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              + Input Anggota Baru & Bayar
            </button>
          </div>

          {iuranInputMode === 'existing' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Nama Anggota *
              </label>
              {iuranList.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Belum ada anggota terdaftar di daftar iuran.</span>
                  <button
                    type="button"
                    onClick={() => setIuranInputMode('new')}
                    className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Input Anggota Baru
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={selectedAnggotaIdIuran}
                  onChange={(e) => setSelectedAnggotaIdIuran(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                >
                  {iuranList.map((rec) => {
                    const paidCount = (Object.values(rec.bulan || {}) as IuranBulanStatus[]).filter((b) => b?.lunas).length;
                    return (
                      <option key={rec.anggotaId} value={rec.anggotaId}>
                        {rec.namaAnggota} — {rec.jabatan} ({paidCount}/12 Bulan Lunas)
                      </option>
                    );
                  })}
                </select>
              )}
              {(() => {
                const sel = iuranList.find((r) => r.anggotaId === selectedAnggotaIdIuran);
                if (!sel) return null;
                return (
                  <div className="mt-2.5 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Ibu {sel.namaAnggota}</span>
                        {sel.dasawisma && (
                          <span className="text-[10px] font-normal text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                            {sel.dasawisma}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>No. WhatsApp:</span>
                        {sel.noHp && sel.noHp !== '-' ? (
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {sel.noHp}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Belum ada (bisa diisi saat kwitansi muncul)</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Kwitansi WA Siap
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Anggota Baru *
                  </label>
                  <input
                    type="text"
                    required={iuranInputMode === 'new'}
                    placeholder="Contoh: Ny. Siti Aminah"
                    value={newMemberIuranName}
                    onChange={(e) => setNewMemberIuranName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Status Anggota
                  </label>
                  <select
                    value={newMemberIuranJabatan}
                    onChange={(e) => setNewMemberIuranJabatan(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Anggota Pokja">Anggota Pokja</option>
                    <option value="Kader Dasawisma">Kader Dasawisma</option>
                    <option value="Warga / Dasawisma">Warga / Peserta Dasawisma</option>
                    <option value="Ketua Pokja I">Ketua Pokja I</option>
                    <option value="Ketua Pokja II">Ketua Pokja II</option>
                    <option value="Ketua Pokja III">Ketua Pokja III</option>
                    <option value="Ketua Pokja IV">Ketua Pokja IV</option>
                    <option value="Ketua">Ketua</option>
                    <option value="Sekretaris">Sekretaris</option>
                    <option value="Bendahara">Bendahara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelompok Dasawisma
                  </label>
                  <select
                    value={newMemberIuranDasawisma}
                    onChange={(e) => setNewMemberIuranDasawisma(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                    <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                    <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp / HP (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={newMemberIuranNoHp}
                    onChange={(e) => setNewMemberIuranNoHp(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pilih Bulan Iuran yang Dibayar */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Bulan Iuran yang Dibayar ({selectedBulanIuran.length} Bulan Dipilih) *
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedBulanIuran([new Date().getMonth() + 1])}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 dark:text-slate-300 rounded-md font-semibold cursor-pointer"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBulanIuran([1, 2, 3, 4, 5, 6])}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 dark:text-slate-300 rounded-md font-semibold cursor-pointer"
                >
                  Semester 1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBulanIuran([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                  className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md font-bold cursor-pointer"
                >
                  Setahun Penuh (12 Bln)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {bulanFullNames.map((bFull, mIdx) => {
                const mNum = mIdx + 1;
                const isSelected = selectedBulanIuran.includes(mNum);
                const activeMemberRec =
                  iuranInputMode === 'existing'
                    ? iuranList.find((r) => r.anggotaId === selectedAnggotaIdIuran)
                    : null;
                const alreadyPaid = activeMemberRec?.bulan?.[mNum]?.lunas;

                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => handleToggleMonthSelect(mNum)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : alreadyPaid
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{bFull.slice(0, 3)}</span>
                    <span className="text-[10px] opacity-85 mt-0.5">
                      {isSelected ? 'Dipilih ✓' : alreadyPaid ? 'Sudah Lunas' : 'Belum'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nominal, Tanggal & Metode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nominal per Bulan (Rp) *
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                required
                value={nominalIuranInput}
                onChange={(e) => setNominalIuranInput(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                value={tanggalBayarIuran}
                onChange={(e) => setTanggalBayarIuran(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={metodeBayarIuran}
                onChange={(e) => setMetodeBayarIuran(e.target.value as 'Tunai' | 'Transfer')}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Tunai">Tunai di Bendahara / Pertemuan</option>
                <option value="Transfer">Transfer Rekening / QRIS Kas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan / Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembayaran lunas saat pertemuan rutin RT"
              value={catatanIuran}
              onChange={(e) => setCatatanIuran(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Ringkasan Kalkulasi & Checkbox Buku Kas */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Total Nominal Pembayaran ({selectedBulanIuran.length} Bulan × {formatCurrency(nominalIuranInput)}):
              </span>
              <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(selectedBulanIuran.length * nominalIuranInput)}
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 cursor-pointer pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <input
                type="checkbox"
                checked={autoCatatKeKas}
                onChange={(e) => setAutoCatatKeKas(e.target.checked)}
                className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Otomatis catat pemasukan ini ke <strong>Buku Kas Umum (Buku III)</strong>
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsInputIuranModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={selectedBulanIuran.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simpan Pembayaran Iuran
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DETAIL & EDIT KARTU IURAN 12 BULAN PER ANGGOTA */}
      <Modal
        isOpen={!!editingMemberIuran && !!memberEditForm}
        onClose={() => {
          setEditingMemberIuran(null);
          setMemberEditForm(null);
        }}
        title={`Kartu Iuran Tahunan: ${editingMemberIuran?.namaAnggota || ''}`}
        subtitle="Kelola profil peserta dan rincian pembayaran iuran per bulan (Januari - Desember)"
        maxWidth="xl"
      >
        {memberEditForm && (
          <form onSubmit={handleSaveMemberIuranDetail} className="space-y-4">
            {/* Identitas Anggota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap Anggota
                </label>
                <input
                  type="text"
                  required
                  value={memberEditForm.namaAnggota}
                  onChange={(e) =>
                    setMemberEditForm({ ...memberEditForm, namaAnggota: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={memberEditForm.jabatan}
                  onChange={(e) =>
                    setMemberEditForm({ ...memberEditForm, jabatan: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kelompok Dasawisma
                </label>
                <select
                  value={memberEditForm.dasawisma}
                  onChange={(e) =>
                    setMemberEditForm({ ...memberEditForm, dasawisma: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                  <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                  <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>No. WhatsApp Ibu</span>
                  <Phone className="w-3 h-3 text-emerald-600" />
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={memberEditForm.noHp}
                  onChange={(e) =>
                    setMemberEditForm({ ...memberEditForm, noHp: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* Quick Actions 12 Bulan */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rincian Input Status & Nominal Iuran 12 Bulan:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allPaid: { [k: number]: IuranBulanStatus } = {};
                    const today = new Date().toISOString().split('T')[0];
                    for (let m = 1; m <= 12; m++) {
                      allPaid[m] = {
                        ...memberEditForm.bulan[m],
                        lunas: true,
                        nominal: memberEditForm.bulan[m]?.nominal || profil.iuranBulananNominal || 10000,
                        tanggalBayar: memberEditForm.bulan[m]?.tanggalBayar || today,
                      };
                    }
                    setMemberEditForm({ ...memberEditForm, bulan: allPaid });
                  }}
                  className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-emerald-200"
                >
                  ✓ Tandai Lunas 12 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allUnpaid: { [k: number]: IuranBulanStatus } = {};
                    for (let m = 1; m <= 12; m++) {
                      allUnpaid[m] = {
                        ...memberEditForm.bulan[m],
                        lunas: false,
                      };
                    }
                    setMemberEditForm({ ...memberEditForm, bulan: allUnpaid });
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-rose-100 hover:text-rose-700"
                >
                  Reset Status
                </button>
              </div>
            </div>

            {/* Tabel 12 Bulan */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Bulan</th>
                    <th className="px-3 py-2 text-center">Status Bayar</th>
                    <th className="px-3 py-2">Nominal (Rp)</th>
                    <th className="px-3 py-2">Tanggal Bayar</th>
                    <th className="px-3 py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bulanFullNames.map((bName, mIdx) => {
                    const mNum = mIdx + 1;
                    const item = memberEditForm.bulan[mNum] || {
                      lunas: false,
                      nominal: profil.iuranBulananNominal || 10000,
                    };
                    return (
                      <tr key={mNum} className={item.lunas ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''}>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                          {mNum}. {bName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setMemberEditForm({
                                ...memberEditForm,
                                bulan: {
                                  ...memberEditForm.bulan,
                                  [mNum]: {
                                    ...item,
                                    lunas: !item.lunas,
                                    tanggalBayar: !item.lunas
                                      ? item.tanggalBayar || new Date().toISOString().split('T')[0]
                                      : item.tanggalBayar,
                                  },
                                },
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                              item.lunas
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.lunas ? '✓ Lunas' : 'Belum Bayar'}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={item.nominal}
                            onChange={(e) =>
                              setMemberEditForm({
                                ...memberEditForm,
                                bulan: {
                                  ...memberEditForm.bulan,
                                  [mNum]: {
                                    ...item,
                                    nominal: parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-28 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={item.tanggalBayar || ''}
                            onChange={(e) =>
                              setMemberEditForm({
                                ...memberEditForm,
                                bulan: {
                                  ...memberEditForm.bulan,
                                  [mNum]: {
                                    ...item,
                                    tanggalBayar: e.target.value,
                                  },
                                },
                              })
                            }
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Ket..."
                            value={item.catatan || ''}
                            onChange={(e) =>
                              setMemberEditForm({
                                ...memberEditForm,
                                bulan: {
                                  ...memberEditForm.bulan,
                                  [mNum]: {
                                    ...item,
                                    catatan: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Total Bulan Lunas:{' '}
                <strong>
                  {(Object.values(memberEditForm.bulan) as IuranBulanStatus[]).filter((b) => b.lunas).length} / 12 Bulan
                </strong>
              </span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                Total Terbayar:{' '}
                {formatCurrency(
                  (Object.values(memberEditForm.bulan) as IuranBulanStatus[])
                    .filter((b) => b.lunas)
                    .reduce((acc: number, b: IuranBulanStatus) => acc + (b.nominal || 0), 0)
                )}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (editingMemberIuran) {
                    handleOpenKwitansi(editingMemberIuran);
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Kirim Kwitansi ke WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMemberIuran(null);
                    setMemberEditForm(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Kartu Iuran Anggota
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: TAMBAH PESERTA / ANGGOTA WAJIB IURAN BARU */}
      <Modal
        isOpen={isAddPesertaModalOpen}
        onClose={() => setIsAddPesertaModalOpen(false)}
        title="Tambah Anggota ke Daftar Wajib Iuran"
        subtitle={`Tambahkan anggota/warga baru ke Matriks Iuran TP PKK ${profil.namaRT}`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitAddPeserta} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Anggota *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ny. Ratna Sari"
              value={addPesertaForm.namaAnggota}
              onChange={(e) => setAddPesertaForm({ ...addPesertaForm, namaAnggota: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan / Status
              </label>
              <select
                value={addPesertaForm.jabatan}
                onChange={(e) => setAddPesertaForm({ ...addPesertaForm, jabatan: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Anggota Pokja">Anggota Pokja</option>
                <option value="Kader Dasawisma">Kader Dasawisma</option>
                <option value="Warga / Dasawisma">Warga / Peserta Dasawisma</option>
                <option value="Ketua Pokja I">Ketua Pokja I</option>
                <option value="Ketua Pokja II">Ketua Pokja II</option>
                <option value="Ketua Pokja III">Ketua Pokja III</option>
                <option value="Ketua Pokja IV">Ketua Pokja IV</option>
                <option value="Ketua">Ketua</option>
                <option value="Sekretaris">Sekretaris</option>
                <option value="Bendahara">Bendahara</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelompok Dasawisma
              </label>
              <select
                value={addPesertaForm.dasawisma}
                onChange={(e) => setAddPesertaForm({ ...addPesertaForm, dasawisma: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nomor HP / WhatsApp (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: 081234567890"
              value={addPesertaForm.noHp}
              onChange={(e) => setAddPesertaForm({ ...addPesertaForm, noHp: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddPesertaModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs cursor-pointer"
            >
              Tambahkan Anggota
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: BUKTI KWITANSI PEMBAYARAN IURAN & KIRIM WHATSAPP */}
      <KwitansiIuranModal
        isOpen={isKwitansiModalOpen}
        onClose={() => setIsKwitansiModalOpen(false)}
        profil={profil}
        initialData={kwitansiData}
        onSavePhone={(anggotaId, newPhone) => {
          updatePesertaIuran(anggotaId, { noHp: newPhone });
        }}
      />
    </div>
  );
};
