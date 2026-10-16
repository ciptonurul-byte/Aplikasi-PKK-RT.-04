import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Sparkles,
  Printer,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Calendar,
  Sprout,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldCheck,
  User,
  Cloud,
  Smartphone,
} from 'lucide-react';
import { usePKK, UserRole } from '../../context/PKKContext';
import { AppView } from '../../types/pkk';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface TopbarProps {
  onToggleSidebarMobile: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebarMobile }) => {
  const {
    currentView,
    setCurrentView,
    userRole,
    setUserRole,
    isDarkMode,
    toggleDarkMode,
    searchGlobal,
    setSearchGlobal,
    notifications,
    profil,
    currentUser,
    logout,
    setIsCloudModalOpen,
    cloudSyncStatus,
  } = usePKK();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const viewTitles: Record<AppView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Administrasi & Giat PKK',
      subtitle: `Sistem Informasi Manajemen PKK ${profil.namaRT} / ${profil.namaRW}`,
    },
    anggota: {
      title: 'Data Anggota & Kader Pengurus',
      subtitle: 'Buku I: Daftar Anggota TP PKK dan Kader Dasawisma',
    },
    dasawisma: {
      title: 'Data Catatan Keluarga & Dasawisma',
      subtitle: 'Pemetaan Keluarga, Indikator Rumah Sehat & Gizi Balita/Lansia',
    },
    'anggota-keluarga': {
      title: 'Daftar Nama Anggota Keluarga Lengkap',
      subtitle: 'Sensus Individu Warga Terpadu (KK, Dasawisma, Sasaran Posyandu & Kader PKK)',
    },
    kegiatan: {
      title: 'Agenda & Laporan Giat PKK',
      subtitle: 'Buku V: Jadwal Pertemuan, Posyandu, Pelatihan & Notulensi',
    },
    toga: {
      title: 'Inventaris TOGA & HATINYA PKK',
      subtitle: 'Halaman Asri, Teratur, Indah dan Nyaman (Tanaman Obat Keluarga)',
    },
    keuangan: {
      title: 'Buku Kas & Iuran Warga',
      subtitle: 'Buku III: Buku Kas Umum, Swadaya, UP2K & Rekap Iuran Rutin',
    },
    'surat-ai': {
      title: 'Generator Konsep Surat AI & Notula',
      subtitle: 'Buku VI: Tata Naskah Dinas PKK, Undangan, Berita Acara & Sobat PKK',
    },
    'buku-wajib': {
      title: '6 Buku Wajib Administrasi PKK',
      subtitle: 'Kompilasi Standar Baku Administrasi PKK Sesuai Rakernas TP PKK',
    },
    laporan: {
      title: 'Pusat Laporan & Ekspor Berkas PKK',
      subtitle: 'Unduh Rekapitulasi Tahunan Lengkap & 6 Buku Wajib Format PDF, Excel, dan Word',
    },
    pengaturan: {
      title: 'Pengaturan Wilayah & Akun',
      subtitle: 'Konfigurasi Profil Sekretariat, Backup & Pemulihan Data',
    },
  };

  const currentInfo = viewTitles[currentView] || viewTitles.dashboard;

  const roles: UserRole[] = ['Ketua TP PKK', 'Sekretaris', 'Bendahara', 'Kader Dasawisma'];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar-mobile"
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2">
              <span>{currentInfo.title}</span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Global Search, Quick Action, Role Selector, Dark Mode, Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Bar */}
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-global-search"
              placeholder="Cari anggota, KK, kegiatan..."
              value={searchGlobal || ''}
              onChange={(e) => setSearchGlobal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* Quick Action: Buat Surat AI */}
          <button
            id="btn-topbar-surat-ai"
            onClick={() => setCurrentView('surat-ai')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Surat AI</span>
          </button>

          {/* Cloud Firebase & HP Access Button */}
          <button
            id="btn-topbar-cloud-sync"
            onClick={() => setIsCloudModalOpen(true)}
            title="Penyimpanan Cloud Firebase & Tautan Akses HP"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Cloud & HP</span>
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </button>

          {/* Print Button */}
          <button
            id="btn-topbar-print"
            onClick={() => window.print()}
            title="Cetak Halaman Ini"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="btn-toggle-dark-mode"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-toggle"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Notifikasi & Pengingat Giat
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {notifications.length} Info
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkView) setCurrentView(n.linkView);
                        setShowNotifDropdown(false);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {n.linkView === 'kegiatan' ? (
                          <Calendar className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                        ) : n.linkView === 'toga' ? (
                          <Sprout className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {n.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role & Account Profile Switcher */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                {userRole.slice(0, 1)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold leading-none">{userRole}</span>
                <span className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                  {currentUser ? `@${currentUser.username}` : 'Aktif'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800">
                {/* User Active Summary Header */}
                <div className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {userRole.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser?.displayName || userRole}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                        {userRole} • <code className="font-mono">@{currentUser?.username || 'user'}</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ubah Kata Sandi Akun</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};
