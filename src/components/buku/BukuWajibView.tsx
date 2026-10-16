import React, { useState } from 'react';
import {
  BookOpenCheck,
  Users,
  Mail,
  Wallet,
  FileText,
  Package,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Printer,
  Download,
  Info,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { Badge } from '../common/Badge';
import { printBukuWajibLengkap } from '../../utils/printHelper';

export const BukuWajibView: React.FC = () => {
  const {
    profil,
    anggotaList,
    keluargaList,
    transaksiList,
    kegiatanList,
    togaList,
    setCurrentView,
  } = usePKK();

  const [selectedBuku, setSelectedBuku] = useState<number>(1);

  const bukuList = [
    {
      id: 1,
      no: 'Buku I',
      nama: 'Buku Daftar Anggota TP PKK & Kader',
      deskripsi: 'Mencatat susunan nama pengurus, NIK, jabatan, Pokja, alamat, dan keaktifan kader.',
      status: `${anggotaList.length} Terdata`,
      icon: Users,
      color: 'emerald',
      targetView: 'anggota' as const,
      panduan:
        'Diisi oleh Sekretaris PKK. Memuat data pengurus TP PKK RT, Pokja I s/d IV, serta Kader Dasawisma yang aktif membina keluarga binaan.',
    },
    {
      id: 2,
      no: 'Buku II',
      nama: 'Buku Agenda Surat Masuk & Surat Keluar',
      deskripsi: 'Mencatat registrasi korespondensi, undangan, edaran, dan disposisi pimpinan.',
      status: 'Terintegrasi AI',
      icon: Mail,
      color: 'purple',
      targetView: 'surat-ai' as const,
      panduan:
        'Diisi oleh Sekretaris PKK secara kronologis setiap ada surat resmi yang masuk dari Kelurahan/RW atau surat undangan keluar.',
    },
    {
      id: 3,
      no: 'Buku III',
      nama: 'Buku Keuangan & Kas Umum PKK',
      deskripsi: 'Mencatat seluruh arus debit dan kredit penerimaan iuran warga, jimpitan, serta belanja kegiatan.',
      status: `${transaksiList.length} Transaksi`,
      icon: Wallet,
      color: 'amber',
      targetView: 'keuangan' as const,
      panduan:
        'Diisi oleh Bendahara PKK. Setiap transaksi wajib disertai bukti kuitansi/nota dan ditutup saldonya setiap akhir bulan/pertemuan.',
    },
    {
      id: 4,
      no: 'Buku IV',
      nama: 'Buku Notulen Rapat & Keputusan',
      deskripsi: 'Mencatat jalannya rapat pengurus, notula materi pembicaraan, dan kesepakatan mufakat.',
      status: 'Format Baku',
      icon: FileText,
      color: 'blue',
      targetView: 'kegiatan' as const,
      panduan:
        'Mencatat hari, tanggal, pimpinan rapat, jumlah hadir, susunan acara, kesimpulan/keputusan, dan ditandatangani oleh pembuat notula serta Ketua.',
    },
    {
      id: 5,
      no: 'Buku V',
      nama: 'Buku Inventaris & Aset PKK (TOGA & Barang)',
      deskripsi: 'Mencatat barang inventaris milik TP PKK (toga, seragam, perlengkapan posyandu, alat masak).',
      status: `${togaList.length} Varietas TOGA`,
      icon: Package,
      color: 'emerald',
      targetView: 'toga' as const,
      panduan:
        'Mencatat asal-usul perolehan barang (swadaya/bantuan), jumlah, kondisi barang (baik/rusak), serta tanaman obat pekarangan RT.',
    },
    {
      id: 6,
      no: 'Buku VI',
      nama: 'Buku Catatan Kegiatan TP PKK',
      deskripsi: 'Mencatat rekapitulasi giat operasional 10 Program Pokok PKK dan program kerja tahunan.',
      status: `${kegiatanList.length} Giat Tercatat`,
      icon: CalendarDays,
      color: 'rose',
      targetView: 'kegiatan' as const,
      panduan:
        'Merangkum pelaksanaan kegiatan nyata yang dilaksanakan oleh masing-masing Pokja di lingkungan masyarakat.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              6 Buku Wajib Administrasi TP PKK
            </h2>
            <Badge variant="emerald" size="sm">
              Standar Baku Rakernas TP PKK
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pedoman administrasi kelengkapan pembukuan wajib Sekretariat dan Bendahara TP PKK {profil.namaRT}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              printBukuWajibLengkap(selectedBuku, profil, {
                anggotaList,
                kegiatanList,
                transaksiKas: transaksiList,
                dasawismaList: keluargaList,
              })
            }
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Buku (Buku {selectedBuku})</span>
          </button>
        </div>
      </div>

      {/* Grid of 6 Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bukuList.map((buku) => {
          const Icon = buku.icon;
          const isSelected = selectedBuku === buku.id;

          return (
            <div
              key={buku.id}
              onClick={() => setSelectedBuku(buku.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-lg">
                    {buku.no}
                  </span>
                  <Badge variant="emerald" size="sm">
                    {buku.status}
                  </Badge>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {buku.nama}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {buku.deskripsi}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView(buku.targetView);
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Buka Modul</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Book Guidance Detail */}
      {selectedBuku && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Petunjuk Teknis Pengisian {bukuList.find((b) => b.id === selectedBuku)?.no}:{' '}
              {bukuList.find((b) => b.id === selectedBuku)?.nama}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {bukuList.find((b) => b.id === selectedBuku)?.panduan}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => {
                const target = bukuList.find((b) => b.id === selectedBuku)?.targetView;
                if (target) setCurrentView(target);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Kelola Data {bukuList.find((b) => b.id === selectedBuku)?.no} Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
