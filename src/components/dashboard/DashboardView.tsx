import React, { useState, useMemo } from 'react';
import {
  Users,
  Home,
  Wallet,
  Sprout,
  Calendar,
  Sparkles,
  ArrowUpRight,
  HeartHandshake,
  BookOpen,
  Apple,
  Activity,
  Plus,
  FileText,
  FileSpreadsheet,
  DollarSign,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { usePKK } from '../../context/PKKContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { LOGO_PKK_BASE64 } from '../../assets/logoPKK';

export const DashboardView: React.FC = () => {
  const {
    profil,
    anggotaList,
    keluargaList,
    kegiatanList,
    togaList,
    transaksiList,
    saldoKas,
    totalKasMasuk,
    totalKasKeluar,
    totalJiwaDasawisma,
    totalLakiLaki,
    totalPerempuan,
    totalBalita,
    totalIbuHamil,
    totalLansia,
    persentaseRumahSehat,
    totalPolybagToga,
    togaSiapPanenCount,
    setCurrentView,
  } = usePKK();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Financial Chart Data (Summary of Kas Masuk vs Keluar per Bulan dynamically from transaksiList)
  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonthIdx = new Date().getMonth();
    return months.slice(0, Math.max(5, currentMonthIdx + 1)).map((bulan, idx) => {
      const monthNum = idx + 1;
      const monthTx = transaksiList.filter((t) => {
        if (!t.tanggal) return false;
        const d = new Date(t.tanggal);
        return d.getMonth() + 1 === monthNum;
      });
      const masuk = monthTx.filter((t) => t.jenis === 'Masuk').reduce((sum, t) => sum + t.jumlah, 0);
      const keluar = monthTx.filter((t) => t.jenis === 'Keluar').reduce((sum, t) => sum + t.jumlah, 0);
      return { bulan, Masuk: masuk, Keluar: keluar };
    });
  }, [transaksiList]);

  // Healthy Home & Dasawisma Pie Data
  const rumahSehatCount = keluargaList.filter((k) => k.statusRumahSehat).length;
  const rumahBelumSehatCount = keluargaList.length - rumahSehatCount;

  const dasawismaChartData = [
    { name: 'Rumah Sehat Memenuhi Standar', value: rumahSehatCount || (keluargaList.length === 0 ? 0 : 0), color: '#10b981' },
    { name: 'Perlu Pembenahan Sanitasi/SPAL', value: rumahBelumSehatCount || (keluargaList.length === 0 ? 0 : 0), color: '#f59e0b' },
  ];

  const upcomingKegiatan = kegiatanList
    .filter((k) => k.status === 'Akan Datang')
    .slice(0, 3);

  const pokja1Lead = anggotaList.find((a) => a.pokja === 'Pokja I' && a.jabatan.includes('Ketua'))?.nama || anggotaList.find((a) => a.pokja === 'Pokja I')?.nama || 'Belum diatur';
  const pokja2Lead = anggotaList.find((a) => a.pokja === 'Pokja II' && a.jabatan.includes('Ketua'))?.nama || anggotaList.find((a) => a.pokja === 'Pokja II')?.nama || 'Belum diatur';
  const pokja3Lead = anggotaList.find((a) => a.pokja === 'Pokja III' && a.jabatan.includes('Ketua'))?.nama || anggotaList.find((a) => a.pokja === 'Pokja III')?.nama || 'Belum diatur';
  const pokja4Lead = anggotaList.find((a) => a.pokja === 'Pokja IV' && a.jabatan.includes('Ketua'))?.nama || anggotaList.find((a) => a.pokja === 'Pokja IV')?.nama || 'Belum diatur';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleGenerateAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const summaryPayload = {
        rt: profil.namaRT,
        keluargaCount: keluargaList.length,
        totalJiwa: totalJiwaDasawisma,
        balitaCount: totalBalita,
        ibuHamilCount: totalIbuHamil,
        lansiaCount: totalLansia,
        rumahSehatPct: persentaseRumahSehat,
        totalToga: totalPolybagToga,
        saldoKas: saldoKas,
      };

      const res = await fetch('/api/ai/analisis-dasawisma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData: summaryPayload }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data.recommendations) {
        setAiAnalysis(data.recommendations.join('\n\n'));
      }
    } catch (e) {
      console.error(e);
      setAiAnalysis(
        'Rekomendasi Pokja:\n1. Pokja I: Perkuat sosialisasi pencegahan KDRT dan pembinaan remaja.\n2. Pokja II: Tingkatkan kemandirian ekonomi UP2K berbahan hasil panen pekarangan.\n3. Pokja III: Maksimalkan pekarangan HATINYA PKK dan budidaya TOGA.\n4. Pokja IV: Pantau gizi balita dan kesehatan lansia melalui posyandu terpadu.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-sky-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 max-w-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl flex items-center justify-center shrink-0 border-2 border-emerald-300/40">
              <img
                src={profil.logoUrl || LOGO_PKK_BASE64}
                alt="Logo PKK Resmi"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Sistem Informasi e-PKK {profil.namaRT} Terpadu</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Selamat Datang di Portal TP PKK {profil.namaRT}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
                Mewujudkan keluarga yang berdaya, mandiri, dan sejahtera melalui pelaksanaan 10
                Program Pokok PKK, pendataan Dasawisma terintegrasi, dan keasrian HATINYA PKK.
              </p>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-quick-laporan"
              onClick={() => setCurrentView('laporan')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Cetak & Ekspor Laporan</span>
            </button>
            <button
              id="btn-quick-surat-ai"
              onClick={() => setCurrentView('surat-ai')}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Buat Surat AI</span>
            </button>
            <button
              id="btn-quick-kegiatan"
              onClick={() => setCurrentView('kegiatan')}
              className="px-4 py-2.5 bg-emerald-600/60 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda Giat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-anggota"
          title="Anggota & Kader PKK"
          value={`${anggotaList.length} Orang`}
          subtitle={`${anggotaList.filter((a) => a.status === 'Aktif').length} Kader Aktif`}
          icon={Users}
          color="emerald"
          trend={{ value: '100% Terdaftar', isPositive: true }}
          onClick={() => setCurrentView('anggota')}
        />

        <StatCard
          id="stat-dasawisma"
          title="Keluarga Dasawisma"
          value={`${keluargaList.length} KK (${totalJiwaDasawisma} Jiwa)`}
          subtitle={`${totalLakiLaki} L • ${totalPerempuan} P | ${totalBalita} Balita • ${totalIbuHamil} Bumil • ${totalLansia} Lansia`}
          icon={Home}
          color="blue"
          trend={{ value: `${persentaseRumahSehat}% Rumah Sehat`, isPositive: true }}
          onClick={() => setCurrentView('dasawisma')}
        />

        <StatCard
          id="stat-saldo-kas"
          title="Saldo Kas PKK"
          value={formatCurrency(saldoKas)}
          subtitle={`Masuk: ${formatCurrency(totalKasMasuk)}`}
          icon={Wallet}
          color="amber"
          trend={{ value: `+${formatCurrency(totalKasMasuk - totalKasKeluar)}`, isPositive: true }}
          onClick={() => setCurrentView('keuangan')}
        />

        <StatCard
          id="stat-toga"
          title="Inventaris TOGA"
          value={`${totalPolybagToga} Polybag`}
          subtitle={`${togaSiapPanenCount} Varietas Siap Panen`}
          icon={Sprout}
          color="emerald"
          trend={{ value: 'HATINYA PKK', isPositive: true }}
          onClick={() => setCurrentView('toga')}
        />
      </div>

      {/* 4 POKJA Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cakupan 4 Kelompok Kerja (POKJA) PKK
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pelaksanaan 10 Program Pokok PKK di Wilayah {profil.namaRT}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* POKJA I */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <Badge variant="purple" size="sm">
                POKJA I
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pancasila & Gotong Royong
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Pola Asuh Anak & Remaja (PAAR), Pencegahan KDRT, dan Kerukunan Warga.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[130px]" title={pokja1Lead}>PJ: {pokja1Lead}</span>
              <span className="font-semibold text-purple-600">
                {anggotaList.filter((a) => a.pokja === 'Pokja I').length} Kader
              </span>
            </div>
          </div>

          {/* POKJA II */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <Badge variant="blue" size="sm">
                POKJA II
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pendidikan & UP2K PKK
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Keterampilan keluarga, BKB (Bina Keluarga Balita), dan Usaha Jamu Herbal UP2K.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[130px]" title={pokja2Lead}>PJ: {pokja2Lead}</span>
              <span className="font-semibold text-sky-600">
                {anggotaList.filter((a) => a.pokja === 'Pokja II').length} Kader
              </span>
            </div>
          </div>

          {/* POKJA III */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Apple className="w-5 h-5" />
              </div>
              <Badge variant="emerald" size="sm">
                POKJA III
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pangan & HATINYA PKK
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Pemanfaatan pekarangan, TOGA, B2SA (Beragam Bergizi Seimbang & Aman).
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[130px]" title={pokja3Lead}>PJ: {pokja3Lead}</span>
              <span className="font-semibold text-emerald-600">{totalPolybagToga} Pot TOGA</span>
            </div>
          </div>

          {/* POKJA IV */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Activity className="w-5 h-5" />
              </div>
              <Badge variant="rose" size="sm">
                POKJA IV
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Kesehatan & Perencanaan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Posyandu Balita/Lansia, Pencegahan Stunting, PHBS & Lingkungan Hidup.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[130px]" title={pokja4Lead}>PJ: {pokja4Lead}</span>
              <span className="font-semibold text-rose-600">{totalBalita} Balita Sehat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Cashflow Chart */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Grafik Arus Kas & Iuran Rutin PKK (2026)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan Kas Masuk vs Kas Keluar bulanan
              </p>
            </div>
            <button
              id="btn-goto-keuangan"
              onClick={() => setCurrentView('keuangan')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Detail Kas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Masuk" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Keluar" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Dasawisma Rumah Sehat Donut Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Status Rumah Sehat Dasawisma
              </h3>
              <Badge variant="emerald" size="sm">
                {persentaseRumahSehat}%
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Indikator Jamban Sehat, SPAL, Sumber Air & Tempat Sampah
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dasawismaChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dasawismaChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Rumah Sehat</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {rumahSehatCount} KK
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Perlu Pembenahan</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {rumahBelumSehatCount} KK
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Advisory & Upcoming Kegiatan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Program Advisor */}
        <div className="lg:col-span-2 p-5 bg-gradient-to-br from-emerald-50/50 via-sky-50/30 to-purple-50/40 dark:from-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Analisis & Rekomendasi Program PKK Berbasis AI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konsultasi pintar berdasarkan data riil Dasawisma, Balita, dan TOGA RT
                </p>
              </div>
            </div>

            <button
              id="btn-refresh-ai-analysis"
              onClick={handleGenerateAiAnalysis}
              disabled={loadingAi}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              <span>{loadingAi ? 'Menganalisis...' : 'Analisis AI'}</span>
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-emerald-100 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
            {aiAnalysis ? (
              aiAnalysis
            ) : keluargaList.length === 0 && anggotaList.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Data PKK masih kosong.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mulai dengan mendaftarkan pengurus & kader pada menu Anggota, mencatat warga di menu Dasawisma, atau mencatat kas di menu Keuangan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  💡 Ringkasan Analisis Cepat Dasawisma {profil.namaRT}:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Pokja I:</strong> {keluargaList.length} KK terdata siap mengikuti sosialisasi pola asuh anak & pengajian rutin.
                  </li>
                  <li>
                    <strong>Pokja II:</strong> Potensi budidaya TOGA pekarangan ({totalPolybagToga} polybag) dapat dikembangkan menjadi produk olahan UP2K.
                  </li>
                  <li>
                    <strong>Pokja III:</strong> {togaList.length} varietas TOGA terdata dengan {persentaseRumahSehat}% rumah sehat memenuhi standar sanitasi.
                  </li>
                  <li>
                    <strong>Pokja IV:</strong> Terdapat {totalBalita} balita dan {totalIbuHamil} ibu hamil yang dipantau melalui Posyandu terpadu.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming Agenda List */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Agenda Giat PKK Mendatang
            </h3>
            <button
              id="btn-dashboard-all-kegiatan"
              onClick={() => setCurrentView('kegiatan')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Semua
            </button>
          </div>

          <div className="space-y-3">
            {upcomingKegiatan.length === 0 ? (
              <div className="text-center py-6 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Belum ada agenda kegiatan mendatang
                </p>
                <button
                  onClick={() => setCurrentView('kegiatan')}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  + Tambah Kegiatan
                </button>
              </div>
            ) : (
              upcomingKegiatan.map((kgt) => (
                <div
                  key={kgt.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {kgt.namaKegiatan}
                    </h4>
                    <Badge variant="blue" size="sm">
                      {kgt.pokjaPengampu}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {kgt.tanggal} • {kgt.waktuMulai} WIB
                    </span>
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                    <span className="truncate max-w-[140px]">{kgt.lokasi}</span>
                    <button
                      onClick={() => setCurrentView('surat-ai')}
                      className="text-emerald-600 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      Surat Undangan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
