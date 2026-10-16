import { ProfilPKKRT } from '../types/pkk';

/**
 * Format string nomor HP menjadi format standar internasional WhatsApp (628...)
 * Menghapus spasi, strip, tanda kurung, dan awalan 0 atau +62
 */
export function cleanWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  // Ambil hanya digit angka
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (!cleaned) return '';

  // Jika berawalan '0', ganti dengan '62' (cth: 0812 -> 62812)
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  // Jika berawalan '8', tambahkan '62' (cth: 812 -> 62812)
  else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  // Jika sudah 62, biarkan

  return cleaned;
}

/**
 * Validasi apakah nomor HP tampak valid sebagai nomor ponsel Indonesia
 */
export function isValidIndonesianPhone(phone: string | undefined | null): boolean {
  const cleaned = cleanWhatsAppNumber(phone);
  return /^628\d{8,12}$/.test(cleaned);
}

/**
 * Format tampilan nomor HP untuk UI (cth: 0812-3456-7890)
 */
export function formatPhoneDisplay(phone: string | undefined | null): string {
  if (!phone) return '-';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) {
    const local = '0' + digits.substring(2);
    if (local.length >= 10) {
      return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
    }
    return local;
  }
  if (digits.length >= 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

/**
 * Konversi angka rupiah ke teks terbilang bahasa Indonesia
 * Cth: 10000 -> "Sepuluh Ribu Rupiah", 25000 -> "Dua Puluh Lima Ribu Rupiah"
 */
export function angkaKeTerbilang(angka: number): string {
  if (isNaN(angka) || angka === 0) return 'Nol Rupiah';

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function convert(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
    return convert(Math.floor(n / 1000000000000)) + ' Triliun ' + convert(n % 1000000000000);
  }

  const hasil = convert(Math.abs(Math.round(angka))).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
}

export interface KwitansiIuranPayload {
  nomorKwitansi: string;
  tanggalBayar: string;
  namaPenerimaIuran: string; // Nama Ibu / Anggota PKK
  noHp: string;
  jabatan?: string;
  dasawisma?: string;
  bulanList: number[]; // Cth: [10] atau [10, 11]
  tahun: number;
  nominalPerBulan: number;
  totalNominal: number;
  metodeBayar: 'Tunai' | 'Transfer';
  catatan?: string;
  namaBendahara: string;
}

export const NAMA_BULAN_LENGKAP = [
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

/**
 * Buat nomor kwitansi otomatis yang rapi
 */
export function generateNomorKwitansi(tahun: number, bulanList: number[], suffix: string): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const bulanTag = bulanList.map((m) => String(m).padStart(2, '0')).join('');
  const cleanSuffix = (suffix || '001').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `KW-IUR/${dateStr}/${bulanTag || 'BLN'}-${cleanSuffix}`;
}

/**
 * Format pesan WhatsApp resmi tanda terima / kwitansi pembayaran iuran
 */
export function formatPesanWhatsAppKwitansi(
  payload: KwitansiIuranPayload,
  profil: ProfilPKKRT
): string {
  const {
    nomorKwitansi,
    tanggalBayar,
    namaPenerimaIuran,
    jabatan = 'Anggota PKK',
    dasawisma,
    bulanList,
    tahun,
    nominalPerBulan,
    totalNominal,
    metodeBayar,
    catatan,
    namaBendahara,
  } = payload;

  const sortedBulan = [...bulanList].sort((a, b) => a - b);
  const daftarBulanNama = sortedBulan.map((b) => NAMA_BULAN_LENGKAP[b - 1]).join(', ');
  const terbilang = angkaKeTerbilang(totalNominal);

  const tglFormatted = (() => {
    try {
      const dt = new Date(tanggalBayar);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {}
    return tanggalBayar;
  })();

  const kopRT = `${profil.namaRT} / ${profil.namaRW}`;
  const kel = profil.namaKelurahan ? `Kel. ${profil.namaKelurahan}` : '';
  const kec = profil.namaKecamatan ? `Kec. ${profil.namaKecamatan}` : '';
  const kota = profil.namaKota || '';
  const lokasiInfo = [kel, kec, kota].filter(Boolean).join(', ');

  const msg = [
    `*━━━━━━━━━━━━━━━━━━━━━━━━━━*`,
    `*🏛️ BUKTI PEMBAYARAN IURAN TP PKK*`,
    `*${profil.namaRT.toUpperCase()} / ${profil.namaRW.toUpperCase()}*`,
    lokasiInfo ? `_${lokasiInfo}_` : '',
    `*━━━━━━━━━━━━━━━━━━━━━━━━━━*`,
    ``,
    `Assalamu'alaikum Wr. Wb. / Salam Sejahtera,`,
    `Kepada Yth. *Ibu ${namaPenerimaIuran}*`,
    `(${jabatan}${dasawisma ? ` - ${dasawisma}` : ''})`,
    ``,
    `Berikut adalah bukti pelunasan iuran rutin anggota PKK:`,
    ``,
    `📄 *No. Kwitansi* : \`${nomorKwitansi}\``,
    `📅 *Tanggal Bayar*: ${tglFormatted}`,
    `🗓️ *Periode Iuran*: *Bulan ${daftarBulanNama} ${tahun}* (${sortedBulan.length} Bulan)`,
    `💵 *Tarif / Bulan*: Rp ${nominalPerBulan.toLocaleString('id-ID')}`,
    `💰 *TOTAL DIBAYAR*: *Rp ${totalNominal.toLocaleString('id-ID')}*`,
    `📝 *Terbilang*    : _${terbilang}_`,
    `💳 *Metode Bayar* : ${metodeBayar}`,
    `✅ *Status*       : *LUNAS*`,
    catatan ? `📌 *Catatan*      : ${catatan}` : '',
    ``,
    `*━━━━━━━━━━━━━━━━━━━━━━━━━━*`,
    `Terima kasih atas partisipasi aktif dan ketertiban Ibu dalam pembayaran iuran rutin ini demi kelancaran program kerja dan kegiatan TP PKK ${kopRT}.`,
    ``,
    `Semoga senantiasa diberikan keberkahan, kesehatan, dan kelapangan rezeki. Aamiin. 🤲✨`,
    ``,
    `Hormat kami,`,
    `*Bendahara TP PKK ${profil.namaRT}*`,
    `*( ${namaBendahara || profil.namaBendahara || 'Bendahara'} )*`,
    `_Pesan ini dikirim otomatis melalui Sistem Informasi Administrasi TP PKK_`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');

  return msg;
}

/**
 * Buat URL link WhatsApp langsung (bisa dibuka di browser, aplikasi WA, atau WA Web)
 */
export function getWhatsAppDirectUrl(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
