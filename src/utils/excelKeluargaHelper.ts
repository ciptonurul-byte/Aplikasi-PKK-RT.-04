import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { KeluargaDasawisma, DasawismaName, AnggotaKeluargaKK } from '../types/pkk';

export interface ParsedKeluargaRow {
  noKk: string;
  namaKepalaKeluarga: string;
  namaIbu: string;
  noHpIbu?: string;
  alamat: string;
  dasawisma: DasawismaName;
  jumlahAnggotaKeluarga: number;
  jumlahLakiLaki: number;
  jumlahPerempuan: number;
  jumlahBalita: number;
  jumlahIbuHamil: number;
  jumlahLansia: number;
  statusPUS: boolean;
  statusWUS: boolean;
  statusRumahSehat: boolean;
  memilikiJambanSehat: boolean;
  memilikiSPAL: boolean;
  memilikiTempatSampah: boolean;
  memilikiSumberAirBersih: boolean;
  memilikiPekaranganToga: boolean;
  makananPokok: 'Beras' | 'Non-Beras' | 'Campuran';
  kategoriSejahtera: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
  catatanKesehatan?: string;
  anggotaKeluarga?: AnggotaKeluargaKK[];
  // Validation status
  isValid: boolean;
  errors: string[];
  isExisting?: boolean;
}

/**
 * Downloads standard Excel template for importing Family / Dasawisma Data
 */
export function downloadTemplateExcelKeluarga(namaRT: string = 'RT 03'): void {
  const wb = XLSX.utils.book_new();

  // 1. Data Sheet with sample rows
  const templateData = [
    {
      'No KK (Wajib 16 Digit)': '3374010101010001',
      'Nama Kepala Keluarga (Wajib)': 'Ahmad Santoso',
      'Nama Ibu / Istri': 'Siti Rahayu',
      'No. HP / WhatsApp Ibu': '081234567890',
      'Nama Anak (Pisahkan dengan koma)': 'Muhammad Rizky Santoso, Aisyah Putri Santoso',
      'Kelompok Dasawisma': 'Dasawisma Flamboyan 9',
      'Alamat Rumah': 'Jl. Mawar Indah No. 12',
      'Jumlah Anggota Keluarga (Jiwa)': 4,
      'Jumlah Laki-laki': 2,
      'Jumlah Perempuan': 2,
      'Jumlah Balita': 1,
      'Jumlah Ibu Hamil': 0,
      'Jumlah Lansia': 1,
      'Pasangan Usia Subur (PUS) [Ya/Tidak]': 'Ya',
      'Wanita Usia Subur (WUS) [Ya/Tidak]': 'Ya',
      'Rumah Sehat [Ya/Tidak]': 'Ya',
      'Jamban Sehat [Ya/Tidak]': 'Ya',
      'Saluran Air Limbah (SPAL) [Ya/Tidak]': 'Ya',
      'Tempat Sampah [Ya/Tidak]': 'Ya',
      'Sumber Air Bersih [Ya/Tidak]': 'Ya',
      'Pekarangan TOGA [Ya/Tidak]': 'Ya',
      'Makanan Pokok [Beras/Non-Beras/Campuran]': 'Beras',
      'Kategori Sejahtera [Pra Sejahtera/Sejahtera I/Sejahtera II/Sejahtera III]': 'Sejahtera II',
      'Catatan Kesehatan': 'Balita rutin Posyandu setiap bulan',
    },
    {
      'No KK (Wajib 16 Digit)': '3374010101010002',
      'Nama Kepala Keluarga (Wajib)': 'Budi Pratama',
      'Nama Ibu / Istri': 'Dewi Lestari',
      'Nama Anak (Pisahkan dengan koma)': 'Dimas Aditya Pratama',
      'Kelompok Dasawisma': 'Dasawisma Flamboyan 10',
      'Alamat Rumah': 'Jl. Mawar Indah No. 14',
      'Jumlah Anggota Keluarga (Jiwa)': 3,
      'Jumlah Laki-laki': 1,
      'Jumlah Perempuan': 2,
      'Jumlah Balita': 0,
      'Jumlah Ibu Hamil': 1,
      'Jumlah Lansia': 0,
      'Pasangan Usia Subur (PUS) [Ya/Tidak]': 'Ya',
      'Wanita Usia Subur (WUS) [Ya/Tidak]': 'Ya',
      'Rumah Sehat [Ya/Tidak]': 'Ya',
      'Jamban Sehat [Ya/Tidak]': 'Ya',
      'Saluran Air Limbah (SPAL) [Ya/Tidak]': 'Ya',
      'Tempat Sampah [Ya/Tidak]': 'Ya',
      'Sumber Air Bersih [Ya/Tidak]': 'Ya',
      'Pekarangan TOGA [Ya/Tidak]': 'Tidak',
      'Makanan Pokok [Beras/Non-Beras/Campuran]': 'Beras',
      'Kategori Sejahtera [Pra Sejahtera/Sejahtera I/Sejahtera II/Sejahtera III]': 'Sejahtera I',
      'Catatan Kesehatan': 'Ibu hamil trimester 2, tensi normal',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // No KK
    { wch: 26 }, // Kepala Keluarga
    { wch: 22 }, // Nama Ibu
    { wch: 22 }, // Dasawisma
    { wch: 26 }, // Alamat
    { wch: 16 }, // Jml Jiwa
    { wch: 14 }, // Laki-laki
    { wch: 14 }, // Perempuan
    { wch: 12 }, // Balita
    { wch: 14 }, // Bumil
    { wch: 12 }, // Lansia
    { wch: 16 }, // PUS
    { wch: 16 }, // WUS
    { wch: 16 }, // Rumah Sehat
    { wch: 16 }, // Jamban
    { wch: 16 }, // SPAL
    { wch: 16 }, // Tempat Sampah
    { wch: 18 }, // Air Bersih
    { wch: 18 }, // TOGA
    { wch: 18 }, // Makanan Pokok
    { wch: 22 }, // Kategori Sejahtera
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Keluarga Dasawisma');

  // 2. Guide / Instructions Sheet
  const guideData = [
    { 'Panduan Pengisian': '1. Kolom "No KK" wajib diisi dengan 16 digit angka (contoh: 3374010101010001).' },
    { 'Panduan Pengisian': '2. Kolom "Nama Kepala Keluarga" wajib diisi.' },
    { 'Panduan Pengisian': '3. Pilihan "Kelompok Dasawisma": Dasawisma Flamboyan 9, Dasawisma Flamboyan 10, Dasawisma Flamboyan 11.' },
    { 'Panduan Pengisian': '4. Kolom Indikator Sanitasi & Kesehatan diisi "Ya" atau "Tidak" (atau Y / T).' },
    { 'Panduan Pengisian': '5. Pilihan "Makanan Pokok": Beras, Non-Beras, Campuran.' },
    { 'Panduan Pengisian': '6. Pilihan "Kategori Sejahtera": Pra Sejahtera, Sejahtera I, Sejahtera II, Sejahtera III.' },
    { 'Panduan Pengisian': '7. Format berkas yang didukung: .xlsx, .xls, .csv.' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });
  saveAs(data, `Template_Impor_Data_Keluarga_PKK_${namaRT.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Normalizes boolean strings like 'ya', 'y', 'true', '1', 'ada' to boolean
 */
function parseBooleanCell(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  const str = String(val).trim().toLowerCase();
  return ['ya', 'y', 'true', '1', 'ada', 'sehat', 'lunas', 'punya', 'v'].includes(str);
}

/**
 * Normalizes integer cells safely
 */
function parseNumberCell(val: any, defaultVal = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : Math.max(0, Math.floor(val));
  const cleaned = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Normalizes Dasawisma Name
 */
function parseDasawismaName(val: any): DasawismaName {
  if (!val) return 'Dasawisma Flamboyan 9';
  const str = String(val).trim().toLowerCase();
  if (
    str.includes('11') ||
    str.includes('sebelas') ||
    str.includes('anggrek') ||
    str.includes('dahlia') ||
    str.includes('kenanga')
  ) {
    return 'Dasawisma Flamboyan 11';
  }
  if (str.includes('10') || str.includes('sepuluh') || str.includes('mawar')) {
    return 'Dasawisma Flamboyan 10';
  }
  if (str.includes('9') || str.includes('sembilan') || str.includes('melati')) {
    return 'Dasawisma Flamboyan 9';
  }
  return 'Dasawisma Flamboyan 9';
}

/**
 * Normalizes Kategori Sejahtera
 */
function parseKategoriSejahtera(
  val: any
): 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III' {
  if (!val) return 'Sejahtera I';
  const str = String(val).trim().toLowerCase();
  if (str.includes('pra')) return 'Pra Sejahtera';
  if (str.includes('iii') || str.includes('3')) return 'Sejahtera III';
  if (str.includes('ii') || str.includes('2')) return 'Sejahtera II';
  return 'Sejahtera I';
}

/**
 * Normalizes Makanan Pokok
 */
function parseMakananPokok(val: any): 'Beras' | 'Non-Beras' | 'Campuran' {
  if (!val) return 'Beras';
  const str = String(val).trim().toLowerCase();
  if (str.includes('non') || str.includes('bukan') || str.includes('jagung') || str.includes('ubi')) {
    return 'Non-Beras';
  }
  if (str.includes('campur')) return 'Campuran';
  return 'Beras';
}

/**
 * Parses uploaded Excel or CSV file buffer into structured KeluargaDasawisma items
 */
export async function parseExcelKeluarga(
  file: File,
  existingList: KeluargaDasawisma[]
): Promise<ParsedKeluargaRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with header rows
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const existingNoKKs = new Set(existingList.map((k) => k.noKk.trim()));

  const parsed: ParsedKeluargaRow[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];

    // Find keys regardless of slight naming differences
    const findValue = (...keys: string[]): any => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanTarget = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanRowKey.includes(cleanTarget)) {
            return row[rowKey];
          }
        }
      }
      return '';
    };

    const noKkRaw = findValue('nokk', 'kartukeluarga', 'kk', 'nomorkk');
    const noKk = String(noKkRaw).replace(/[^0-9]/g, '').trim();

    const namaKepala = String(
      findValue('namakepala', 'kepalakeluarga', 'kepala', 'namaayah', 'namasuami') || ''
    ).trim();

    const namaIbu = String(findValue('namaibu', 'istri', 'namaistri', 'ibu') || '').trim();

    const namaAnakRaw = String(
      findValue('namaanak', 'daftaranak', 'daftarnamaanak', 'namaanggotakeluarga') || ''
    ).trim();

    const alamat = String(
      findValue('alamat', 'lokasi', 'tempattinggal', 'jalan', 'rumah') || 'Jl. Mawar Indah'
    ).trim();

    const noHpIbu = String(
      findValue('nohpibu', 'nohp', 'nomorhp', 'whatsapp', 'wa', 'telepon', 'nohpkeluarga') || ''
    ).trim();

    const dasawismaRaw = findValue('dasawisma', 'kelompok', 'kelompokdasawisma');
    const dasawisma = parseDasawismaName(dasawismaRaw);

    let jmlLaki = parseNumberCell(
      findValue('jumlahlakilaki', 'lakilaki', 'jmllaki', 'laki', 'pria'),
      0
    );
    let jmlPerempuan = parseNumberCell(
      findValue('jumlahperempuan', 'perempuan', 'jmlperempuan', 'wanita'),
      0
    );

    const jmlAnggotaRaw = findValue(
      'jumlahanggotakeluarga',
      'jumlahanggota',
      'jumlahjiwa',
      'jmljiwa',
      'totaljiwa',
      'jmlanggota',
      'totalanggota',
      'jiwa'
    );
    const hasExplicitJmlAnggota =
      jmlAnggotaRaw !== undefined && jmlAnggotaRaw !== null && String(jmlAnggotaRaw).trim() !== '';

    let jmlAnggota = parseNumberCell(
      jmlAnggotaRaw,
      jmlLaki + jmlPerempuan > 0 ? jmlLaki + jmlPerempuan : 4
    );

    // If both 0, calculate proportional default
    if (jmlLaki === 0 && jmlPerempuan === 0 && jmlAnggota > 0) {
      jmlLaki = Math.ceil(jmlAnggota / 2);
      jmlPerempuan = jmlAnggota - jmlLaki;
    }

    const jmlBalita = parseNumberCell(findValue('balita', 'anakbalita', 'jumlahbalita'), 0);
    const jmlIbuHamil = parseNumberCell(findValue('ibuhamil', 'bumil', 'hamil', 'jumlahibuhamil'), 0);
    const jmlLansia = parseNumberCell(findValue('lansia', 'orangtua', 'jumlahlansia'), 0);

    const statusPUS = parseBooleanCell(findValue('pus', 'pasanganusiasubur'), true);
    const statusWUS = parseBooleanCell(findValue('wus', 'wanitausiasubur'), true);
    const statusRumahSehat = parseBooleanCell(findValue('rumahsehat', 'statusrumah', 'sehat'), true);
    const memilikiJambanSehat = parseBooleanCell(findValue('jamban', 'jambansehat', 'toilet', 'wc'), true);
    const memilikiSPAL = parseBooleanCell(findValue('spal', 'saluranair', 'limbah'), true);
    const memilikiTempatSampah = parseBooleanCell(findValue('tempatsampah', 'sampah'), true);
    const memilikiSumberAirBersih = parseBooleanCell(findValue('sumberair', 'airbersih', 'pdam', 'sumur'), true);
    const memilikiPekaranganToga = parseBooleanCell(findValue('pekarangan', 'toga', 'tanamanobat', 'kebun'), true);

    const makananPokok = parseMakananPokok(findValue('makananpokok', 'pangan', 'makanan'));
    const kategoriSejahtera = parseKategoriSejahtera(findValue('kategorisejahtera', 'sejahtera', 'tahapansejahtera'));
    const catatanKesehatan = String(findValue('catatankesehatan', 'catatan', 'keterangan') || '').trim();

    // Validation
    const errors: string[] = [];
    if (!namaKepala) {
      errors.push('Nama Kepala Keluarga tidak boleh kosong');
    }
    if (!noKk) {
      errors.push('Nomor KK tidak boleh kosong');
    } else if (noKk.length !== 16) {
      errors.push(`Panjang No KK harus 16 digit (saat ini ${noKk.length} digit)`);
    }

    const isExisting = Boolean(noKk && existingNoKKs.has(noKk));

    // Build explicit anggotaKeluarga if child names are provided in Excel
    let parsedMembers: AnggotaKeluargaKK[] | undefined = undefined;
    const ignoredChildTokens = new Set([
      '-',
      'tidak',
      'tidak ada',
      'belum',
      'belum ada',
      'nihil',
      'kosong',
      'ya',
      'ada',
      'none',
      'null',
    ]);
    const childNames = namaAnakRaw
      ? namaAnakRaw
          .split(/[,;|\n]+/)
          .map((s) => s.trim())
          .filter(
            (s) =>
              s.length > 1 &&
              isNaN(Number(s)) &&
              !ignoredChildTokens.has(s.toLowerCase())
          )
      : [];

    if (childNames.length > 0) {
      const baseNik = (noKk || '3201010101010001').padEnd(12, '0').slice(0, 12);
      parsedMembers = [
        {
          nama: namaKepala || `Kepala Keluarga`,
          nik: `${baseNik}0001`,
          jenisKelamin: 'Laki-laki',
          usia: 42,
          statusHubungan: 'KEPALA KELUARGA',
          pendidikan: 'SMA / SMK',
          jenisPekerjaan: 'Karyawan / Wiraswasta',
          statusPernikahan: 'Kawin',
          kategoriSasaran: statusPUS ? 'PUS' : 'Umum',
        },
      ];
      if (namaIbu && namaIbu !== '-') {
        parsedMembers.push({
          nama: namaIbu,
          nik: `${baseNik}0002`,
          jenisKelamin: 'Perempuan',
          usia: 37,
          statusHubungan: 'ISTRI',
          pendidikan: 'SMA / SMK',
          jenisPekerjaan: 'Ibu Rumah Tangga',
          statusPernikahan: 'Kawin',
          noHp: noHpIbu || undefined,
          kategoriSasaran: jmlIbuHamil > 0 ? 'Ibu Hamil' : statusWUS ? 'WUS' : 'Umum',
        });
      }
      childNames.forEach((cName, cIdx) => {
        const isFemaleGuess = /\b(putri|aisyah|siti|dewi|ayu|nabila|zahra|kirana|citra|dinda|syifa|intan|tiara|nadira|alya|salsabila|inara|khaira)\b/i.test(
          cName
        );
        const isBalitaChild = cIdx < jmlBalita;
        parsedMembers!.push({
          nama: cName,
          nik: `${baseNik}${String(parsedMembers!.length + 1).padStart(4, '0')}`,
          jenisKelamin: isFemaleGuess ? 'Perempuan' : 'Laki-laki',
          usia: isBalitaChild ? 3 : Math.max(6, 14 - cIdx * 3),
          statusHubungan: 'ANAK',
          pendidikan: isBalitaChild ? 'Belum Sekolah / PAUD' : 'SD / SMP',
          jenisPekerjaan: isBalitaChild ? 'Belum Bekerja' : 'Pelajar',
          statusPernikahan: 'Belum Kawin',
          namaAyah: namaKepala,
          namaIbu: namaIbu,
          kategoriSasaran: isBalitaChild ? 'Balita' : 'Anak/Sekolah',
        });
      });
    }

    const finalJumlahAnggota = hasExplicitJmlAnggota
      ? Math.max(jmlAnggota, parsedMembers ? parsedMembers.length : 1)
      : parsedMembers
      ? parsedMembers.length
      : jmlAnggota;

    parsed.push({
      noKk,
      namaKepalaKeluarga: namaKepala || `Kepala Keluarga (Baris ${idx + 1})`,
      namaIbu: namaIbu || 'Ibu Rumah Tangga',
      noHpIbu: noHpIbu || undefined,
      alamat: alamat || 'Jl. Mawar Indah',
      dasawisma,
      jumlahAnggotaKeluarga: finalJumlahAnggota,
      jumlahLakiLaki: jmlLaki,
      jumlahPerempuan: jmlPerempuan,
      jumlahBalita: jmlBalita,
      jumlahIbuHamil: jmlIbuHamil,
      jumlahLansia: jmlLansia,
      statusPUS,
      statusWUS,
      statusRumahSehat,
      memilikiJambanSehat,
      memilikiSPAL,
      memilikiTempatSampah,
      memilikiSumberAirBersih,
      memilikiPekaranganToga,
      makananPokok,
      kategoriSejahtera,
      catatanKesehatan,
      anggotaKeluarga: parsedMembers,
      isValid: errors.length === 0,
      errors,
      isExisting,
    });
  }

  return parsed;
}
