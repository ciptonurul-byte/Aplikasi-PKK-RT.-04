import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Database,
  ArrowUpCircle,
  ArrowDownCircle,
  QrCode,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { usePKK } from '../../context/PKKContext';
import firebaseConfig from '../../../firebase-applet-config.json';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    profil,
    anggotaList,
    keluargaList,
    kegiatanList,
    togaList,
    transaksiList,
    iuranList,
    suratList,
    cloudSyncStatus,
    syncToCloud,
    syncFromCloud,
  } = usePKK();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'mobile'>('status');

  const webUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-on3sw7fdof3fpjsmlwblwf-929604963713.asia-east1.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    webUrl
  )}&color=047857`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const totalLocalItems =
    anggotaList.length +
    keluargaList.length +
    kegiatanList.length +
    togaList.length +
    transaksiList.length +
    iuranList.length +
    suratList.length +
    1; // profil

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Penyimpanan Cloud Firebase & Akses HP"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sinkronisasi Data Cloud</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mobile'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Akses HP & QR Code</span>
          </button>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-4">
            {/* Banner Status Cloud */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-sky-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-5 h-5 text-emerald-100" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Firebase Cloud Firestore Aktif
                  </h4>
                  <Badge variant="emerald" size="sm" dot>
                    Online & Siap Akses
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Seluruh data catatan keluarga, anggota, keuangan, kegiatan, dan surat dinas PKK RT tersimpan secara terpusat di Cloud.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span>Project ID: <strong className="font-mono">{firebaseConfig.projectId}</strong></span>
                  <span>•</span>
                  <span>Database: <strong className="font-mono">{firebaseConfig.firestoreDatabaseId.slice(0, 18)}...</strong></span>
                </div>
              </div>
            </div>

            {/* Statistik Data Tersimpan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Anggota PKK</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{anggotaList.length} Jiwa</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] uppercase font-bold text-slate-400">KK Dasawisma</span>
                <span className="text-sm font-black text-emerald-600">{keluargaList.length} KK</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Transaksi Kas</span>
                <span className="text-sm font-black text-amber-600">{transaksiList.length} Bukti</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Total Objek</span>
                <span className="text-sm font-black text-teal-600">{totalLocalItems} Record</span>
              </div>
            </div>

            {/* Tombol Aksi Sinkronisasi */}
            <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Opsi Sinkronisasi Dua Arah
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    {cloudSyncStatus.lastSyncedAt
                      ? `Terakhir disinkronkan: ${new Date(cloudSyncStatus.lastSyncedAt).toLocaleString('id-ID')}`
                      : 'Data disinkronkan secara real-time ke Cloud'}
                  </p>
                </div>
                {cloudSyncStatus.isSyncing && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Menyinkronkan...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => syncToCloud()}
                  disabled={cloudSyncStatus.isSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Cadangkan / Upload ke Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => syncFromCloud()}
                  disabled={cloudSyncStatus.isSyncing}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors"
                >
                  <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                  <span>Tarik Data Terbaru dari Cloud</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info Akses HP */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* QR Code */}
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Akses Aplikasi PKK di HP"
                  className="w-36 h-36 rounded-lg object-contain"
                />
              </div>

              <div className="space-y-2 flex-1">
                <Badge variant="emerald" size="sm">
                  Bisa Diakses Di Mana Saja
                </Badge>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Scan QR Code Menggunakan Kamera HP
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Arahkan kamera HP / browser smartphone Anda ke QR code ini untuk langsung membuka aplikasi PKK RT. Anda juga dapat menyalin tautan web di bawah:
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={webUrl}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Keuntungan Akses Cloud di HP */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2 text-xs">
              <h5 className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Keuntungan Akses HP Terhubung Cloud:</span>
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] pl-1">
                <li>
                  <strong>Satu Data Bersama</strong>: Setiap kali data diisi di laptop/komputer, data otomatis langsung terlihat di HP kader dan warga lainnya.
                </li>
                <li>
                  <strong>Input Langsung di Lapangan</strong>: Kader Dasawisma dapat langsung mencatat data warga atau iuran dari HP saat kunjungan warga.
                </li>
                <li>
                  <strong>Kirim Bukti WhatsApp Langsung</strong>: Kwitansi pembayaran iuran dapat langsung dikirim ke WhatsApp warga dari HP.
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
