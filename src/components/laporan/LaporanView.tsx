import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  FileCheck,
  Download,
  Printer,
  Sparkles,
  Layers,
  BookOpen,
  Users,
  Home,
  Sprout,
  Wallet,
  CalendarDays,
  CheckCircle2,
  Filter,
  Eye,
  Building,
  ShieldCheck,
  Clock,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import {
  exportLaporanLengkapPDF,
  exportLaporanLengkapExcel,
  exportLaporanLengkapWord,
  exportBukuWajibPDF,
  exportLaporanKeuanganPDF,
  exportLaporanKeuanganExcel,
  exportLaporanKeuanganWord,
} from '../../utils/reportExporter';
import { printLaporanLengkap, printLaporanKeuangan } from '../../utils/printHelper';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';

type TabLaporan = 'lengkap' | 'buku6' | 'tematik' | 'custom';

export const LaporanView: React.FC = () => {
  const {
    profil,
    anggotaList = [],
    keluargaList = [],
    kegiatanList = [],
    togaList = [],
    transaksiList = [],
    iuranList = [],
    totalJiwaDasawisma,
    totalBalita: ctxTotalBalita,
    totalIbuHamil: ctxTotalBumil,
    totalLansia: ctxTotalLansia,
  } = usePKK();

  const [activeTab, setActiveTab] = useState<TabLaporan>('lengkap');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [selectedPokja, setSelectedPokja] = useState<string>('Semua');
  const [selectedDasawisma, setSelectedDasawisma] = useState<string>('Semua');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewBuku, setPreviewBuku] = useState<number | null>(null);

  const totalJiwa = totalJiwaDasawisma;
  const totalBalita = ctxTotalBalita;
  const totalBumil = ctxTotalBumil;
  const totalLansia = ctxTotalLansia;
  const totalRumahSehat = (keluargaList || []).filter((k) => k?.statusRumahSehat).length;

  const totalMasuk = (transaksiList || []).filter((t) => t?.jenis === 'Masuk').reduce((a, b) => a + (b?.jumlah || 0), 0);
  const totalKeluar = (transaksiList || []).filter((t) => t?.jenis === 'Keluar').reduce((a, b) => a + (b?.jumlah || 0), 0);
  const saldoKas = totalMasuk - totalKeluar;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Handler Laporan Lengkap
  const handleExportLengkap = async (format: 'pdf' | 'excel' | 'word') => {
    setIsExporting(`lengkap-${format}`);
    try {
      if (format === 'pdf') {
        exportLaporanLengkapPDF(
          profil,
          anggotaList,
          keluargaList,
          kegiatanList,
          togaList,
          transaksiList,
          iuranList,
          { tahun: selectedTahun }
        );
      } else if (format === 'excel') {
        exportLaporanLengkapExcel(
          profil,
          anggotaList,
          keluargaList,
          kegiatanList,
          togaList,
          transaksiList,
          iuranList
        );
      } else if (format === 'word') {
        await exportLaporanLengkapWord(
          profil,
          anggotaList,
          keluargaList,
          kegiatanList,
          togaList,
          transaksiList,
          iuranList
        );
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

  // Handler Export Buku Wajib
  const handleExportBuku = async (bukuIdx: number, title: string, format: 'pdf' | 'excel' | 'word') => {
    setIsExporting(`buku-${bukuIdx}-${format}`);
    try {
      if (format === 'pdf') {
        exportBukuWajibPDF(
          bukuIdx,
          title,
          profil,
          anggotaList,
          keluargaList,
          kegiatanList,
          togaList,
          transaksiList,
          iuranList
        );
      } else if (format === 'excel') {
        exportSingleBukuExcel(bukuIdx, title);
      } else if (format === 'word') {
        await exportSingleBukuWord(bukuIdx, title);
      }
    } catch (err) {
      console.error('Export Buku error:', err);
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

  // Export Excel Single Buku
  const exportSingleBukuExcel = (bukuIdx: number, title: string) => {
    const wb = XLSX.utils.book_new();
    let sheetData: any[] = [];

    if (bukuIdx === 1) {
      sheetData = (anggotaList || []).map((a, i) => ({
        No: i + 1,
        'Nama Lengkap': a.nama,
        NIK: a.nik,
        Jabatan: a.jabatan,
        Pokja: a.pokja,
        'No WhatsApp': a.noHp,
        Alamat: `${a.alamat} (${a.rt}/${a.rw})`,
        Status: a.status,
      }));
    } else if (bukuIdx === 2) {
      sheetData = (kegiatanList || []).map((k, i) => ({
        No: i + 1,
        'Agenda / Nama Kegiatan': k.namaKegiatan,
        Tanggal: k.tanggal,
        'Waktu & Tempat': `${k.waktuMulai || '-'} @ ${k.lokasi}`,
        'Penanggung Jawab': k.penanggungJawab,
        'Notulensi / Keputusan': k.notulensi || k.deskripsi,
      }));
    } else if (bukuIdx === 3) {
      sheetData = (transaksiList || []).map((t, i) => ({
        No: i + 1,
        Tanggal: t.tanggal,
        'No Bukti': t.noBukti || '-',
        Jenis: t.jenis,
        Kategori: t.kategori,
        'Nominal (Rp)': t.jumlah,
        Keterangan: t.keterangan,
        'Penanggung Jawab': t.penanggungJawab,
      }));
    } else if (bukuIdx === 4) {
      sheetData = (togaList || []).map((t, i) => ({
        No: i + 1,
        'Nama Tanaman': t.namaTanaman,
        'Nama Latin': t.namaLatin || '-',
        Kategori: t.kategori,
        'Jumlah Pot': t.jumlahPolybag,
        Lokasi: t.lokasiDasawisma,
        'Status Panen': t.statusPanen,
        Khasiat: t.khasiat,
      }));
    } else if (bukuIdx === 5) {
      sheetData = (kegiatanList || []).map((k, i) => ({
        No: i + 1,
        'Nama Kegiatan': k.namaKegiatan,
        Tanggal: k.tanggal,
        Pokja: k.pokjaPengampu,
        'Target Peserta': k.targetPeserta,
        'Peserta Hadir': k.pesertaHadir,
        'Realisasi Anggaran (Rp)': k.anggaranRealisasi,
        Hasil: k.deskripsi,
      }));
    } else if (bukuIdx === 6) {
      sheetData = (keluargaList || []).map((k, i) => ({
        No: i + 1,
        'No KK': k.noKk,
        'Kepala Keluarga': k.namaKepalaKeluarga,
        'Nama Ibu': k.namaIbu,
        Dasawisma: k.dasawisma,
        'Jml Jiwa': k.jumlahAnggotaKeluarga,
        Balita: k.jumlahBalita,
        Bumil: k.jumlahIbuHamil,
        Lansia: k.jumlahLansia,
        'Rumah Sehat': k.statusRumahSehat ? 'Ya' : 'Tidak',
        Jamban: k.memilikiJambanSehat ? 'Ya' : 'Tidak',
        SPAL: k.memilikiSPAL ? 'Ya' : 'Tidak',
        Kategori: k.kategoriSejahtera,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, `Buku ${bukuIdx}`);
    XLSX.writeFile(wb, `Buku_${bukuIdx}_${title.replace(/\s+/g, '_')}_PKK_${profil.namaRT}.xlsx`);
  };

  // Export Word Single Buku
  const exportSingleBukuWord = async (bukuIdx: number, title: string) => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}\n`,
                  bold: true,
                  size: 24,
                  color: '047857',
                }),
                new TextRun({
                  text: `BUKU ${bukuIdx}: ${title.toUpperCase()}\n`,
                  bold: true,
                  size: 20,
                  color: '0F172A',
                }),
                new TextRun({
                  text: `Kelurahan ${profil.namaKelurahan}, Kecamatan ${profil.namaKecamatan}, ${profil.namaKota}\n\n`,
                  size: 16,
                  color: '64748B',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Laporan resmi Buku ${bukuIdx} Administrasi PKK RT untuk periode kepengurusan ${profil.tahunKepengurusan}.\n`,
                  size: 16,
                  italics: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Buku_${bukuIdx}_${title.replace(/\s+/g, '_')}_PKK_${profil.namaRT}.docx`);
  };

  const daftarBuku6 = [
    {
      id: 1,
      nama: 'Buku Daftar Anggota TP PKK & Kader',
      deskripsi: 'Data identitas pengurus inti, pokja, kader posyandu, dan kader dasawisma beserta status keaktifan.',
      icon: Users,
      count: `${anggotaList.length} Anggota`,
      color: 'emerald',
    },
    {
      id: 2,
      nama: 'Buku Agenda Surat Masuk / Keluar & Notulen',
      deskripsi: 'Catatan risalah rapat, kesepakatan pertemuan bulanan, dan pengarsipan surat dinas PKK.',
      icon: FileText,
      count: `${kegiatanList.length} Notula / Agenda`,
      color: 'blue',
    },
    {
      id: 3,
      nama: 'Buku Keuangan & Kas Umum',
      deskripsi: 'Buku kas umum penerimaan iuran warga, bantuan kelurahan, dan alokasi belanja operasional.',
      icon: Wallet,
      count: `${(transaksiList || []).length} Transaksi`,
      color: 'amber',
    },
    {
      id: 4,
      nama: 'Buku Inventaris, Sarana & TOGA',
      deskripsi: 'Daftar inventaris sarana prasarana serta sensus tanaman HATINYA PKK dan kebun toga RT.',
      icon: Sprout,
      count: `${togaList.length} Tanaman TOGA`,
      color: 'emerald',
    },
    {
      id: 5,
      nama: 'Buku Kegiatan & Program Kerja',
      deskripsi: 'Catatan seluruh program pembinaan, pelatihan keterampilan, dan sosialisasi Pokja I - IV.',
      icon: CalendarDays,
      count: `${kegiatanList.length} Kegiatan`,
      color: 'purple',
    },
    {
      id: 6,
      nama: 'Buku Catatan Dasawisma & Kependudukan',
      deskripsi: 'Rekapitulasi data keluarga, ibu hamil, balita, lansia, sanitasi rumah, dan status kemiskinan.',
      icon: Home,
      count: `${keluargaList.length} Data KK`,
      color: 'teal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Pusat Pelaporan Resmi PKK RT & Kelurahan
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Laporan PKK Lengkap (PDF, Excel & Word)
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Generate dan unduh seluruh berkas administrasi 6 Buku Wajib PKK, rekapitulasi keluarga dasawisma, rekapitulasi kas iuran, sensus TOGA, serta notulensi kegiatan dalam format dokumen resmi.
            </p>
          </div>

          {/* Quick Export Master Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Ekspor Laporan Lengkap:
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-export-master-pdf"
                onClick={() => handleExportLengkap('pdf')}
                disabled={isExporting !== null}
                className="flex-1 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isExporting === 'lengkap-pdf' ? 'Memproses...' : 'Unduh PDF'}
              </button>

              <button
                id="btn-export-master-excel"
                onClick={() => handleExportLengkap('excel')}
                disabled={isExporting !== null}
                className="flex-1 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isExporting === 'lengkap-excel' ? 'Memproses...' : 'Unduh Excel'}
              </button>

              <button
                id="btn-export-master-word"
                onClick={() => handleExportLengkap('word')}
                disabled={isExporting !== null}
                className="flex-1 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {isExporting === 'lengkap-word' ? 'Memproses...' : 'Unduh Word'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Metrics Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Users className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-emerald-200/70 text-[11px]">Anggota & Kader</p>
              <p className="font-bold text-sm text-white">{anggotaList.length} Orang</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Home className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <p className="text-emerald-200/70 text-[11px]">Keluarga Dasawisma</p>
              <p className="font-bold text-sm text-white">{keluargaList.length} KK ({totalJiwa} Jiwa)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Wallet className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-emerald-200/70 text-[11px]">Saldo Kas Kas</p>
              <p className="font-bold text-sm text-white">{formatRupiah(saldoKas)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sprout className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <p className="text-emerald-200/70 text-[11px]">HATINYA PKK / TOGA</p>
              <p className="font-bold text-sm text-white">{togaList.length} Spesies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          id="tab-lengkap"
          onClick={() => setActiveTab('lengkap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'lengkap'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Laporan Rekapitulasi Lengkap
        </button>

        <button
          id="tab-buku6"
          onClick={() => setActiveTab('buku6')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'buku6'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          6 Buku Wajib PKK (Buku I - VI)
        </button>

        <button
          id="tab-tematik"
          onClick={() => setActiveTab('tematik')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tematik'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Laporan Sektoral Pokja & Dasawisma
        </button>

        <button
          id="tab-custom"
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'custom'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter & Kustomisasi Cetak
        </button>
      </div>

      {/* TAB CONTENT: Laporan Lengkap */}
      {activeTab === 'lengkap' && (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Laporan Tahunan Terintegrasi TP PKK {profil.namaRT} / {profil.namaRW}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Berisi rangkuman lengkap Bab I s/d Bab VI siap diserahkan ke TP PKK Kelurahan / Kecamatan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-print-preview"
                  onClick={() =>
                    printLaporanLengkap(profil, {
                      anggotaList,
                      keluargaList,
                      transaksiList,
                      kegiatanList,
                      togaList,
                    })
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Lengkap</span>
                </button>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  Format Dokumen PDF
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tata letak formal dilengkapi Kop Surat resmi, logo PKK, nomor surat, garis pembatas, penomoran halaman otomatis, dan kolom tanda tangan Ketua serta Sekretaris.
                </p>
                <button
                  id="btn-detail-dl-pdf"
                  onClick={() => handleExportLengkap('pdf')}
                  disabled={isExporting !== null}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Format PDF
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                  Format Dokumen Excel (.xlsx)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Buku kerja multi-sheet (Sheet Ringkasan, Sheet Anggota, Sheet Dasawisma, Sheet Kas, Sheet Kegiatan, Sheet TOGA) dengan rumus dan format data tabel terstruktur.
                </p>
                <button
                  id="btn-detail-dl-excel"
                  onClick={() => handleExportLengkap('excel')}
                  disabled={isExporting !== null}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Format Excel
                </button>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <FileCheck className="w-4 h-4" />
                  Format Dokumen Word (.docx)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Format berkas Microsoft Word yang dapat diedit langsung, siap untuk ditambahkan lampiran foto kegiatan atau narasi laporan pertanggungjawaban tahunan.
                </p>
                <button
                  id="btn-detail-dl-word"
                  onClick={() => handleExportLengkap('word')}
                  disabled={isExporting !== null}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Format Word
                </button>
              </div>
            </div>
          </div>

          {/* Live Table Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Pratinjau Ringkasan Matriks Laporan Terkini
                </h4>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Kondisi Data: Aktif & Tersinkronisasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold border-b border-emerald-200 dark:border-emerald-800">
                    <th className="p-3">Kategori Pokja / Indikator</th>
                    <th className="p-3">Total Data</th>
                    <th className="p-3">Capaian & Status</th>
                    <th className="p-3">Buku Administrasi Terkait</th>
                    <th className="p-3 text-right">Kelengkapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Sekretariat & Kader Inti
                    </td>
                    <td className="p-3">{anggotaList.length} Orang</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {anggotaList.filter((a) => a.status === 'Aktif').length} Kader Aktif
                    </td>
                    <td className="p-3 text-slate-500">Buku 1 (Daftar Anggota)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Pokja I (Gotong Royong & Lansia)
                    </td>
                    <td className="p-3">{totalLansia} Lansia</td>
                    <td className="p-3">Pembinaan Lansia & Pengajian Rutin</td>
                    <td className="p-3 text-slate-500">Buku 5 & Buku 6</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Pokja II (Pendidikan & UP2K)
                    </td>
                    <td className="p-3">Iuran & Usaha</td>
                    <td className="p-3">Pelatihan Pembuatan Jamu & Snack</td>
                    <td className="p-3 text-slate-500">Buku 3 & Buku 5</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Pokja III (HATINYA PKK & TOGA)
                    </td>
                    <td className="p-3">{togaList.length} Tanaman</td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      {togaList.filter((t) => t.statusPanen === 'Siap Panen').length} Siap Panen
                    </td>
                    <td className="p-3 text-slate-500">Buku 4 (Inventaris & Aset)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Pokja IV (Kesehatan & Posyandu)
                    </td>
                    <td className="p-3">{totalBalita} Balita / {totalBumil} Bumil</td>
                    <td className="p-3">{totalRumahSehat} Rumah Sehat ({Math.round((totalRumahSehat / (keluargaList.length || 1)) * 100)}%)</td>
                    <td className="p-3 text-slate-500">Buku 6 (Dasawisma)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      Bendahara (Kas & Iuran)
                    </td>
                    <td className="p-3">{(transaksiList || []).length} Transaksi</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      Saldo {formatRupiah(saldoKas)}
                    </td>
                    <td className="p-3 text-slate-500">Buku 3 (Buku Kas Umum)</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-md">
                        100%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6 Buku Wajib */}
      {activeTab === 'buku6' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Format Standar 6 Buku Wajib TP PKK:</strong> Mengacu pada Keputusan Ketua Umum TP PKK Pusat & Pedoman Pembinaan Administrasi PKK.
              </span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] shrink-0">
              6 / 6 Buku Lengkap
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daftarBuku6.map((buku) => {
              const Icon = buku.icon;
              return (
                <div
                  key={buku.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold rounded-lg">
                        BUKU {buku.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {buku.count}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div className="p-2.5 bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {buku.nama}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {buku.deskripsi}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions 3 format download */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                    <button
                      id={`btn-dl-buku-${buku.id}-pdf`}
                      onClick={() => handleExportBuku(buku.id, buku.nama, 'pdf')}
                      disabled={isExporting !== null}
                      className="py-1.5 px-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </button>

                    <button
                      id={`btn-dl-buku-${buku.id}-excel`}
                      onClick={() => handleExportBuku(buku.id, buku.nama, 'excel')}
                      disabled={isExporting !== null}
                      className="py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Excel
                    </button>

                    <button
                      id={`btn-dl-buku-${buku.id}-word`}
                      onClick={() => handleExportBuku(buku.id, buku.nama, 'word')}
                      disabled={isExporting !== null}
                      className="py-1.5 px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Word
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Tematik Sektoral */}
      {activeTab === 'tematik' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Laporan Kependudukan & Dasawisma */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Laporan Sensus Kependudukan & Dasawisma
                </h4>
                <p className="text-xs text-slate-500">
                  Matriks data keluarga, balita stunting, bumil risti, sanitasi rumah tangga.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportBuku(6, 'Catatan Dasawisma', 'pdf')}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Unduh PDF
              </button>
              <button
                onClick={() => handleExportBuku(6, 'Catatan Dasawisma', 'excel')}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Unduh Excel
              </button>
            </div>
          </div>

          {/* Card 2: Laporan HATINYA PKK & TOGA */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Laporan Program HATINYA PKK & TOGA
                </h4>
                <p className="text-xs text-slate-500">
                  Sensus tanaman obat, masa panen pekarangan, dan pemanfaatan herbal warga.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportBuku(4, 'Inventaris TOGA', 'pdf')}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Unduh PDF
              </button>
              <button
                onClick={() => handleExportBuku(4, 'Inventaris TOGA', 'excel')}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Unduh Excel
              </button>
            </div>
          </div>

          {/* Card 3: Laporan Kas & Iuran Warga */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Laporan Pertanggungjawaban (LPJ) Keuangan & Kas
                </h4>
                <p className="text-xs text-slate-500">
                  Ikhtisar arus kas, realisasi pos anggaran, Buku Kas Umum, dan neraca kas tunai bendahara.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => exportLaporanKeuanganPDF(profil, transaksiList, iuranList, { tahun: selectedTahun })}
                className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => exportLaporanKeuanganExcel(profil, transaksiList, iuranList, { tahun: selectedTahun })}
                className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => exportLaporanKeuanganWord(profil, transaksiList, iuranList, { tahun: selectedTahun })}
                className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" /> Word
              </button>
              <button
                onClick={() => printLaporanKeuangan(profil, transaksiList, iuranList, { tahun: selectedTahun })}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
            </div>
          </div>

          {/* Card 4: Laporan Kegiatan Pokja */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Laporan Evaluasi Program Pokja I - IV
                </h4>
                <p className="text-xs text-slate-500">
                  Realisasi peserta hadir, serapan anggaran, dan notula kesepakatan rapat.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportBuku(5, 'Kegiatan Pokja', 'pdf')}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Unduh PDF
              </button>
              <button
                onClick={() => handleExportBuku(5, 'Kegiatan Pokja', 'excel')}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Kustomisasi & Filter */}
      {activeTab === 'custom' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Filter Parameter Laporan Custom
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesuaikan periode tahun, kelompok pokja, dan dasawisma sesuai kebutuhan berkas pelaporan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tahun Anggaran / Periode
              </label>
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value={2026}>Tahun 2026 (Aktif)</option>
                <option value={2025}>Tahun 2025</option>
                <option value={2024}>Tahun 2024</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Filter Pengampu Pokja
              </label>
              <select
                value={selectedPokja}
                onChange={(e) => setSelectedPokja(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Semua">Semua Pokja (I, II, III, IV & Sekretariat)</option>
                <option value="Sekretariat">Sekretariat</option>
                <option value="Pokja I">Pokja I (Gotong Royong & Pola Asuh)</option>
                <option value="Pokja II">Pokja II (Pendidikan & UP2K)</option>
                <option value="Pokja III">Pokja III (Pangan, Sandang, HATINYA)</option>
                <option value="Pokja IV">Pokja IV (Kesehatan, Posyandu, Kelestarian)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Filter Kelompok Dasawisma
              </label>
              <select
                value={selectedDasawisma}
                onChange={(e) => setSelectedDasawisma(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="Semua">Semua Kelompok Dasawisma (Flamboyan 9 - 11)</option>
                <option value="Dasawisma Flamboyan 9">Dasawisma Flamboyan 9</option>
                <option value="Dasawisma Flamboyan 10">Dasawisma Flamboyan 10</option>
                <option value="Dasawisma Flamboyan 11">Dasawisma Flamboyan 11</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Sertakan Blok Tanda Tangan Resmi (Ketua: <strong>{profil.namaKetua}</strong> & Sekretaris: <strong>{profil.namaSekretaris}</strong>)
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-600">Otomatis Aktif</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleExportLengkap('pdf')}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" /> Download PDF Sesuai Filter
            </button>
            <button
              onClick={() => handleExportLengkap('excel')}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download Excel Sesuai Filter
            </button>
            <button
              onClick={() => handleExportLengkap('word')}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCheck className="w-4 h-4" /> Download Word Sesuai Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
