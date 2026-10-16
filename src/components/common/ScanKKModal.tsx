import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Home,
  Users,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  X,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { KartuKeluargaData, AnggotaKeluargaKK } from '../../types/pkk';

interface ScanKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnggotaForForm?: (
    selectedMember: AnggotaKeluargaKK,
    kkData: KartuKeluargaData,
    saveToDasawismaToo?: boolean
  ) => void;
  onSelectKeluargaForDasawisma?: (kkData: KartuKeluargaData) => void;
  title?: string;
  contextMode?: 'anggota' | 'dasawisma' | 'keluarga';
}

export const ScanKKModal: React.FC<ScanKKModalProps> = ({
  isOpen,
  onClose,
  onSelectAnggotaForForm,
  onSelectKeluargaForDasawisma,
  title = 'Scan Kartu Keluarga (KK) dengan AI',
  contextMode = 'anggota',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<KartuKeluargaData | null>(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0);
  const [syncToDasawisma, setSyncToDasawisma] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraNativeInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when modal closes or tab changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Browser ini tidak mendukung streaming webcam langsung. Silakan gunakan tombol "Buka Kamera HP" atau "Unggah Berkas".');
        setIsCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.log('Video play caught:', e));
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setIsCameraActive(false);

      const errName = err?.name || '';
      const errStr = String(err?.message || '').toLowerCase();

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errStr.includes('permission') ||
        errStr.includes('dismissed') ||
        errStr.includes('denied')
      ) {
        setErrorMsg('Izin kamera belum diizinkan atau ditutup. Anda tetap dapat memfoto KK dengan menekan tombol "Buka Kamera Bawaan HP" di bawah.');
      } else if (errName === 'NotFoundError' || errStr.includes('not found') || errStr.includes('device')) {
        setErrorMsg('Perangkat kamera tidak ditemukan. Silakan gunakan opsi Unggah Foto/PDF KK atau Contoh Demo.');
      } else if (errName === 'NotReadableError' || errStr.includes('in use') || errStr.includes('could not start')) {
        setErrorMsg('Kamera sedang dipakai oleh aplikasi lain. Silakan gunakan opsi Unggah Berkas atau ambil foto via file manager.');
      } else {
        setErrorMsg('Tidak dapat mengakses webcam langsung. Gunakan opsi Kamera HP atau Unggah Foto KK.');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      stopCamera();
      processImageWithAI(dataUrl, 'image/jpeg');
    }
  };

  const triggerNativeCamera = () => {
    if (cameraNativeInputRef.current) {
      cameraNativeInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WEBP) atau PDF Kartu Keluarga.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      processImageWithAI(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      processImageWithAI(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithAI = async (
    imageData?: string,
    mimeType?: string,
    sampleType?: string
  ) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanNotice(null);
    setScanStep('Mengunggah dokumen dan inisialisasi AI Vision...');

    try {
      setTimeout(() => {
        setScanStep('Membaca Nomor Kartu Keluarga, NIK, dan alamat kependudukan...');
      }, 700);

      setTimeout(() => {
        setScanStep('Mengekstrak daftar anggota keluarga, hubungan, dan status usia...');
      }, 1500);

      const res = await fetch('/api/ai/scan-kk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          mimeType: mimeType || 'image/jpeg',
          sampleType: sampleType,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setExtractedData(json.data);
        if (json.notice) {
          setScanNotice(json.notice);
        }
        // Default select wife or first female member for Anggota/Kader PKK
        const members: AnggotaKeluargaKK[] = json.data.anggotaKeluarga || [];
        const wifeIndex = members.findIndex(
          (m) =>
            m.statusHubungan?.includes('ISTRI') ||
            (m.jenisKelamin === 'Perempuan' && (m.usia || 0) >= 20)
        );
        setSelectedMemberIndex(wifeIndex >= 0 ? wifeIndex : 0);
      } else {
        throw new Error(json.error || 'Gagal memproses Kartu Keluarga');
      }
    } catch (err: any) {
      console.error('Scan KK error:', err);
      setErrorMsg('Gagal memproses Kartu Keluarga. Silakan coba kembali atau gunakan contoh demo.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleApplySelection = () => {
    if (!extractedData) return;

    if (contextMode === 'dasawisma') {
      if (onSelectKeluargaForDasawisma) {
        onSelectKeluargaForDasawisma(extractedData);
      }
      onClose();
      return;
    }

    // Anggota mode
    const selectedMember =
      extractedData.anggotaKeluarga[selectedMemberIndex] ||
      extractedData.anggotaKeluarga[0];

    if (onSelectAnggotaForForm && selectedMember) {
      onSelectAnggotaForForm(selectedMember, extractedData, syncToDasawisma);
    }
    onClose();
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResetScan = () => {
    setExtractedData(null);
    setImagePreview(null);
    setErrorMsg(null);
    setScanNotice(null);
    setSelectedMemberIndex(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={title}
      subtitle="Ekstraksi instan data Kartu Keluarga (KK) resmi menggunakan AI Vision Dukcapil"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Native Hidden Camera Input (Works on Mobile/Tablets without WebRTC getUserMedia permission prompt) */}
        <input
          ref={cameraNativeInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Error Alert with Quick Fallback Actions */}
        {errorMsg && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMsg}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Anda dapat langsung memfoto dokumen lewat kamera HP bawaan atau memilih file foto KK dari galeri.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={triggerNativeCamera}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera HP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('upload');
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                Pilih File
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* If no data extracted yet, show input methods */}
        {!extractedData && !isScanning && (
          <div className="space-y-4">
            {/* Tab selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                id="tab-scan-upload"
                onClick={() => {
                  stopCamera();
                  setActiveTab('upload');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto / PDF KK</span>
              </button>

              <button
                type="button"
                id="tab-scan-camera"
                onClick={() => {
                  setActiveTab('camera');
                  startCamera();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Kamera Langsung</span>
              </button>

              <button
                type="button"
                id="tab-scan-sample"
                onClick={() => {
                  stopCamera();
                  setActiveTab('sample');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'sample'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contoh KK Cepat</span>
              </button>
            </div>

            {/* TAB UPLOAD */}
            {activeTab === 'upload' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Klik atau Tarik Foto Kartu Keluarga (KK) ke Sini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                  Format gambar JPG, PNG, WEBP, atau file PDF scan KK. Pastikan tabel nama dan NIK terlihat jelas.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Data diproses aman & otomatis terekstraksi oleh AI</span>
                </div>
              </div>
            )}

            {/* TAB CAMERA */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                {isCameraActive ? (
                  <>
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[360px] flex items-center justify-center border border-slate-700">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Framing Overlay for KK */}
                      <div className="absolute inset-4 sm:inset-8 border-2 border-emerald-400/70 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between items-center text-[11px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs w-fit">
                          <span>Posisikan Dokumen Kartu Keluarga di dalam kotak</span>
                        </div>
                        <div className="text-right text-[11px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs w-fit self-end">
                          <span>AI Ready</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        id="btn-ambil-foto-kk"
                        onClick={capturePhoto}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Ambil Foto & Scan AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={triggerNativeCamera}
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Buka aplikasi kamera bawaan HP untuk resolusi lebih tinggi"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Kamera HP Bawaan</span>
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Fallback when webcam streaming is not active (permission denied, dismissed, or desktop without webcam) */
                  <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Ambil Foto Kartu Keluarga
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Gunakan kamera bawaan perangkat Anda untuk mengambil foto dokumen KK atau coba aktifkan webcam.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={triggerNativeCamera}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Buka Kamera HP / Perangkat</span>
                      </button>

                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Minta Izin Kamera Ulang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('upload');
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Foto dari Galeri</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB SAMPLE */}
            {activeTab === 'sample' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uji coba instan tanpa perlu menyiapkan file foto KK:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => processImageWithAI(undefined, undefined, 'default')}
                    className="p-4 text-left rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        KK Keluarga Pak Budi (4 Jiwa)
                      </span>
                      <Badge variant="emerald" size="sm">
                        Ada Balita & IRT
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Kepala Keluarga: Budi Santoso | Istri: Ny. Hj. Siti Aminah, S.Pd (Pengurus PKK) + 1 Balita (3 thn) + 1 Pelajar.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => processImageWithAI(undefined, undefined, 'keluarga_muda')}
                    className="p-4 text-left rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/40 dark:bg-sky-950/30 hover:bg-sky-100/50 dark:hover:bg-sky-900/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                        KK Keluarga Muda Pak Danang (3 Jiwa)
                      </span>
                      <Badge variant="blue" size="sm">
                        Kader Muda & PUS
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Kepala Keluarga: Danang Prasetyo | Istri: Ny. Maya Kartika (Kader PKK/Guru) + 1 Balita (2 thn).
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCANNING LOADING ANIMATION */}
        {isScanning && (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI Sedang Membaca & Mengekstrak Kartu Keluarga...
              </h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 animate-pulse">
                {scanStep}
              </p>
            </div>
          </div>
        )}

        {/* SCAN RESULT VIEW */}
        {extractedData && !isScanning && (
          <div className="space-y-4">
            {scanNotice && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{scanNotice}</span>
              </div>
            )}

            {/* Header Summary KK */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/70 dark:border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    KK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                        No. KK: {extractedData.noKk}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(extractedData.noKk, 'kk')}
                        className="text-emerald-600 hover:text-emerald-700 text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Salin No KK"
                      >
                        {copiedField === 'kk' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Kepala Keluarga: <span className="font-bold">{extractedData.namaKepalaKeluarga}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="emerald" size="sm">
                    {extractedData.jumlahAnggotaKeluarga} Jiwa ({extractedData.jumlahLakiLaki}L / {extractedData.jumlahPerempuan}P)
                  </Badge>
                  {extractedData.jumlahBalita > 0 && (
                    <Badge variant="rose" size="sm">
                      {extractedData.jumlahBalita} Balita
                    </Badge>
                  )}
                  {extractedData.jumlahLansia > 0 && (
                    <Badge variant="amber" size="sm">
                      {extractedData.jumlahLansia} Lansia
                    </Badge>
                  )}
                  {extractedData.statusPUS && (
                    <Badge variant="purple" size="sm">
                      PUS
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-2.5 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 dark:text-slate-400">Alamat KK: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {extractedData.alamat} RT {extractedData.rt} / RW {extractedData.rw}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400">Wilayah: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Kel. {extractedData.kelurahan}, Kec. {extractedData.kecamatan}, {extractedData.kabupatenKota}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Section */}
            {contextMode === 'anggota' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pilih Anggota Keluarga yang Didaftarkan sebagai Anggota/Kader PKK:</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Klik kartu di bawah untuk memilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {extractedData.anggotaKeluarga.map((member, idx) => {
                    const isSelected = selectedMemberIndex === idx;
                    const isIbuOrWife =
                      member.statusHubungan?.includes('ISTRI') ||
                      (member.jenisKelamin === 'Perempuan' && (member.usia || 0) >= 18);

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedMemberIndex(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isSelected ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {member.nama}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                NIK: {member.nik}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Badge
                              variant={
                                member.statusHubungan?.includes('KEPALA')
                                  ? 'slate'
                                  : isIbuOrWife
                                  ? 'emerald'
                                  : 'blue'
                              }
                              size="sm"
                            >
                              {member.statusHubungan}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div>
                            Pekerjaan: <span className="font-medium text-slate-700 dark:text-slate-300">{member.jenisPekerjaan}</span>
                          </div>
                          <div>
                            Pendidikan: <span className="font-medium text-slate-700 dark:text-slate-300">{member.pendidikan}</span>
                          </div>
                          <div>
                            Usia: <span className="font-medium text-slate-700 dark:text-slate-300">{member.usia || '-'} thn ({member.jenisKelamin})</span>
                          </div>
                          <div>
                            Lahir: <span className="font-medium text-slate-700 dark:text-slate-300">{member.tempatLahir}, {member.tanggalLahir}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dasawisma Dual Sync Option */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={syncToDasawisma}
                      onChange={(e) => setSyncToDasawisma(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simpan juga data keluarga ini ke Buku Catatan Dasawisma (Buku Keluarga)</span>
                    </div>
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                    Otomatis Sinkron
                  </span>
                </div>
              </div>
            ) : (
              /* Mode Dasawisma (Full Family View) */
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Anggota Keluarga Terdata ({extractedData.anggotaKeluarga.length} Jiwa):</span>
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Nama & NIK</th>
                        <th className="px-3 py-2">Hubungan</th>
                        <th className="px-3 py-2">JK / Usia</th>
                        <th className="px-3 py-2">Pendidikan</th>
                        <th className="px-3 py-2">Pekerjaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {extractedData.anggotaKeluarga.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{m.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.nik}</div>
                          </td>
                          <td className="px-3 py-2 font-medium">{m.statusHubungan}</td>
                          <td className="px-3 py-2">{m.jenisKelamin[0]} / {m.usia || '-'} thn</td>
                          <td className="px-3 py-2">{m.pendidikan}</td>
                          <td className="px-3 py-2">{m.jenisPekerjaan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetScan}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scan Dokumen Lain</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-apply-scan-kk"
                  onClick={handleApplySelection}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {contextMode === 'dasawisma'
                      ? 'Terapkan ke Data Keluarga Dasawisma'
                      : 'Gunakan Data Ini di Formulir Anggota'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
