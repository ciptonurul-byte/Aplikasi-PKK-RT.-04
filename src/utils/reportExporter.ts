import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { saveAs } from 'file-saver';
import { cleanSuratBodyText, parseSuratBodyBlocks } from './cleanSurat';
import {
  ProfilPKKRT,
  AnggotaPKK,
  KeluargaDasawisma,
  KegiatanPKK,
  TanamanToga,
  TransaksiKas,
  RekapIuranAnggota,
} from '../types/pkk';
import { LOGO_PKK_BASE64 } from '../assets/logoPKK';

export interface ReportOptions {
  tahun?: number | string;
  pokjaFilter?: string;
  dasawismaFilter?: string;
  kategoriFilter?: string;
  includeSignatures?: boolean;
}

// Helper format currency
const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper format tanggal Indonesia
const formatTanggalIndo = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

// ==========================================
// 1. PDF EXPORT GENERATORS
// ==========================================

export const exportLaporanLengkapPDF = (
  profil: ProfilPKKRT,
  anggotaList: AnggotaPKK[],
  keluargaList: KeluargaDasawisma[],
  kegiatanList: KegiatanPKK[],
  togaList: TanamanToga[],
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[],
  options?: ReportOptions
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const tahun = options?.tahun || new Date().getFullYear();

  // Header Kop Surat PKK
  drawKopSuratPDF(doc, profil);

  let currentY = 48;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN TAHUNAN REKAPITULASI PROGRAM KERJA PKK', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Tahun Pelaksanaan: ${tahun} | Wilayah: ${profil.namaRT} / ${profil.namaRW}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Section 1: Ringkasan Eksekutif
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('I. REKAPITULASI UMUM KELEMBAGAAN & DATA WARGA', 14, currentY);
  currentY += 4;

  const totalJiwa = keluargaList.reduce((acc, k) => acc + k.jumlahAnggotaKeluarga, 0);
  const totalBalita = keluargaList.reduce((acc, k) => acc + k.jumlahBalita, 0);
  const totalBumil = keluargaList.reduce((acc, k) => acc + k.jumlahIbuHamil, 0);
  const totalLansia = keluargaList.reduce((acc, k) => acc + k.jumlahLansia, 0);
  const totalRumahSehat = keluargaList.filter((k) => k.statusRumahSehat).length;
  const totalJamban = keluargaList.filter((k) => k.memilikiJambanSehat).length;

  const totalMasuk = transaksiList.filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKeluar = transaksiList.filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoKas = totalMasuk - totalKeluar;

  autoTable(doc, {
    startY: currentY,
    head: [['Indikator Kunci', 'Jumlah / Capaian', 'Indikator Keuangan & Giat', 'Jumlah / Capaian']],
    body: [
      ['Jumlah Anggota PKK Aktif', `${anggotaList.filter(a => a.status === 'Aktif').length} Orang`, 'Total Pemasukan Kas', formatRupiah(totalMasuk)],
      ['Jumlah Kelompok Dasawisma', '3 Kelompok', 'Total Pengeluaran Kas', formatRupiah(totalKeluar)],
      ['Jumlah Kepala Keluarga (KK)', `${keluargaList.length} KK`, 'Saldo Akhir Kas PKK', formatRupiah(saldoKas)],
      ['Total Jiwa Terdata', `${totalJiwa} Jiwa`, 'Jumlah Kegiatan Terlaksana', `${kegiatanList.filter(k => k.status === 'Selesai').length} Kegiatan`],
      ['Jumlah Balita / Ibu Hamil', `${totalBalita} Balita / ${totalBumil} Bumil`, 'Koleksi Tanaman TOGA', `${togaList.length} Spesies (${togaList.reduce((a, t) => a + t.jumlahPolybag, 0)} Pot)`],
      ['Cakupan Rumah Sehat & Jamban', `${totalRumahSehat} Rumah (${Math.round((totalRumahSehat / (keluargaList.length || 1)) * 100)}%)`, 'Tingkat Partisipasi Rapat', '92% Rata-rata'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 2: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Data Pengurus & Anggota (Buku I)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('II. DAFTAR PENGURUS & KADER INTI TP PKK (BUKU I)', 14, currentY);
  currentY += 4;

  const anggotaRows = anggotaList.slice(0, 15).map((a, idx) => [
    idx + 1,
    a.nama,
    a.jabatan,
    a.pokja,
    a.noHp,
    a.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Lengkap', 'Jabatan', 'Pokja', 'No. WhatsApp', 'Status']],
    body: anggotaRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Add Page for Next Details
  doc.addPage();
  drawKopSuratPDF(doc, profil);
  currentY = 48;

  // Section 3: Rekapitulasi Dasawisma (Buku VI)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('III. REKAPITULASI KELOMPOK DASA WISMA (BUKU VI)', 14, currentY);
  currentY += 4;

  const dasawismaMap = ['Dasawisma Flamboyan 9', 'Dasawisma Flamboyan 10', 'Dasawisma Flamboyan 11'].map((dw, idx) => {
    const list = keluargaList.filter((k) => k.dasawisma === dw);
    const kkCount = list.length;
    const jiwa = list.reduce((a, b) => a + b.jumlahAnggotaKeluarga, 0);
    const balita = list.reduce((a, b) => a + b.jumlahBalita, 0);
    const bumil = list.reduce((a, b) => a + b.jumlahIbuHamil, 0);
    const lansia = list.reduce((a, b) => a + b.jumlahLansia, 0);
    const sehat = list.filter((b) => b.statusRumahSehat).length;
    return [idx + 1, dw, kkCount, jiwa, balita, bumil, lansia, sehat];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Kelompok Dasawisma', 'Jml KK', 'Jiwa', 'Balita', 'Bumil', 'Lansia', 'Rumah Sehat']],
    body: dasawismaMap,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2.5, halign: 'center' },
    columnStyles: { 1: { halign: 'left', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Realisasi Kegiatan Pokja (Buku V)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('IV. REKAPITULASI KEGIATAN & PROGRAM POKJA (BUKU V)', 14, currentY);
  currentY += 4;

  const giatRows = kegiatanList.slice(0, 10).map((k, idx) => [
    idx + 1,
    k.namaKegiatan,
    formatTanggalIndo(k.tanggal),
    k.pokjaPengampu,
    `${k.pesertaHadir} / ${k.targetPeserta}`,
    formatRupiah(k.anggaranRealisasi || k.anggaranRencana),
    k.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Kegiatan', 'Tanggal', 'Pokja', 'Kehadiran', 'Realisasi Biaya', 'Status']],
    body: giatRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Signatures
  drawSignaturesPDF(doc, profil, currentY);

  // Save PDF
  doc.save(`Laporan_Lengkap_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${tahun}.pdf`);
};

export const exportBukuWajibPDF = (
  bukuIndex: number, // 1 to 6
  bukuTitle: string,
  profil: ProfilPKKRT,
  anggotaList: AnggotaPKK[],
  keluargaList: KeluargaDasawisma[],
  kegiatanList: KegiatanPKK[],
  togaList: TanamanToga[],
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[]
) => {
  const isLandscape = bukuIndex === 3 || bukuIndex === 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawKopSuratPDF(doc, profil, isLandscape);

  let currentY = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`BUKU WAJIB ${bukuIndex} PKK: ${bukuTitle.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`TP PKK ${profil.namaRT} / ${profil.namaRW}, Kel. ${profil.namaKelurahan}, Kec. ${profil.namaKecamatan}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  if (bukuIndex === 1) {
    // Buku 1: Daftar Anggota TP PKK & Kader
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Anggota / Kader', 'NIK', 'Jabatan', 'Pokja', 'Alamat / RT', 'No. HP', 'Status']],
      body: anggotaList.map((a, i) => [
        i + 1,
        a.nama,
        a.nik,
        a.jabatan,
        a.pokja,
        `${a.alamat || '-'} (${a.rt}/${a.rw})`,
        a.noHp,
        a.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });
  } else if (bukuIndex === 2) {
    // Buku 2: Notulen Rapat & Agenda Surat
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Agenda Kegiatan / Rapat', 'Tanggal', 'Waktu & Tempat', 'Pemimpin / PJ', 'Ringkasan Notula']],
      body: kegiatanList.map((k, i) => [
        i + 1,
        k.namaKegiatan,
        formatTanggalIndo(k.tanggal),
        `${k.waktuMulai || '-'} @ ${k.lokasi}`,
        k.penanggungJawab || '-',
        k.notulensi || k.deskripsi || 'Rapat rutin koordinasi pengurus & warga',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2.5 },
    });
  } else if (bukuIndex === 3) {
    // Buku 3: Buku Keuangan Kas
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'No. Bukti', 'Uraian Transaksi Kas', 'Kategori', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'PJ']],
      body: transaksiList.map((t, i) => [
        i + 1,
        formatTanggalIndo(t.tanggal),
        t.noBukti || '-',
        t.keterangan,
        t.kategori,
        t.jenis === 'Masuk' ? formatRupiah(t.jumlah) : '-',
        t.jenis === 'Keluar' ? formatRupiah(t.jumlah) : '-',
        t.penanggungJawab || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });
  } else if (bukuIndex === 4) {
    // Buku 4: Inventaris & TOGA
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Tanaman / Aset', 'Nama Ilmiah (Latin)', 'Kategori', 'Jumlah Pot/Polybag', 'Lokasi Pekarangan', 'Status Panen', 'Khasiat']],
      body: togaList.map((t, i) => [
        i + 1,
        t.namaTanaman,
        t.namaLatin || '-',
        t.kategori,
        `${t.jumlahPolybag} Pot`,
        t.lokasiDasawisma,
        t.statusPanen,
        t.khasiat,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });
  } else if (bukuIndex === 5) {
    // Buku 5: Buku Kegiatan
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Program & Kegiatan', 'Tanggal', 'Pokja Pengampu', 'Target / Hadir', 'Anggaran Realisasi', 'Hasil / Catatan Kegiatan']],
      body: kegiatanList.map((k, i) => [
        i + 1,
        k.namaKegiatan,
        formatTanggalIndo(k.tanggal),
        k.pokjaPengampu,
        `${k.pesertaHadir} / ${k.targetPeserta} Orang`,
        formatRupiah(k.anggaranRealisasi || k.anggaranRencana),
        k.deskripsi || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });
  } else if (bukuIndex === 6) {
    // Buku 6: Catatan Dasawisma
    autoTable(doc, {
      startY: currentY,
      head: [['No', 'No. KK', 'Kepala Keluarga', 'Ibu Rumah Tangga', 'Dasawisma', 'Jml Jiwa', 'Balita', 'Bumil', 'Lansia', 'Rumah Sehat', 'Jamban', 'SPAL', 'Kategori']],
      body: keluargaList.map((k, i) => [
        i + 1,
        k.noKk,
        k.namaKepalaKeluarga,
        k.namaIbu,
        k.dasawisma,
        k.jumlahAnggotaKeluarga,
        k.jumlahBalita,
        k.jumlahIbuHamil,
        k.jumlahLansia,
        k.statusRumahSehat ? 'Ya' : 'Tdk',
        k.memilikiJambanSehat ? 'Ya' : 'Tdk',
        k.memilikiSPAL ? 'Ya' : 'Tdk',
        k.kategoriSejahtera,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87], textColor: 255, fontSize: 7 },
      styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' },
      columnStyles: { 1: { halign: 'left' }, 2: { halign: 'left' }, 3: { halign: 'left' }, 4: { halign: 'left' } },
    });
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  drawSignaturesPDF(doc, profil, finalY + 8, isLandscape);

  doc.save(`Buku_${bukuIndex}_PKK_${profil.namaRT.replace(/\s+/g, '_')}.pdf`);
};

// Helper: Kop Surat PDF
const drawKopSuratPDF = (doc: jsPDF, profil: ProfilPKKRT, isLandscape = false) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw Logo PKK in Kop Surat
  try {
    const logoSrc = profil.logoUrl || LOGO_PKK_BASE64;
    doc.addImage(logoSrc, 'JPEG', 14, 10, 20, 23);
  } catch (e) {
    // Fallback vector drawing if image format unsupported by jsPDF instance
    doc.setFillColor(2, 132, 199);
    doc.circle(24, 21, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('PKK', 24, 23.5, { align: 'center' });
  }

  // Kop Text
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)', pageWidth / 2 + 5, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}`, pageWidth / 2 + 5, 19, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`KELURAHAN ${profil.namaKelurahan.toUpperCase()}, KECAMATAN ${profil.namaKecamatan.toUpperCase()}`, pageWidth / 2 + 5, 24, { align: 'center' });
  doc.text(`${profil.namaKota.toUpperCase()} - PROVINSI ${profil.provinsi.toUpperCase()}`, pageWidth / 2 + 5, 28, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Sekretariat: ${profil.alamatSekretariat || `Balai Warga ${profil.namaRT}`}`, pageWidth / 2 + 5, 32, { align: 'center' });

  // Double Line Separator
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.8);
  doc.line(14, 35, pageWidth - 14, 35);
  doc.setLineWidth(0.3);
  doc.line(14, 36.2, pageWidth - 14, 36.2);
};

// Helper: Tanda Tangan PDF
const drawSignaturesPDF = (doc: jsPDF, profil: ProfilPKKRT, startY: number, isLandscape = false) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  let targetY = startY;
  if (targetY + 40 > pageHeight) {
    doc.addPage();
    targetY = 25;
  }

  const todayStr = formatTanggalIndo(new Date().toISOString());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  const leftX = isLandscape ? 40 : 35;
  const rightX = isLandscape ? pageWidth - 70 : pageWidth - 55;

  // Left Sign (Sekretaris)
  doc.text('Mengetahui / Menyetujui,', leftX, targetY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Sekretaris TP PKK RT', leftX, targetY + 5, { align: 'center' });

  // Right Sign (Ketua)
  doc.setFont('helvetica', 'normal');
  doc.text(`${profil.namaKota}, ${todayStr}`, rightX, targetY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Ketua TP PKK RT', rightX, targetY + 5, { align: 'center' });

  // Space for Signatures
  targetY += 25;

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profil.namaSekretaris} )`, leftX, targetY, { align: 'center' });
  doc.text(`( ${profil.namaKetua} )`, rightX, targetY, { align: 'center' });
};

// ==========================================
// 2. EXCEL (.XLSX) EXPORT GENERATORS
// ==========================================

export const exportLaporanLengkapExcel = (
  profil: ProfilPKKRT,
  anggotaList: AnggotaPKK[],
  keluargaList: KeluargaDasawisma[],
  kegiatanList: KegiatanPKK[],
  togaList: TanamanToga[],
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Profil & Rekapitulasi Umum
  const totalMasuk = transaksiList.filter((t) => t.jenis === 'Masuk').reduce((a, b) => a + b.jumlah, 0);
  const totalKeluar = transaksiList.filter((t) => t.jenis === 'Keluar').reduce((a, b) => a + b.jumlah, 0);

  const summaryData = [
    ['TIM PENGGERAK PKK', `${profil.namaRT} / ${profil.namaRW}`],
    ['Kelurahan / Kecamatan', `${profil.namaKelurahan} / ${profil.namaKecamatan}`],
    ['Kota / Provinsi', `${profil.namaKota} / ${profil.provinsi}`],
    ['Tanggal Generate Laporan', formatTanggalIndo(new Date().toISOString())],
    [],
    ['=== REKAPITULASI INDIKATOR KUNCI ===', ''],
    ['Jumlah Anggota PKK Aktif', anggotaList.filter((a) => a.status === 'Aktif').length],
    ['Jumlah Kepala Keluarga (KK)', keluargaList.length],
    ['Total Jiwa Terdata', keluargaList.reduce((a, b) => a + b.jumlahAnggotaKeluarga, 0)],
    ['Jumlah Balita', keluargaList.reduce((a, b) => a + b.jumlahBalita, 0)],
    ['Jumlah Ibu Hamil', keluargaList.reduce((a, b) => a + b.jumlahIbuHamil, 0)],
    ['Jumlah Lansia', keluargaList.reduce((a, b) => a + b.jumlahLansia, 0)],
    ['Rumah Sehat', keluargaList.filter((b) => b.statusRumahSehat).length],
    ['Keluarga Memiliki Jamban', keluargaList.filter((b) => b.memilikiJambanSehat).length],
    ['Koleksi Tanaman TOGA', `${togaList.length} Jenis (${togaList.reduce((a, b) => a + b.jumlahPolybag, 0)} Pot)`],
    ['Total Pemasukan Kas', totalMasuk],
    ['Total Pengeluaran Kas', totalKeluar],
    ['Saldo Kas Akhir', totalMasuk - totalKeluar],
    [],
    ['Ketua TP PKK RT', profil.namaKetua],
    ['Sekretaris', profil.namaSekretaris],
    ['Bendahara', profil.namaBendahara],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // Sheet 2: Data Anggota (Buku 1)
  const anggotaData = anggotaList.map((a, idx) => ({
    No: idx + 1,
    'Nama Anggota': a.nama,
    NIK: a.nik,
    Jabatan: a.jabatan,
    Pokja: a.pokja,
    'No WhatsApp': a.noHp,
    Status: a.status,
    Alamat: a.alamat,
    RT: a.rt,
    RW: a.rw,
    'Pendidikan Terakhir': a.pendidikanTerakhir || '-',
    Pekerjaan: a.pekerjaan || '-',
    'Tanggal Bergabung': a.tanggalBergabung,
  }));
  const wsAnggota = XLSX.utils.json_to_sheet(anggotaData);
  XLSX.utils.book_append_sheet(wb, wsAnggota, 'Buku 1 - Anggota');

  // Sheet 3: Dasawisma & Keluarga (Buku 6)
  const dasawismaData = keluargaList.map((k, idx) => ({
    No: idx + 1,
    'Nomor KK': k.noKk,
    'Kepala Keluarga': k.namaKepalaKeluarga,
    'Nama Ibu': k.namaIbu,
    Kelompok: k.dasawisma,
    Alamat: k.alamat,
    'Jumlah Jiwa': k.jumlahAnggotaKeluarga,
    Laki: k.jumlahLakiLaki,
    Perempuan: k.jumlahPerempuan,
    Balita: k.jumlahBalita,
    'Ibu Hamil': k.jumlahIbuHamil,
    Lansia: k.jumlahLansia,
    'Rumah Sehat': k.statusRumahSehat ? 'Ya' : 'Tidak',
    Jamban: k.memilikiJambanSehat ? 'Ya' : 'Tidak',
    SPAL: k.memilikiSPAL ? 'Ya' : 'Tidak',
    'Sumber Air Bersih': k.memilikiSumberAirBersih ? 'Ya' : 'Tidak',
    'Pekarangan TOGA': k.memilikiPekaranganToga ? 'Ya' : 'Tidak',
    'Kategori Sejahtera': k.kategoriSejahtera,
    'Catatan Kesehatan': k.catatanKesehatan || '-',
  }));
  const wsDasawisma = XLSX.utils.json_to_sheet(dasawismaData);
  XLSX.utils.book_append_sheet(wb, wsDasawisma, 'Buku 6 - Dasawisma');

  // Sheet 4: Kegiatan (Buku 5)
  const giatData = kegiatanList.map((k, idx) => ({
    No: idx + 1,
    'Nama Kegiatan': k.namaKegiatan,
    Tanggal: k.tanggal,
    'Waktu Mulai': k.waktuMulai,
    'Waktu Selesai': k.waktuSelesai,
    Lokasi: k.lokasi,
    'Pokja Pengampu': k.pokjaPengampu,
    Status: k.status,
    'Target Peserta': k.targetPeserta,
    'Peserta Hadir': k.pesertaHadir,
    'Anggaran Rencana (Rp)': k.anggaranRencana,
    'Anggaran Realisasi (Rp)': k.anggaranRealisasi,
    'Penanggung Jawab': k.penanggungJawab,
    'Uraian Notulensi': k.notulensi || k.deskripsi,
  }));
  const wsGiat = XLSX.utils.json_to_sheet(giatData);
  XLSX.utils.book_append_sheet(wb, wsGiat, 'Buku 5 - Kegiatan');

  // Sheet 5: Keuangan Kas (Buku 3)
  const kasData = transaksiList.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.tanggal,
    'No Bukti': t.noBukti || '-',
    Jenis: t.jenis,
    Kategori: t.kategori,
    'Nominal (Rp)': t.jumlah,
    Keterangan: t.keterangan,
    'Penanggung Jawab': t.penanggungJawab,
  }));
  const wsKas = XLSX.utils.json_to_sheet(kasData);
  XLSX.utils.book_append_sheet(wb, wsKas, 'Buku 3 - Kas Keuangan');

  // Sheet 6: TOGA (Buku 4)
  const togaData = togaList.map((t, idx) => ({
    No: idx + 1,
    'Nama Tanaman': t.namaTanaman,
    'Nama Latin': t.namaLatin || '-',
    Kategori: t.kategori,
    'Jumlah Pot / Polybag': t.jumlahPolybag,
    Lokasi: t.lokasiDasawisma,
    'Tanggal Tanam': t.tanggalTanam,
    'Status Panen': t.statusPanen,
    'Khasiat Herbal': t.khasiat,
    'Cara Pemanfaatan': t.caraPemanfaatan,
    'Penanggung Jawab': t.penanggungJawab,
  }));
  const wsToga = XLSX.utils.json_to_sheet(togaData);
  XLSX.utils.book_append_sheet(wb, wsToga, 'Buku 4 - TOGA');

  // Download Excel
  XLSX.writeFile(wb, `Laporan_Lengkap_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xlsx`);
};

// ==========================================
// 3. WORD (.DOCX) EXPORT GENERATORS
// ==========================================

export const exportLaporanLengkapWord = async (
  profil: ProfilPKKRT,
  anggotaList: AnggotaPKK[],
  keluargaList: KeluargaDasawisma[],
  kegiatanList: KegiatanPKK[],
  togaList: TanamanToga[],
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[]
) => {
  const totalJiwa = keluargaList.reduce((acc, k) => acc + k.jumlahAnggotaKeluarga, 0);
  const totalBalita = keluargaList.reduce((acc, k) => acc + k.jumlahBalita, 0);
  const totalBumil = keluargaList.reduce((acc, k) => acc + k.jumlahIbuHamil, 0);
  const totalLansia = keluargaList.reduce((acc, k) => acc + k.jumlahLansia, 0);
  const totalRumahSehat = keluargaList.filter((k) => k.statusRumahSehat).length;
  const totalMasuk = transaksiList.filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKeluar = transaksiList.filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoKas = totalMasuk - totalKeluar;
  const todayStr = formatTanggalIndo(new Date().toISOString());

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Laporan SIM PKK ${profil.namaRT} / ${profil.namaRW}`,
                    size: 16,
                    color: '666666',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                  }),
                  new TextRun({
                    text: ' dari ',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Kop Surat Word
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)\n',
                bold: true,
                size: 22,
                color: '047857',
              }),
              new TextRun({
                text: `TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}\n`,
                bold: true,
                size: 24,
                color: '0F172A',
              }),
              new TextRun({
                text: `Kelurahan ${profil.namaKelurahan}, Kecamatan ${profil.namaKecamatan}, ${profil.namaKota}\n`,
                size: 18,
                color: '475569',
              }),
              new TextRun({
                text: `Sekretariat: ${profil.alamatSekretariat || `Balai Pertemuan ${profil.namaRT}`}`,
                size: 16,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            text: '_________________________________________________________________________________',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Judul Laporan
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'LAPORAN TAHUNAN & REKAPITULASI PROGRAM PKK RT',
                bold: true,
                size: 24,
                color: '047857',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 250 },
            children: [
              new TextRun({
                text: `Periode Tahun: ${new Date().getFullYear()} | Tanggal Dicetak: ${todayStr}`,
                size: 18,
                color: '475569',
              }),
            ],
          }),

          // BAB 1: Ringkasan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'BAB I. RINGKASAN DATA UMUM & KELEMBAGAAN',
                bold: true,
                size: 20,
                color: '047857',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['Indikator Wilayah & Kelembagaan', 'Keterangan / Nilai'], true),
              createDocxTableRow(['Wilayah Rukun Tetangga (RT) & RW', `${profil.namaRT} / ${profil.namaRW}`]),
              createDocxTableRow(['Kelurahan / Kecamatan / Kota', `${profil.namaKelurahan}, ${profil.namaKecamatan}, ${profil.namaKota}`]),
              createDocxTableRow(['Jumlah Pengurus & Anggota PKK', `${anggotaList.length} Orang (${anggotaList.filter(a => a.status === 'Aktif').length} Aktif)`]),
              createDocxTableRow(['Jumlah Kelompok Dasawisma', '3 Kelompok Dasawisma']),
              createDocxTableRow(['Jumlah Kepala Keluarga (KK)', `${keluargaList.length} KK`]),
              createDocxTableRow(['Total Jiwa / Warga Terdata', `${totalJiwa} Jiwa`]),
              createDocxTableRow(['Populasi Rentan (Balita / Bumil / Lansia)', `${totalBalita} Balita | ${totalBumil} Bumil | ${totalLansia} Lansia`]),
              createDocxTableRow(['Cakupan Rumah Sehat & Jamban', `${totalRumahSehat} Rumah Sehat (${Math.round((totalRumahSehat / (keluargaList.length || 1)) * 100)}%)`]),
              createDocxTableRow(['Total Pemasukan Kas', formatRupiah(totalMasuk)]),
              createDocxTableRow(['Total Pengeluaran Kas', formatRupiah(totalKeluar)]),
              createDocxTableRow(['Saldo Kas Akhir', formatRupiah(saldoKas)]),
            ],
          }),

          // BAB 2: Daftar Pengurus
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'BAB II. STRUKTUR PENGURUS TP PKK RT (BUKU I)',
                bold: true,
                size: 20,
                color: '047857',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['No', 'Nama Lengkap', 'Jabatan', 'Pokja', 'No. WhatsApp', 'Status'], true),
              ...anggotaList.slice(0, 15).map((a, i) =>
                createDocxTableRow([
                  String(i + 1),
                  a.nama,
                  a.jabatan,
                  a.pokja,
                  a.noHp,
                  a.status,
                ])
              ),
            ],
          }),

          // BAB 3: Dasawisma
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'BAB III. REKAPITULASI KELOMPOK DASA WISMA (BUKU VI)',
                bold: true,
                size: 20,
                color: '047857',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['No', 'Kelompok Dasawisma', 'Jml KK', 'Jiwa', 'Balita', 'Bumil', 'Lansia', 'Rumah Sehat'], true),
              ...['Dasawisma Flamboyan 9', 'Dasawisma Flamboyan 10', 'Dasawisma Flamboyan 11'].map((dw, idx) => {
                const list = keluargaList.filter((k) => k.dasawisma === dw);
                return createDocxTableRow([
                  String(idx + 1),
                  dw,
                  String(list.length),
                  String(list.reduce((a, b) => a + b.jumlahAnggotaKeluarga, 0)),
                  String(list.reduce((a, b) => a + b.jumlahBalita, 0)),
                  String(list.reduce((a, b) => a + b.jumlahIbuHamil, 0)),
                  String(list.reduce((a, b) => a + b.jumlahLansia, 0)),
                  String(list.filter((b) => b.statusRumahSehat).length),
                ]);
              }),
            ],
          }),

          // BAB 4: Kegiatan & Kas
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'BAB IV. REKAPITULASI PROGRAM & ANGGARAN (BUKU III & V)',
                bold: true,
                size: 20,
                color: '047857',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['No', 'Nama Kegiatan', 'Tanggal', 'Pokja', 'Peserta', 'Realisasi Biaya', 'Status'], true),
              ...kegiatanList.slice(0, 10).map((k, i) =>
                createDocxTableRow([
                  String(i + 1),
                  k.namaKegiatan,
                  formatTanggalIndo(k.tanggal),
                  k.pokjaPengampu,
                  `${k.pesertaHadir}/${k.targetPeserta}`,
                  formatRupiah(k.anggaranRealisasi || k.anggaranRencana),
                  k.status,
                ])
              ),
            ],
          }),

          // Tanda Tangan
          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: `${profil.namaKota}, ${todayStr}\n\n`,
                size: 18,
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Menyetujui,\n', size: 18 }),
                          new TextRun({ text: 'Sekretaris TP PKK RT\n\n\n\n\n', bold: true, size: 18 }),
                          new TextRun({ text: `( ${profil.namaSekretaris} )`, bold: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Mengetahui,\n', size: 18 }),
                          new TextRun({ text: 'Ketua TP PKK RT\n\n\n\n\n', bold: true, size: 18 }),
                          new TextRun({ text: `( ${profil.namaKetua} )`, bold: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Laporan_Lengkap_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${new Date().getFullYear()}.docx`);
};

/**
 * Export Konsep / Naskah Surat Dinas PKK ke format PDF Resmi
 */
export const exportSuratResmiPDF = (
  content: string,
  profil: ProfilPKKRT,
  meta?: {
    nomorSurat?: string;
    perihal?: string;
    tanggal?: string;
    sifat?: string;
    lampiran?: string;
    tujuan?: string;
  }
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Kop Surat
  drawKopSuratPDF(doc, profil);

  let currentY = 44;
  const todayStr = meta?.tanggal || formatTanggalIndo(new Date().toISOString());

  // Metadata Surat
  if (meta?.nomorSurat) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    doc.text(`Nomor    : ${meta.nomorSurat}`, 14, currentY);
    doc.text(`${profil.namaKota}, ${todayStr}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 5;

    doc.text(`Sifat       : ${meta.sifat || 'Penting'}`, 14, currentY);
    currentY += 5;

    doc.text(`Lampiran : ${meta.lampiran || '-'}`, 14, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`Perihal    : ${meta.perihal || 'Undangan / Pemberitahuan'}`, 14, currentY);
    currentY += 8;
  }

  // Isi Naskah Surat (Batang Tubuh yang bersih tanpa kop/perihal ganda, titik dua sejajar vertikal)
  const blocks = parseSuratBodyBlocks(content);

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      doc.setFont('times', block.isBold ? 'bold' : 'normal');
      const wrapped = doc.splitTextToSize(block.text, pageWidth - 28);

      for (const wLine of wrapped) {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(wLine, 14, currentY);
        currentY += 5.2;
      }
      currentY += 2;
    } else if (block.type === 'key-value') {
      const colLabelX = 18;
      const colColonX = 52;
      const colValX = 56;
      const valMaxWidth = pageWidth - 14 - colValX;

      for (const item of block.items) {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('times', 'bold');
        doc.text(item.label, colLabelX, currentY);
        doc.text(':', colColonX, currentY);
        doc.setFont('times', 'normal');

        const wrappedVal = doc.splitTextToSize(item.value, valMaxWidth);
        for (let vIdx = 0; vIdx < wrappedVal.length; vIdx++) {
          if (vIdx > 0 && currentY > pageHeight - 45) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(wrappedVal[vIdx], colValX, currentY);
          currentY += 5.2;
        }
      }
      currentY += 2;
    } else if (block.type === 'numbered-list') {
      const colNumX = 18;
      const colTextX = 26;
      const textMaxWidth = pageWidth - 14 - colTextX;

      block.items.forEach((item, idx) => {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }
        const numStr = item.num || `${idx + 1}.`;
        doc.setFont('times', 'bold');
        doc.text(numStr, colNumX, currentY);
        doc.setFont('times', 'normal');

        const wrappedText = doc.splitTextToSize(item.text, textMaxWidth);
        for (let tIdx = 0; tIdx < wrappedText.length; tIdx++) {
          if (tIdx > 0 && currentY > pageHeight - 45) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(wrappedText[tIdx], colTextX, currentY);
          currentY += 5.2;
        }
        currentY += 1.2;
      });
      currentY += 2;
    } else if (block.type === 'list') {
      const colBulletX = 18;
      const colTextX = 24;
      const textMaxWidth = pageWidth - 14 - colTextX;

      block.items.forEach((item) => {
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('times', 'bold');
        doc.text('•', colBulletX, currentY);
        doc.setFont('times', 'normal');

        const wrappedText = doc.splitTextToSize(item, textMaxWidth);
        for (let tIdx = 0; tIdx < wrappedText.length; tIdx++) {
          if (tIdx > 0 && currentY > pageHeight - 45) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(wrappedText[tIdx], colTextX, currentY);
          currentY += 5.2;
        }
        currentY += 1.2;
      });
      currentY += 2;
    }
  }

  // Tanda Tangan Block Style (Cukup Ketua & Sekretaris - 10 mm / 1 cm di bawah kalimat terakhir)
  currentY += 10;
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text(`TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(10);

  const leftX = 50;
  const rightX = pageWidth - 50;

  doc.text('Ketua,', leftX, currentY, { align: 'center' });
  doc.text('Sekretaris,', rightX, currentY, { align: 'center' });

  doc.text(`( Ny. ${profil.namaKetua} )`, leftX, currentY + 18, { align: 'center' });
  doc.text(`( Ny. ${profil.namaSekretaris || 'Sekretaris'} )`, rightX, currentY + 18, { align: 'center' });

  const filename = `Surat_PKK_${(meta?.nomorSurat || 'Konsep').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Export Konsep / Naskah Surat Dinas PKK ke format Word (.docx)
 */
export const exportSuratResmiWord = async (
  content: string,
  profil: ProfilPKKRT,
  meta?: {
    nomorSurat?: string;
    perihal?: string;
    tanggal?: string;
    sifat?: string;
    lampiran?: string;
    tujuan?: string;
  }
) => {
  const todayStr = meta?.tanggal || formatTanggalIndo(new Date().toISOString());
  const blocks = parseSuratBodyBlocks(content);

  const bodyElements: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      bodyElements.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { line: 280, before: 60, after: 60 },
          children: [
            new TextRun({
              text: block.text || ' ',
              bold: block.isBold,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    } else if (block.type === 'key-value') {
      bodyElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          indent: { size: 360, type: WidthType.DXA },
          rows: block.items.map(
            (item) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.label,
                            font: 'Times New Roman',
                            size: 22,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: ':',
                            font: 'Times New Roman',
                            size: 22,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 71, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.BOTH,
                        children: [
                          new TextRun({
                            text: item.value,
                            font: 'Times New Roman',
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
      );
    } else if (block.type === 'numbered-list') {
      bodyElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          indent: { size: 360, type: WidthType.DXA },
          rows: block.items.map(
            (item, idx) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: item.num || `${idx + 1}.`,
                            font: 'Times New Roman',
                            size: 22,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 94, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.BOTH,
                        children: [
                          new TextRun({
                            text: item.text,
                            font: 'Times New Roman',
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
      );
    } else if (block.type === 'list') {
      bodyElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          indent: { size: 360, type: WidthType.DXA },
          rows: block.items.map(
            (item) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '•',
                            font: 'Times New Roman',
                            size: 22,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 95, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.BOTH,
                        children: [
                          new TextRun({
                            text: item,
                            font: 'Times New Roman',
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)\n',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}\n`,
                bold: true,
                size: 24,
                color: '047857',
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `KELURAHAN ${profil.namaKelurahan.toUpperCase()}, KECAMATAN ${profil.namaKecamatan.toUpperCase()}\n`,
                size: 19,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `${profil.namaKota.toUpperCase()} - PROVINSI ${profil.provinsi.toUpperCase()}\n`,
                size: 19,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `Sekretariat: ${profil.alamatSekretariat || `Balai Warga ${profil.namaRT}`}`,
                italics: true,
                size: 17,
                font: 'Times New Roman',
              }),
            ],
            spacing: { after: 200 },
            border: {
              bottom: {
                color: '047857',
                space: 4,
                style: BorderStyle.DOUBLE,
                size: 18,
              },
            },
          }),

          ...(meta?.nomorSurat
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                          },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: `Nomor    : ${meta.nomorSurat}\n`, font: 'Times New Roman', size: 21 }),
                                new TextRun({ text: `Sifat       : ${meta.sifat || 'Penting'}\n`, font: 'Times New Roman', size: 21 }),
                                new TextRun({ text: `Lampiran : ${meta.lampiran || '-'}\n`, font: 'Times New Roman', size: 21 }),
                                new TextRun({ text: `Perihal    : ${meta.perihal || 'Undangan / Pemberitahuan'}`, font: 'Times New Roman', size: 21, bold: true }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          borders: {
                            top: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE },
                            left: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({ text: `${profil.namaKota}, ${todayStr}`, font: 'Times New Roman', size: 21 }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ spacing: { after: 200 } }),
              ]
            : []),

          ...bodyElements,

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: `TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()}`,
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Ketua,\n\n\n\n', bold: true, font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: `( Ny. ${profil.namaKetua} )`, bold: true, font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Sekretaris,\n\n\n\n', bold: true, font: 'Times New Roman', size: 21 }),
                          new TextRun({ text: `( Ny. ${profil.namaSekretaris || 'Sekretaris'} )`, bold: true, font: 'Times New Roman', size: 21 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Surat_PKK_${(meta?.nomorSurat || 'Konsep').replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
  saveAs(blob, filename);
};

// Helper table row for docx
const createDocxTableRow = (cells: string[], isHeader = false): TableRow => {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          shading: isHeader ? { fill: '047857' } : undefined,
          children: [
            new Paragraph({
              alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text,
                  bold: isHeader,
                  size: isHeader ? 16 : 15,
                  color: isHeader ? 'FFFFFF' : '0F172A',
                }),
              ],
            }),
          ],
        })
    ),
  });
};

// ==========================================
// LAPORAN KEUANGAN & LPJ KAS PKK EXPORTERS
// ==========================================

export interface LaporanKeuanganOptions {
  tahun?: number | string;
  bulan?: number | string; // 1-12 or 'Semua'
  kategori?: string;
}

const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Export Laporan Pertanggungjawaban (LPJ) Keuangan & Buku Kas Umum ke PDF Resmi
 */
export const exportLaporanKeuanganPDF = (
  profil: ProfilPKKRT,
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[],
  options?: LaporanKeuanganOptions
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const tahun = options?.tahun || new Date().getFullYear();
  const bulanOpt = options?.bulan && options.bulan !== 'Semua' ? Number(options.bulan) : null;

  // Filter transaksi based on year and month if provided
  const filteredKas = (transaksiList || []).filter((t) => {
    if (!t.tanggal) return true;
    const d = new Date(t.tanggal);
    const matchYear = !isNaN(d.getFullYear()) ? d.getFullYear() === Number(tahun) : true;
    const matchMonth = bulanOpt !== null ? d.getMonth() + 1 === bulanOpt : true;
    const matchKat = options?.kategori && options.kategori !== 'Semua' ? t.kategori === options.kategori : true;
    return matchYear && matchMonth && matchKat;
  });

  const totalMasuk = filteredKas.filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const totalKeluar = filteredKas.filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // Kop Surat
  drawKopSuratPDF(doc, profil);

  let currentY = 48;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN & KAS UMUM', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const periodeText = bulanOpt ? `Bulan ${BULAN_INDO[bulanOpt - 1]} ${tahun}` : `Tahun Anggaran ${tahun}`;
  doc.text(`Periode: ${periodeText} | Wilayah: ${profil.namaRT} / ${profil.namaRW}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Section 1: Ringkasan Posisi Kas (Executive Statement)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('I. IKHTISAR POSISI ARUS KAS & SALDO KEUANGAN', 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['No', 'Uraian Pos Keuangan', 'Jumlah Nominal (Rp)', 'Keterangan Akuntansi']],
    body: [
      ['1', 'Total Penerimaan / Pemasukan Kas (Debit)', formatRupiah(totalMasuk), 'Penerimaan iuran, donasi, bantuan & UP2K'],
      ['2', 'Total Pengeluaran / Belanja Kegiatan (Kredit)', formatRupiah(totalKeluar), 'Belanja operasional, konsumsi, PMT, TOGA & ATK'],
      ['3', 'Surplus / (Defisit) Bersih Periode Berjalan', formatRupiah(saldoAkhir), saldoAkhir >= 0 ? 'Surplus Anggaran Terkendali' : 'Defisit Anggaran'],
      ['4', 'Sisa Saldo Kas Riil di Bendahara', formatRupiah(saldoAkhir), `Tersimpan di Kas Tunai ${profil.namaRT}`],
    ],
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 75, fontStyle: 'bold' },
      2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 52 },
    },
    styles: { cellPadding: 2.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Section 2: Rekapitulasi Pos Penerimaan & Pengeluaran
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('II. REKAPITULASI REALISASI ANGGARAN MENURUT POS KATEGORI', 14, currentY);
  currentY += 2;

  // Category breakdown for masuk & keluar
  const katMasukMap: { [k: string]: number } = {};
  const katKeluarMap: { [k: string]: number } = {};

  filteredKas.forEach((t) => {
    if (t.jenis === 'Masuk') {
      katMasukMap[t.kategori] = (katMasukMap[t.kategori] || 0) + (t.jumlah || 0);
    } else {
      katKeluarMap[t.kategori] = (katKeluarMap[t.kategori] || 0) + (t.jumlah || 0);
    }
  });

  const bodyKategori: any[] = [];
  bodyKategori.push([{ content: 'A. PENERIMAAN / PEMASUKAN KAS (DEBET)', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [4, 120, 87] } }]);
  
  const entriesMasuk = Object.entries(katMasukMap);
  if (entriesMasuk.length === 0) {
    bodyKategori.push(['-', 'Belum ada catatan penerimaan pada periode ini', 'Rp 0', '0%']);
  } else {
    entriesMasuk.forEach(([kat, val], idx) => {
      const pct = totalMasuk > 0 ? ((val / totalMasuk) * 100).toFixed(1) + '%' : '0%';
      bodyKategori.push([`${idx + 1}`, kat, formatRupiah(val), pct]);
    });
  }
  bodyKategori.push([{ content: 'Subtotal Penerimaan Kas', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(totalMasuk), styles: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87] } }, { content: '100%', styles: { fontStyle: 'bold' } }]);

  bodyKategori.push([{ content: 'B. PENGELUARAN / BELANJA OPERASIONAL (KREDIT)', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [255, 241, 242], textColor: [185, 28, 28] } }]);
  
  const entriesKeluar = Object.entries(katKeluarMap);
  if (entriesKeluar.length === 0) {
    bodyKategori.push(['-', 'Belum ada catatan belanja pada periode ini', 'Rp 0', '0%']);
  } else {
    entriesKeluar.forEach(([kat, val], idx) => {
      const pct = totalKeluar > 0 ? ((val / totalKeluar) * 100).toFixed(1) + '%' : '0%';
      bodyKategori.push([`${idx + 1}`, kat, formatRupiah(val), pct]);
    });
  }
  bodyKategori.push([{ content: 'Subtotal Pengeluaran Kas', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }, { content: formatRupiah(totalKeluar), styles: { fontStyle: 'bold', halign: 'right', textColor: [185, 28, 28] } }, { content: '100%', styles: { fontStyle: 'bold' } }]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['No', 'Uraian Pos Kategori Kas', 'Realisasi Nominal', 'Porsi (%)']],
    body: bodyKategori,
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 32, halign: 'center' },
    },
    styles: { cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Section 3: Buku Kas Harian Detail
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('III. BUKU KAS UMUM (RINCIAN BUKU III ADMINISTRASI PKK)', 14, currentY);
  currentY += 2;

  let saldoBerjalan = 0;
  const kasDetailBody = filteredKas.map((t, idx) => {
    const masuk = t.jenis === 'Masuk' ? t.jumlah : 0;
    const keluar = t.jenis === 'Keluar' ? t.jumlah : 0;
    saldoBerjalan += masuk - keluar;
    return [
      `${idx + 1}`,
      t.tanggal || '-',
      t.noBukti || '-',
      t.keterangan || '-',
      masuk > 0 ? formatRupiah(masuk) : '-',
      keluar > 0 ? formatRupiah(keluar) : '-',
      formatRupiah(saldoBerjalan),
    ];
  });

  if (kasDetailBody.length === 0) {
    kasDetailBody.push(['-', '-', '-', 'Belum ada transaksi kas yang dicatat.', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [['No', 'Tanggal', 'No Bukti', 'Uraian / Keterangan', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo (Rp)']],
    body: kasDetailBody,
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 58 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    styles: { cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Signatures
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  const todayStr = formatTanggalIndo(new Date().toISOString());

  // Three-column signature: Bendahara (left), Ketua TP PKK (center/right), Mengetahui Ketua RW
  doc.text('Mengetahui / Memeriksa,', 20, currentY);
  doc.text(`${profil.namaKota}, ${todayStr}`, pageWidth - 70, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Ketua RW ${profil.namaRW.replace(/[^0-9]/g, '') || '01'}`, 20, currentY);
  doc.text(`Bendahara TP PKK ${profil.namaRT}`, pageWidth / 2 - 15, currentY);
  doc.text(`Ketua TP PKK ${profil.namaRT}`, pageWidth - 70, currentY);

  currentY += 20;
  doc.text('( ........................................ )', 20, currentY);
  doc.text(`( ${profil.namaBendahara || 'Bendahara'} )`, pageWidth / 2 - 15, currentY);
  doc.text(`( ${profil.namaKetua || 'Ketua TP PKK'} )`, pageWidth - 70, currentY);

  // Footer Page Number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Laporan Keuangan TP PKK ${profil.namaRT} | Hal ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(`Laporan_Keuangan_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${tahun}.pdf`);
};

/**
 * Export Laporan Keuangan ke format Excel (.xlsx) Multi-Sheet Lengkap
 */
export const exportLaporanKeuanganExcel = (
  profil: ProfilPKKRT,
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[],
  options?: LaporanKeuanganOptions
) => {
  const wb = XLSX.utils.book_new();
  const tahun = options?.tahun || new Date().getFullYear();

  const totalMasuk = (transaksiList || []).filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const totalKeluar = (transaksiList || []).filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // Sheet 1: Ringkasan LPJ Keuangan
  const summaryAoa = [
    [`LAPORAN PERTANGGUNGJAWABAN (LPJ) KEUANGAN TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}`],
    [`Kelurahan ${profil.namaKelurahan}, Kecamatan ${profil.namaKecamatan}, ${profil.namaKota}`],
    [`Tahun Anggaran: ${tahun}`],
    [],
    ['=== IKHTISAR ARUS KAS & SALDO ===', ''],
    ['Total Penerimaan Kas (Debit)', totalMasuk],
    ['Total Pengeluaran Kas (Kredit)', totalKeluar],
    ['Surplus / Defisit Periode', saldoAkhir],
    ['Sisa Saldo Kas Tersedia', saldoAkhir],
    [],
    ['=== RINCIAN PENERIMAAN MENURUT POS ===', ''],
  ];

  const katMasukMap: { [k: string]: number } = {};
  const katKeluarMap: { [k: string]: number } = {};

  (transaksiList || []).forEach((t) => {
    if (t.jenis === 'Masuk') {
      katMasukMap[t.kategori] = (katMasukMap[t.kategori] || 0) + (t.jumlah || 0);
    } else {
      katKeluarMap[t.kategori] = (katKeluarMap[t.kategori] || 0) + (t.jumlah || 0);
    }
  });

  Object.entries(katMasukMap).forEach(([k, v]) => {
    summaryAoa.push([`  - ${k}`, v as any]);
  });

  summaryAoa.push([], ['=== RINCIAN BELANJA MENURUT POS ===', '']);
  Object.entries(katKeluarMap).forEach(([k, v]) => {
    summaryAoa.push([`  - ${k}`, v as any]);
  });

  summaryAoa.push(
    [],
    ['Ketua TP PKK RT', profil.namaKetua],
    ['Bendahara', profil.namaBendahara],
    ['Tanggal Cetak', new Date().toLocaleDateString('id-ID')]
  );

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan LPJ Kas');

  // Sheet 2: Buku Kas Umum (Buku III)
  let saldoRun = 0;
  const kasRows = (transaksiList || []).map((t, idx) => {
    const masuk = t.jenis === 'Masuk' ? t.jumlah : 0;
    const keluar = t.jenis === 'Keluar' ? t.jumlah : 0;
    saldoRun += masuk - keluar;
    return {
      No: idx + 1,
      Tanggal: t.tanggal,
      'No Bukti / Kuitansi': t.noBukti || '-',
      Jenis: t.jenis,
      Kategori: t.kategori,
      'Uraian Transaksi': t.keterangan,
      'Pemasukan (Rp)': masuk,
      'Pengeluaran (Rp)': keluar,
      'Saldo Berjalan (Rp)': saldoRun,
      'Penanggung Jawab': t.penanggungJawab,
    };
  });

  const wsKas = XLSX.utils.json_to_sheet(kasRows);
  XLSX.utils.book_append_sheet(wb, wsKas, 'Buku Kas Umum');

  // Sheet 3: Matriks Iuran Anggota
  const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const iuranRows = (rekapIuran || []).map((iw, idx) => {
    const rowObj: any = {
      No: idx + 1,
      'Nama Anggota': iw.namaAnggota,
      Jabatan: iw.jabatan,
      'Kelompok Dasawisma': iw.dasawisma || '-',
    };
    let totalLunasCount = 0;
    let totalNominalBayar = 0;
    bulanNames.forEach((bName, mIdx) => {
      const bStat = iw.bulan[mIdx + 1];
      const isPaid = bStat?.lunas;
      const nom = bStat?.nominal || profil.iuranBulananNominal || 10000;
      rowObj[bName] = isPaid ? `Lunas (${nom})` : 'Belum';
      if (isPaid) {
        totalLunasCount++;
        totalNominalBayar += nom;
      }
    });
    rowObj['Total Bulan Lunas'] = totalLunasCount;
    rowObj['Total Nominal (Rp)'] = totalNominalBayar;
    return rowObj;
  });

  const wsIuran = XLSX.utils.json_to_sheet(iuranRows);
  XLSX.utils.book_append_sheet(wb, wsIuran, 'Rekap Iuran Anggota');

  XLSX.writeFile(wb, `Laporan_Keuangan_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${tahun}.xlsx`);
};

/**
 * Export Laporan Keuangan ke format Dokumen Word (.docx) Resmi Siap Edit
 */
export const exportLaporanKeuanganWord = async (
  profil: ProfilPKKRT,
  transaksiList: TransaksiKas[],
  rekapIuran: RekapIuranAnggota[],
  options?: LaporanKeuanganOptions
) => {
  const tahun = options?.tahun || new Date().getFullYear();
  const totalMasuk = (transaksiList || []).filter((t) => t.jenis === 'Masuk').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const totalKeluar = (transaksiList || []).filter((t) => t.jenis === 'Keluar').reduce((acc, t) => acc + (t.jumlah || 0), 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  let saldoRun = 0;
  const kasTableRows = (transaksiList || []).map((t, idx) => {
    const masuk = t.jenis === 'Masuk' ? t.jumlah : 0;
    const keluar = t.jenis === 'Keluar' ? t.jumlah : 0;
    saldoRun += masuk - keluar;
    return createDocxTableRow([
      `${idx + 1}`,
      t.tanggal || '-',
      t.keterangan || '-',
      masuk > 0 ? formatRupiah(masuk) : '-',
      keluar > 0 ? formatRupiah(keluar) : '-',
      formatRupiah(saldoRun),
    ]);
  });

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Laporan Keuangan TP PKK ${profil.namaRT} / ${profil.namaRW}`,
                    font: 'Times New Roman',
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Kop Dokumen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)\n',
                bold: true,
                size: 24,
                color: '047857',
              }),
              new TextRun({
                text: `TIM PENGGERAK PKK ${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}\n`,
                bold: true,
                size: 22,
                color: '0F172A',
              }),
              new TextRun({
                text: `Kelurahan ${profil.namaKelurahan}, Kecamatan ${profil.namaKecamatan}, ${profil.namaKota}\n\n`,
                size: 18,
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'LAPORAN PERTANGGUNGJAWABAN KEUANGAN & BUKU KAS UMUM\n',
                bold: true,
                size: 22,
                underline: {},
              }),
              new TextRun({
                text: `Tahun Anggaran ${tahun}\n\n`,
                size: 18,
                italics: true,
              }),
            ],
          }),

          // Bab I: Ringkasan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'I. IKHTISAR POSISI KAS & ARUS DANA', bold: true, size: 20, color: '047857' })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['No', 'Pos Anggaran Keuangan', 'Jumlah Nominal (Rp)', 'Keterangan'], true),
              createDocxTableRow(['1', 'Total Penerimaan Kas (Debit)', formatRupiah(totalMasuk), 'Iuran, Donasi, Bantuan']),
              createDocxTableRow(['2', 'Total Pengeluaran Kas (Kredit)', formatRupiah(totalKeluar), 'Belanja operasional & kegiatan']),
              createDocxTableRow(['3', 'Surplus / (Defisit) Periode', formatRupiah(saldoAkhir), saldoAkhir >= 0 ? 'Surplus' : 'Defisit']),
              createDocxTableRow(['4', 'Saldo Kas Akhir di Bendahara', formatRupiah(saldoAkhir), `Kas Tunai ${profil.namaRT}`]),
            ],
          }),
          new Paragraph({ text: '\n' }),

          // Bab II: Rincian Buku Kas
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: 'II. BUKU KAS UMUM (BUKU III ADMINISTRASI PKK)', bold: true, size: 20, color: '047857' })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createDocxTableRow(['No', 'Tanggal', 'Uraian Transaksi', 'Penerimaan', 'Pengeluaran', 'Saldo Kas'], true),
              ...kasTableRows,
            ],
          }),
          new Paragraph({ text: '\n\n' }),

          // Penutup & Tanda Tangan
          new Paragraph({
            children: [
              new TextRun({
                text: `Demikian Laporan Pertanggungjawaban Keuangan ini kami susun dengan sebenar-benarnya sesuai pembukuan kas yang ada untuk dapat dipergunakan sebagaimana mestinya.\n\n`,
                size: 18,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Mengetahui,\n', size: 18 }),
                          new TextRun({ text: 'Ketua TP PKK RT\n\n\n\n\n', bold: true, size: 18 }),
                          new TextRun({ text: `( Ny. ${profil.namaKetua || 'Ketua'} )`, bold: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: `${profil.namaKota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`, size: 18 }),
                          new TextRun({ text: 'Bendahara TP PKK RT\n\n\n\n\n', bold: true, size: 18 }),
                          new TextRun({ text: `( Ny. ${profil.namaBendahara || 'Bendahara'} )`, bold: true, size: 18 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Laporan_Keuangan_PKK_${profil.namaRT.replace(/\s+/g, '_')}_${tahun}.docx`);
};

