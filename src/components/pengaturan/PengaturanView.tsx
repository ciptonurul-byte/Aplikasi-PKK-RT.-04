import React, { useState } from 'react';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Image,
  KeyRound,
  Lock,
  UserCheck,
  RefreshCw,
  Users,
} from 'lucide-react';
import { usePKK } from '../../context/PKKContext';
import { ProfilPKKRT } from '../../types/pkk';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { LOGO_PKK_BASE64 } from '../../assets/logoPKK';

export const PengaturanView: React.FC = () => {
  const {
    profil,
    updateProfil,
    exportDataJSON,
    importDataJSON,
    clearAllData,
    userAccounts,
    resetPasswordToDefault,
  } = usePKK();

  const [formData, setFormData] = useState<ProfilPKKRT>(profil);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<string | null>(null);
  const [accountActionNotice, setAccountActionNotice] = useState<string | null>(null);

  // Sync state when profil from context changes (e.g. after import or reset)
  React.useEffect(() => {
    setFormData(profil);
  }, [profil]);

  const handleSaveProfil = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfil(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importDataJSON(content);
        if (success) {
          setImportStatus('Data e-PKK berhasil dipulihkan!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Gagal memulihkan: Format berkas JSON tidak valid.');
        }
      } catch (err) {
        setImportStatus('Terjadi kesalahan saat membaca berkas.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Pengaturan Wilayah & Profil Sekretariat TP PKK
            </h2>
            <Badge variant="emerald" size="sm">
              Sistem Aktif
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Konfigurasi identitas RT, susunan pengurus inti, serta manajemen pencadangan data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Profil RT & Pengurus */}
        <div className="lg:col-span-8 space-y-4">
          <form
            onSubmit={handleSaveProfil}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Identitas Wilayah Administrasi PKK</span>
              </h3>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profil tersimpan!</span>
                </span>
              )}
            </div>

            {/* Logo PKK Display & Setting */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-xs border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                <img
                  src={formData.logoUrl || LOGO_PKK_BASE64}
                  alt="Logo PKK"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <Image className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Logo Resmi PKK (Pemberdayaan Kesejahteraan Keluarga)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Logo resmi digunakan pada kop surat, laporan formal, dan seluruh dokumen administrasi.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <label className="px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors shadow-2xs">
                    Ganti Foto Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({ ...formData, logoUrl: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Reset Logo Bawaan
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama RT *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaRT || ''}
                  onChange={(e) => setFormData({ ...formData, namaRT: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama RW *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaRW || ''}
                  onChange={(e) => setFormData({ ...formData, namaRW: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kelurahan / Desa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKelurahan || ''}
                  onChange={(e) => setFormData({ ...formData, namaKelurahan: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kecamatan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKecamatan || ''}
                  onChange={(e) => setFormData({ ...formData, namaKecamatan: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKota || ''}
                  onChange={(e) => setFormData({ ...formData, namaKota: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Provinsi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.provinsi || ''}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Susunan Pengurus Inti TP PKK
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Ketua TP PKK *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaKetua || ''}
                    onChange={(e) => setFormData({ ...formData, namaKetua: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Sekretaris *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaSekretaris || ''}
                    onChange={(e) => setFormData({ ...formData, namaSekretaris: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Bendahara *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaBendahara || ''}
                    onChange={(e) => setFormData({ ...formData, namaBendahara: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Lengkap Sekretariat
              </label>
              <input
                type="text"
                value={formData.alamatSekretariat || ''}
                onChange={(e) => setFormData({ ...formData, alamatSekretariat: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                id="btn-simpan-profil-pkk"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>

          {/* Section: Manajemen Akun Pengguna & Kata Sandi */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Manajemen Akun Pengguna & Kata Sandi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hak akses resmi untuk Ketua, Sekretaris, Bendahara, dan Kader Dasawisma
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                4 Akun Aktif
              </Badge>
            </div>

            {accountActionNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{accountActionNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {userAccounts.map((acc) => {
                const isKetua = acc.role === 'Ketua TP PKK';
                const isSekretaris = acc.role === 'Sekretaris';
                const isBendahara = acc.role === 'Bendahara';

                const officialName = isKetua
                  ? profil.namaKetua || 'Ibu Ketua TP PKK'
                  : isSekretaris
                  ? profil.namaSekretaris || 'Sekretaris TP PKK'
                  : isBendahara
                  ? profil.namaBendahara || 'Bendahara TP PKK'
                  : 'Kader Dasawisma Flamboyan';

                return (
                  <div
                    key={acc.username}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${acc.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                            {acc.username.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {acc.role}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono">
                              @{acc.username}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isKetua ? 'emerald' : isSekretaris ? 'blue' : isBendahara ? 'amber' : 'purple'} size="sm">
                          {acc.username}
                        </Badge>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs">
                        <p className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                          Pejabat: <span className="text-emerald-700 dark:text-emerald-300">{officialName}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {acc.deskripsi}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400">
                        {acc.lastPasswordChange
                          ? `Diubah: ${acc.lastPasswordChange}`
                          : 'Sandi Bawaan Aktif'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Kembalikan kata sandi @${acc.username} ke bawaan (${acc.username}123)?`)) {
                              resetPasswordToDefault(acc.username);
                              setAccountActionNotice(`Kata sandi @${acc.username} telah direset ke bawaan (${acc.username}123)`);
                              setTimeout(() => setAccountActionNotice(null), 3000);
                            }
                          }}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Reset ke kata sandi bawaan"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setPasswordModalUser(acc.username)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Ubah Sandi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Data Lifecycle & Backup */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Pencadangan & Pemulihan Data</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simpan seluruh database e-PKK (Anggota, Dasawisma, Buku Kas, TOGA, Agenda) ke dalam berkas cadangan JSON.
            </p>

            <button
              onClick={exportDataJSON}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Cadangan JSON</span>
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pulihkan dari Berkas JSON:
              </label>
              <label className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Pilih Berkas Cadangan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {importStatus && (
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center">
                  {importStatus}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(true)}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Seluruh Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          clearAllData();
          setIsClearConfirmOpen(false);
        }}
        title="Kosongkan Seluruh Data e-PKK"
        message="Apakah Anda yakin ingin mengosongkan seluruh data aplikasi (Daftar Anggota, Keluarga Dasawisma, Buku Kas, Agenda Kegiatan, Tanaman TOGA, dan Surat)? Seluruh catatan akan dihapus sehingga data bersih dari awal."
        confirmLabel="Kosongkan Semua Data"
        isDestructive={true}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        targetUsername={passwordModalUser || undefined}
      />
    </div>
  );
};
