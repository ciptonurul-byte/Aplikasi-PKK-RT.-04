export type JabatanPKK =
  | 'Ketua TP PKK RT'
  | 'Wakil Ketua'
  | 'Sekretaris'
  | 'Wakil Sekretaris'
  | 'Bendahara'
  | 'Wakil Bendahara'
  | 'Ketua Pokja I'
  | 'Ketua Pokja II'
  | 'Ketua Pokja III'
  | 'Ketua Pokja IV'
  | 'Kader Dasawisma'
  | 'Kader Posyandu'
  | 'Anggota Pokja';

export type PokjaType = 'Sekretariat' | 'Pokja I' | 'Pokja II' | 'Pokja III' | 'Pokja IV' | 'Umum';

export interface AnggotaKeluargaKK {
  id?: string;
  nama: string;
  nik: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir?: string;
  tanggalLahir?: string;
  usia?: number;
  agama?: string;
  pendidikan?: string;
  jenisPekerjaan?: string;
  statusPernikahan?: string;
  statusHubungan: string; // KEPALA KELUARGA, ISTRI, ANAK, ORANG TUA, MERTUA, FAMILI LAIN
  kewarganegaraan?: string;
  namaAyah?: string;
  namaIbu?: string;
  kategoriSasaran?: 'Balita' | 'Anak/Sekolah' | 'Remaja' | 'WUS' | 'PUS' | 'Ibu Hamil' | 'Lansia' | 'Umum';
  noHp?: string;
  catatan?: string;
}

export interface AnggotaKeluargaTerpadu extends AnggotaKeluargaKK {
  id: string;
  keluargaId: string;
  noKk: string;
  namaKepalaKeluarga: string;
  namaIbuKeluarga: string;
  dasawisma: DasawismaName;
  alamat: string;
  kategoriSejahtera: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
  statusRumahSehat: boolean;
  // Integrasi dengan Data Anggota/Kader PKK & Iuran
  isAnggotaPKK: boolean;
  anggotaPKKId?: string;
  jabatanPKK?: JabatanPKK;
  pokjaPKK?: PokjaType;
  statusKeaktifanPKK?: 'Aktif' | 'Cuti' | 'Non-Aktif';
  iuranLunasCount?: number;
}

export interface KartuKeluargaData {
  noKk: string;
  namaKepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos?: string;
  jumlahAnggotaKeluarga: number;
  jumlahLakiLaki: number;
  jumlahPerempuan: number;
  jumlahBalita: number;
  jumlahIbuHamil: number;
  jumlahLansia: number;
  statusPUS: boolean;
  statusWUS: boolean;
  namaIbu?: string;
  noHpIbu?: string;
  anggotaKeluarga: AnggotaKeluargaKK[];
  catatan?: string;
}

export interface AnggotaPKK {
  id: string;
  nik: string;
  nama: string;
  noHp: string;
  alamat: string;
  rt: string;
  rw: string;
  jabatan: JabatanPKK;
  pokja: PokjaType;
  status: 'Aktif' | 'Cuti' | 'Non-Aktif';
  tanggalBergabung: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  pekerjaan?: string;
  pendidikanTerakhir?: string;
  pelatihanDiikuti?: string[];
  avatar?: string;
  catatan?: string;
  // Metadata Data Keluarga / KK
  noKk?: string;
  namaKepalaKeluarga?: string;
  statusKeluarga?: string;
  anggotaKeluarga?: AnggotaKeluargaKK[];
}

export type DasawismaName =
  | 'Dasawisma Flamboyan 9'
  | 'Dasawisma Flamboyan 10'
  | 'Dasawisma Flamboyan 11';

export const DASAWISMA_LIST: DasawismaName[] = [
  'Dasawisma Flamboyan 9',
  'Dasawisma Flamboyan 10',
  'Dasawisma Flamboyan 11',
];

export interface KeluargaDasawisma {
  id: string;
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
  statusPUS: boolean; // Pasangan Usia Subur
  statusWUS: boolean; // Wanita Usia Subur
  statusRumahSehat: boolean;
  memilikiJambanSehat: boolean;
  memilikiSPAL: boolean; // Saluran Pembuangan Air Limbah
  memilikiTempatSampah: boolean;
  memilikiSumberAirBersih: boolean;
  memilikiPekaranganToga: boolean;
  makananPokok: 'Beras' | 'Non-Beras' | 'Campuran';
  kategoriSejahtera: 'Pra Sejahtera' | 'Sejahtera I' | 'Sejahtera II' | 'Sejahtera III';
  catatanKesehatan?: string;
  anggotaKeluarga?: AnggotaKeluargaKK[];
  terakhirDiperbarui: string;
}

export type StatusKegiatan = 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai' | 'Dibatalkan';

export interface KegiatanPKK {
  id: string;
  namaKegiatan: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  pokjaPengampu: PokjaType;
  programPokok: string; // misal: "Pendidikan dan Keterampilan", "Kesehatan", dsb.
  status: StatusKegiatan;
  targetPeserta: number;
  pesertaHadir: number;
  anggaranRencana: number;
  anggaranRealisasi: number;
  deskripsi: string;
  notulensi?: string;
  dokumentasiUrl?: string;
  penanggungJawab: string;
}

export type KategoriToga = 'Rimpang & Umbi' | 'Daun & Herbal' | 'Batang & Kulit' | 'Buah & Biji' | 'Bunga';

export interface TanamanToga {
  id: string;
  namaTanaman: string;
  namaLatin: string;
  kategori: KategoriToga;
  khasiat: string;
  caraPemanfaatan: string;
  jumlahPolybag: number;
  lokasiDasawisma: DasawismaName | 'Pekarangan HATINYA PKK RT';
  tanggalTanam: string;
  statusPanen: 'Masa Pertumbuhan' | 'Siap Panen' | 'Telah Dipanen';
  hasilPanenKg?: number;
  penanggungJawab: string;
  catatan?: string;
}

export type JenisKas = 'Masuk' | 'Keluar';

export type KategoriKas =
  | 'Iuran Rutin Anggota'
  | 'Dana Swadaya Warga'
  | 'Bantuan RW / Kelurahan'
  | 'Hasil Usaha UP2K'
  | 'Konsumsi & Logistik Pertemuan'
  | 'Operasional Posyandu & PMT'
  | 'Pengadaan Bibit TOGA & Pupuk'
  | 'ATK & Administrasi Buku 6'
  | 'Perlengkapan & Kebersihan'
  | 'Sosial & Santunan Warga'
  | 'Lain-lain';

export interface TransaksiKas {
  id: string;
  tanggal: string;
  jenis: JenisKas;
  kategori: KategoriKas;
  jumlah: number;
  keterangan: string;
  penanggungJawab: string;
  noBukti?: string;
}

export interface IuranBulanStatus {
  lunas: boolean;
  nominal: number;
  tanggalBayar?: string;
  metodeBayar?: 'Tunai' | 'Transfer';
  catatan?: string;
}

export interface RekapIuranAnggota {
  anggotaId: string;
  namaAnggota: string;
  jabatan: string;
  dasawisma?: string;
  noHp?: string;
  tahun: number;
  bulan: {
    [bulanKey: number]: IuranBulanStatus; // 1 to 12
  };
}

export interface SuratDinasPKK {
  id: string;
  nomorSurat: string;
  jenisSurat: string;
  perihal: string;
  tujuan: string;
  tanggalSurat: string;
  waktuKegiatan?: string;
  tempatKegiatan?: string;
  agendaKegiatan?: string;
  pokjaPengirim: PokjaType;
  isiSurat: string;
  status: 'Draft' | 'Final / Siap Cetak' | 'Terkirim';
  namaKetua: string;
  namaSekretaris: string;
  dibuatTanggal: string;
}

export interface ProfilPKKRT {
  namaRT: string;
  namaRW: string;
  namaKelurahan: string;
  namaKecamatan: string;
  namaKota: string;
  provinsi: string;
  alamatSekretariat: string;
  namaKetua: string;
  namaSekretaris: string;
  namaBendahara: string;
  iuranBulananNominal: number;
  tahunKepengurusan: string;
  logoUrl?: string;
}

export type AppView =
  | 'dashboard'
  | 'anggota'
  | 'dasawisma'
  | 'anggota-keluarga'
  | 'kegiatan'
  | 'toga'
  | 'keuangan'
  | 'surat-ai'
  | 'buku-wajib'
  | 'laporan'
  | 'pengaturan';

export type UserRole = 'Ketua TP PKK' | 'Sekretaris' | 'Bendahara' | 'Kader Dasawisma';

export interface UserAccount {
  username: string;
  password: string;
  role: UserRole;
  namaDefault: string;
  deskripsi: string;
  avatarColor: string;
  lastLogin?: string;
  lastPasswordChange?: string;
}

export interface AuthSession {
  username: string;
  role: UserRole;
  displayName: string;
  loginAt: string;
}
