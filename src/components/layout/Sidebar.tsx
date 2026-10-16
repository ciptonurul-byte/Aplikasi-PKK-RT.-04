import React from 'react';
import {
  LayoutDashboard,
  Users,
  Home,
  CalendarDays,
  Sprout,
  Wallet,
  FileText,
  BookOpenCheck,
  FileSpreadsheet,
  Settings,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  LogOut,
  UsersRound,
  Cloud,
  Smartphone,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { AppView } from '../../types/pkk';
import { LOGO_PKK_BASE64 } from '../../assets/logoPKK';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    profil,
    userRole,
    anggotaList,
    keluargaList,
    semuaAnggotaKeluarga,
    togaSiapPanenCount,
    kegiatanList,
    currentUser,
    logout,
    setIsCloudModalOpen,
    cloudSyncStatus,
  } = usePKK();

  const upcomingKegiatanCount = kegiatanList.filter((k) => k.status === 'Akan Datang').length;

  const navItems: {
    id: AppView;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: 'emerald' | 'amber' | 'blue' | 'purple';
    category?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      category: 'MENU UTAMA',
    },
    {
      id: 'anggota',
      label: 'Data Anggota & Kader',
      icon: Users,
      badge: anggotaList.length,
      badgeColor: 'emerald',
      category: 'DATA & POKJA',
    },
    {
      id: 'dasawisma',
      label: 'Keluarga & Dasawisma',
      icon: Home,
      badge: `${keluargaList.length} KK`,
      badgeColor: 'blue',
      category: 'DATA & POKJA',
    },
    {
      id: 'anggota-keluarga',
      label: 'Daftar Anggota Keluarga',
      icon: UsersRound,
      badge: `${semuaAnggotaKeluarga.length} Jiwa`,
      badgeColor: 'emerald',
      category: 'DATA & POKJA',
    },
    {
      id: 'kegiatan',
      label: 'Agenda & Giat PKK',
      icon: CalendarDays,
      badge: upcomingKegiatanCount > 0 ? upcomingKegiatanCount : undefined,
      badgeColor: 'amber',
      category: 'DATA & POKJA',
    },
    {
      id: 'toga',
      label: 'HATINYA PKK & TOGA',
      icon: Sprout,
      badge: togaSiapPanenCount > 0 ? `${togaSiapPanenCount} Panen` : undefined,
      badgeColor: 'emerald',
      category: 'DATA & POKJA',
    },
    {
      id: 'keuangan',
      label: 'Iuran & Laporan Kas',
      icon: Wallet,
      category: 'ADMINISTRASI',
    },
    {
      id: 'surat-ai',
      label: 'Konsep Surat AI & Notula',
      icon: FileText,
      badge: 'AI Smart',
      badgeColor: 'purple',
      category: 'ADMINISTRASI',
    },
    {
      id: 'buku-wajib',
      label: 'Buku 6 Wajib PKK',
      icon: BookOpenCheck,
      category: 'ADMINISTRASI',
    },
    {
      id: 'laporan',
      label: 'Pusat Laporan & Ekspor',
      icon: FileSpreadsheet,
      badge: 'PDF / XLS / DOC',
      badgeColor: 'emerald',
      category: 'ADMINISTRASI',
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan Wilayah',
      icon: Settings,
      category: 'SISTEM',
    },
  ];

  const handleNavClick = (viewId: AppView) => {
    setCurrentView(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-700/5 via-emerald-600/5 to-sky-600/5 dark:from-emerald-950/40 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800/80 p-1 flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 shrink-0">
              <img
                src={profil.logoUrl || LOGO_PKK_BASE64}
                alt="Logo PKK Resmi"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  e-PKK
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                  {profil.namaRT}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profil.namaRW}, Kel. {profil.namaKelurahan}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6 scrollbar-thin">
          {['MENU UTAMA', 'DATA & POKJA', 'ADMINISTRASI', 'SISTEM'].map((category) => {
            const items = navItems.filter((i) => i.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {category}
                </div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25 dark:bg-emerald-600'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4.5 h-4.5 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor === 'purple'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                                : item.badgeColor === 'amber'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                : item.badgeColor === 'blue'
                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {!isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* AI Banner Shortcut */}
          <div className="mx-1 p-3.5 bg-gradient-to-br from-emerald-600/10 via-sky-600/10 to-purple-600/10 dark:from-emerald-950/40 dark:to-purple-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-lg shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Asisten Surat PKK
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Buat surat resmi PKK instan
                </p>
              </div>
            </div>
            <button
              id="btn-sidebar-ai-surat"
              onClick={() => handleNavClick('surat-ai')}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Buat Konsep Surat
            </button>
          </div>

          {/* Cloud Firebase & Mobile Access Card */}
          <div className="mx-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Cloud & Akses HP
                  </h6>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tersimpan Online
                  </p>
                </div>
              </div>
            </div>
            <button
              id="btn-sidebar-cloud-hp"
              type="button"
              onClick={() => {
                setIsCloudModalOpen(true);
                onCloseMobile();
              }}
              className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Buka QR / Link HP</span>
            </button>
          </div>
        </div>

        {/* Footer Role & Profile Info */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {userRole === 'Ketua TP PKK'
                    ? profil.namaKetua || 'Ketua TP PKK'
                    : userRole === 'Sekretaris'
                    ? profil.namaSekretaris || 'Sekretaris'
                    : userRole === 'Bendahara'
                    ? profil.namaBendahara || 'Bendahara'
                    : 'Kader Dasawisma RT'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate leading-tight mt-0.5">
                  {userRole}
                </p>
              </div>
            </div>

            <button
              id="btn-sidebar-logout"
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
                  logout();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
