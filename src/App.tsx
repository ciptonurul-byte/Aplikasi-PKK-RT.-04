import React, { useState } from 'react';
import { PKKProvider, usePKK } from './context/PKKContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AnggotaView } from './components/anggota/AnggotaView';
import { DasawismaView } from './components/dasawisma/DasawismaView';
import { AnggotaKeluargaView } from './components/dasawisma/AnggotaKeluargaView';
import { KegiatanView } from './components/kegiatan/KegiatanView';
import { TogaView } from './components/toga/TogaView';
import { KeuanganView } from './components/keuangan/KeuanganView';
import { SuratAIView } from './components/surat/SuratAIView';
import { BukuWajibView } from './components/buku/BukuWajibView';
import { LaporanView } from './components/laporan/LaporanView';
import { PengaturanView } from './components/pengaturan/PengaturanView';
import { LoginView } from './components/auth/LoginView';
import { CloudSyncModal } from './components/layout/CloudSyncModal';
import { motion, AnimatePresence } from 'motion/react';

const MainLayout: React.FC = () => {
  const { currentView, isCloudModalOpen, setIsCloudModalOpen } = usePKK();
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView key="dashboard" />;
      case 'anggota':
        return <AnggotaView key="anggota" />;
      case 'dasawisma':
        return <DasawismaView key="dasawisma" />;
      case 'anggota-keluarga':
        return <AnggotaKeluargaView key="anggota-keluarga" />;
      case 'kegiatan':
        return <KegiatanView key="kegiatan" />;
      case 'toga':
        return <TogaView key="toga" />;
      case 'keuangan':
        return <KeuanganView key="keuangan" />;
      case 'surat-ai':
        return <SuratAIView key="surat-ai" />;
      case 'buku-wajib':
        return <BukuWajibView key="buku-wajib" />;
      case 'laporan':
        return <LaporanView key="laporan" />;
      case 'pengaturan':
        return <PengaturanView key="pengaturan" />;
      default:
        return <DashboardView key="dashboard" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0 transition-all duration-300">
        {/* Topbar */}
        <Topbar onToggleSidebarMobile={() => setSidebarMobileOpen((prev) => !prev)} />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Firebase Cloud Sync & Mobile Phone Access Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = usePKK();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <PKKProvider>
      <AppContent />
    </PKKProvider>
  );
}
