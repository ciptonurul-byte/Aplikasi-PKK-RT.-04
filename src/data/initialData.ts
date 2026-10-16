import {
  AnggotaPKK,
  KeluargaDasawisma,
  KegiatanPKK,
  TanamanToga,
  TransaksiKas,
  RekapIuranAnggota,
  SuratDinasPKK,
  ProfilPKKRT,
  UserAccount,
} from '../types/pkk';

export const initialProfilPKK: ProfilPKKRT = {
  namaRT: 'RT 01',
  namaRW: 'RW 01',
  namaKelurahan: '',
  namaKecamatan: '',
  namaKota: '',
  provinsi: '',
  alamatSekretariat: '',
  namaKetua: '',
  namaSekretaris: '',
  namaBendahara: '',
  iuranBulananNominal: 10000,
  tahunKepengurusan: '2024 - 2029',
};

export const initialAnggota: AnggotaPKK[] = [];

export const initialKeluargaDasawisma: KeluargaDasawisma[] = [];

export const initialKegiatan: KegiatanPKK[] = [];

export const initialTanamanToga: TanamanToga[] = [];

export const initialTransaksiKas: TransaksiKas[] = [];

export const initialRekapIuran: RekapIuranAnggota[] = [];

export const initialSuratPKK: SuratDinasPKK[] = [];

export const initialUserAccounts: UserAccount[] = [
  {
    username: 'ketua',
    password: 'ketua123',
    role: 'Ketua TP PKK',
    namaDefault: 'Ketua TP PKK',
    deskripsi: 'Penanggung jawab umum, validasi naskah dinas, SK & disposisi kebijakan program kerja.',
    avatarColor: 'from-emerald-500 to-teal-700',
  },
  {
    username: 'sekretaris',
    password: 'sekretaris123',
    role: 'Sekretaris',
    namaDefault: 'Sekretaris TP PKK',
    deskripsi: 'Pengelola tata naskah dinas, notulensi rapat, Buku 1-6 wajib, generator surat AI, & sensus dasawisma.',
    avatarColor: 'from-blue-500 to-indigo-700',
  },
  {
    username: 'bendahara',
    password: 'bendahara123',
    role: 'Bendahara',
    namaDefault: 'Bendahara TP PKK',
    deskripsi: 'Pengelola Buku Kas Umum, swadaya warga, iuran rutin bulanan, pembukuan UP2K PKK & SPJ.',
    avatarColor: 'from-amber-500 to-orange-700',
  },
  {
    username: 'kader',
    password: 'kader123',
    role: 'Kader Dasawisma',
    namaDefault: 'Kader Dasawisma Flamboyan',
    deskripsi: 'Pendataan keluarga dasawisma, sensus kesehatan balita/lansia, sanitasi, dan tanaman TOGA RT.',
    avatarColor: 'from-rose-500 to-pink-700',
  },
];
