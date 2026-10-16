import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Info,
  Layers,
  FileCheck,
  Check,
  Search,
  Eye,
  Trash2,
  Sparkles,
  Cloud,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  downloadTemplateExcelKeluarga,
  parseExcelKeluarga,
  ParsedKeluargaRow,
} from '../../utils/excelKeluargaHelper';

interface ImportKeluargaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportKeluargaModal: React.FC<ImportKeluargaModalProps> = ({ isOpen, onClose }) => {
  const { keluargaList, addKeluargaBatch, profil, syncToCloud, setIsCloudModalOpen } = usePKK();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedKeluargaRow[]>([]);
  const [upsertExisting, setUpsertExisting] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [filterPreview, setFilterPreview] = useState<'all' | 'valid' | 'invalid' | 'existing' | 'new'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setImportResult(null);
    try {
      const rows = await parseExcelKeluarga(selectedFile, keluargaList);
      setParsedRows(rows);
    } catch (err) {
      console.error('Gagal memproses berkas Excel:', err);
      alert('Gagal membaca berkas Excel. Pastikan format berkas valid (.xlsx, .xls, atau .csv).');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls') ||
        droppedFile.name.endsWith('.csv')
      ) {
        handleFileChange(droppedFile);
      } else {
        alert('Hanya mendukung berkas format Excel (.xlsx, .xls) atau CSV (.csv).');
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;
  const existingRowsCount = parsedRows.filter((r) => r.isExisting && r.isValid).length;
  const newRowsCount = parsedRows.filter((r) => !r.isExisting && r.isValid).length;

  const filteredDisplayRows = parsedRows.filter((r) => {
    const matchSearch =
      r.namaKepalaKeluarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.namaIbu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.noKk.includes(searchTerm) ||
      r.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dasawisma.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (filterPreview === 'valid') return r.isValid;
    if (filterPreview === 'invalid') return !r.isValid;
    if (filterPreview === 'existing') return r.isExisting && r.isValid;
    if (filterPreview === 'new') return !r.isExisting && r.isValid;
    return true;
  });

  const handleExecuteImport = async () => {
    const targetRows = skipInvalid ? parsedRows.filter((r) => r.isValid) : parsedRows;
    if (targetRows.length === 0) {
      alert('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    setIsSyncingCloud(true);
    setCloudSyncSuccess(false);
    setCloudSyncError(null);

    const payload = targetRows.map((r) => ({
      noKk: r.noKk,
      namaKepalaKeluarga: r.namaKepalaKeluarga,
      namaIbu: r.namaIbu,
      noHpIbu: r.noHpIbu || '',
      alamat: r.alamat,
      dasawisma: r.dasawisma,
      jumlahAnggotaKeluarga: r.jumlahAnggotaKeluarga,
      jumlahLakiLaki: r.jumlahLakiLaki,
      jumlahPerempuan: r.jumlahPerempuan,
      jumlahBalita: r.jumlahBalita,
      jumlahIbuHamil: r.jumlahIbuHamil,
      jumlahLansia: r.jumlahLansia,
      statusPUS: r.statusPUS,
      statusWUS: r.statusWUS,
      statusRumahSehat: r.statusRumahSehat,
      memilikiJambanSehat: r.memilikiJambanSehat,
      memilikiSPAL: r.memilikiSPAL,
      memilikiTempatSampah: r.memilikiTempatSampah,
      memilikiSumberAirBersih: r.memilikiSumberAirBersih,
      memilikiPekaranganToga: r.memilikiPekaranganToga,
      makananPokok: r.makananPokok,
      kategoriSejahtera: r.kategoriSejahtera,
      catatanKesehatan: r.catatanKesehatan || '',
      anggotaKeluarga: r.anggotaKeluarga || [],
    }));

    // 1. Add to local state & recalculate
    const result = addKeluargaBatch(payload, upsertExisting);
    setImportResult({ added: result.added, updated: result.updated });

    // 2. Direct upload to Cloud Firebase!
    try {
      const syncResult = await syncToCloud({ keluargaList: result.nextList });
      if (syncResult && syncResult.success) {
        setCloudSyncSuccess(true);
      } else {
        setCloudSyncError('Data tersimpan di laptop, namun sinkronisasi cloud terhambat. Pastikan koneksi internet aktif.');
      }
    } catch (err: any) {
      console.error('Error syncing to cloud after Excel import:', err);
      setCloudSyncError(err?.message || 'Gagal sinkronisasi ke Cloud Firebase');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleFinishAndClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFinishAndClose}
      title="Impor Data Keluarga & Dasawisma via Excel"
      size="2xl"
    >
      <div className="space-y-5">
        {/* Step 1: Info Banner & Download Template Button */}
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Format Template Resmi Data Keluarga
              </h4>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Unduh template Excel dengan judul kolom terstandar PKK (No KK, Kepala Keluarga, Balita/Bumil/Lansia, Sanitasi Rumah Sehat, dll).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadTemplateExcelKeluarga(profil.namaRT)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-100/60 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Unduh Template (.xlsx)</span>
          </button>
        </div>

        {/* Success View after Import */}
        {importResult ? (
          <div className="p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-center space-y-4 shadow-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Impor Data Keluarga Berhasil!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Data keluarga telah berhasil diintegrasikan ke dalam basis data Catatan Keluarga PKK RT.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Data KK Baru</p>
                <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-0.5">
                  +{importResult.added}
                </p>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-xl text-center">
                <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">Data KK Diperbarui</p>
                <p className="text-xl font-extrabold text-sky-800 dark:text-sky-200 mt-0.5">
                  {importResult.updated}
                </p>
              </div>
            </div>

            {/* Cloud Status Verification Banner */}
            <div className="max-w-md mx-auto">
              {isSyncingCloud ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Menyinkronkan dan mengunggah ke Cloud Firebase...</span>
                </div>
              ) : cloudSyncSuccess ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                      Tersimpan di Cloud Firebase & Siap Diakses di HP!
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pl-6 leading-relaxed">
                    Data Excel yang baru diimpor telah tersimpan di Cloud Firestore. Buka tautan web aplikasi di smartphone/HP Anda untuk langsung melihat seluruh data ini.
                  </p>
                </div>
              ) : cloudSyncError ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Catatan Sinkronisasi Cloud</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 pl-6">
                    {cloudSyncError}
                  </p>
                  <button
                    type="button"
                    onClick={() => syncToCloud()}
                    className="ml-6 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Coba Sinkronkan Sekarang
                  </button>
                </div>
              ) : null}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Impor Berkas Lain
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFinishAndClose();
                  setIsCloudModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-xl border border-sky-300 dark:border-sky-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Buka Link / QR Akses HP</span>
              </button>
              <button
                type="button"
                onClick={handleFinishAndClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Selesai & Lihat Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 2: Upload Area */}
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3">
                  Tarik & Lepas Berkas Excel di Sini
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  atau klik untuk memilih berkas dari komputer (.xlsx, .xls, .csv)
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Mendukung deteksi otomatis nama kolom fleksibel
                </div>
              </div>
            ) : (
              /* Uploaded File Bar */
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} baris terdeteksi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Ganti berkas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Parsing State */}
            {isParsing && (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Memproses dan memvalidasi baris data Excel...
                </p>
              </div>
            )}

            {/* Preview & Validation Results */}
            {!isParsing && parsedRows.length > 0 && (
              <div className="space-y-4">
                {/* Stats & Filters Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setFilterPreview('all')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      filterPreview === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="text-[10px] font-semibold opacity-80">Total Terdeteksi</p>
                    <p className="text-base font-extrabold">{parsedRows.length} KK</p>
                  </div>

                  <div
                    onClick={() => setFilterPreview('valid')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      filterPreview === 'valid'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold">Siap Diimpor (Valid)</p>
                    <p className="text-base font-extrabold">{validRowsCount} KK</p>
                  </div>

                  <div
                    onClick={() => setFilterPreview('new')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      filterPreview === 'new'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold">Data Baru</p>
                    <p className="text-base font-extrabold">{newRowsCount} KK</p>
                  </div>

                  <div
                    onClick={() => setFilterPreview('existing')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      filterPreview === 'existing'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <p className="text-[10px] font-semibold">Update KK Lama</p>
                    <p className="text-base font-extrabold">{existingRowsCount} KK</p>
                  </div>
                </div>

                {/* Import Options Checkboxes */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={upsertExisting}
                      onChange={(e) => setUpsertExisting(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 dark:bg-slate-700"
                    />
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      Perbarui data otomatis jika Nomor KK sudah ada di sistem (Sinkronisasi Data KK)
                    </span>
                  </label>

                  {invalidRowsCount > 0 && (
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipInvalid}
                        onChange={(e) => setSkipInvalid(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 dark:bg-slate-700"
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        Abaikan {invalidRowsCount} baris yang memiliki catatan error / tidak valid
                      </span>
                    </label>
                  )}
                </div>

                {/* Preview Search Filter */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari dalam pratinjau (Nama, No KK, Alamat)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    Menampilkan {filteredDisplayRows.length} dari {parsedRows.length} data
                  </span>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold z-10">
                      <tr>
                        <th className="p-2.5 w-10 text-center">No</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">No KK</th>
                        <th className="p-2.5">Kepala Keluarga / Ibu</th>
                        <th className="p-2.5">Dasawisma & Alamat</th>
                        <th className="p-2.5 text-center">Jiwa (L/P)</th>
                        <th className="p-2.5 text-center">Kelompok Rentan</th>
                        <th className="p-2.5 text-center">Rumah Sehat</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5 text-center w-10">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredDisplayRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !row.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="p-2.5">
                            {!row.isValid ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-md text-[10px] font-bold"
                                title={row.errors.join(', ')}
                              >
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            ) : row.isExisting ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-md text-[10px] font-bold">
                                <RefreshCw className="w-3 h-3" /> Update KK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Baru
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            {row.noKk || '-'}
                            {!row.isValid && row.errors.length > 0 && (
                              <p className="text-[10px] text-rose-500 font-sans mt-0.5">{row.errors[0]}</p>
                            )}
                          </td>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {row.namaKepalaKeluarga}
                            </p>
                            <p className="text-[11px] text-slate-500">Ibu: {row.namaIbu}</p>
                          </td>
                          <td className="p-2.5">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {row.dasawisma}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {row.alamat}
                            </p>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {row.jumlahAnggotaKeluarga}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">
                              ({row.jumlahLakiLaki}L / {row.jumlahPerempuan}P)
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-[11px]">
                            {row.jumlahBalita > 0 && (
                              <span className="inline-block px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[10px] mr-1">
                                {row.jumlahBalita} Balita
                              </span>
                            )}
                            {row.jumlahIbuHamil > 0 && (
                              <span className="inline-block px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px] mr-1">
                                {row.jumlahIbuHamil} Bumil
                              </span>
                            )}
                            {row.jumlahLansia > 0 && (
                              <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded text-[10px]">
                                {row.jumlahLansia} Lansia
                              </span>
                            )}
                            {row.jumlahBalita === 0 && row.jumlahIbuHamil === 0 && row.jumlahLansia === 0 && (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.statusRumahSehat ? (
                              <span className="text-emerald-600 font-bold text-[11px]">✓ Ya</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">✗ Tidak</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <Badge
                              variant={
                                row.kategoriSejahtera === 'Sejahtera III'
                                  ? 'emerald'
                                  : row.kategoriSejahtera === 'Sejahtera II'
                                  ? 'blue'
                                  : row.kategoriSejahtera === 'Sejahtera I'
                                  ? 'amber'
                                  : 'rose'
                              }
                              size="sm"
                            >
                              {row.kategoriSejahtera}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus baris dari pratinjau"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Batal & Pilih Ulang
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={validRowsCount === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Impor {skipInvalid ? validRowsCount : parsedRows.length} Data Keluarga</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
