import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Phone,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  MessageCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ProfilPKKRT } from '../../types/pkk';
import {
  KwitansiIuranPayload,
  cleanWhatsAppNumber,
  formatPhoneDisplay,
  angkaKeTerbilang,
  formatPesanWhatsAppKwitansi,
  getWhatsAppDirectUrl,
  generateNomorKwitansi,
  NAMA_BULAN_LENGKAP,
} from '../../utils/whatsappHelper';
import { printKwitansiIuran } from '../../utils/printHelper';

interface KwitansiIuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  profil: ProfilPKKRT;
  initialData: {
    anggotaId: string;
    namaPenerimaIuran: string;
    noHp?: string;
    jabatan?: string;
    dasawisma?: string;
    bulanList: number[];
    tahun: number;
    nominalPerBulan: number;
    tanggalBayar?: string;
    metodeBayar?: 'Tunai' | 'Transfer';
    catatan?: string;
  } | null;
  onSavePhone?: (anggotaId: string, newPhone: string) => void;
}

export const KwitansiIuranModal: React.FC<KwitansiIuranModalProps> = ({
  isOpen,
  onClose,
  profil,
  initialData,
  onSavePhone,
}) => {
  if (!initialData) return null;

  const [phoneInput, setPhoneInput] = useState<string>(initialData.noHp || '');
  const [selectedBulan, setSelectedBulan] = useState<number[]>(
    initialData.bulanList && initialData.bulanList.length > 0 ? initialData.bulanList : [new Date().getMonth() + 1]
  );
  const [nominalPerBln, setNominalPerBln] = useState<number>(
    initialData.nominalPerBulan || profil.iuranBulananNominal || 10000
  );
  const [tanggalBayar, setTanggalBayar] = useState<string>(
    initialData.tanggalBayar || new Date().toISOString().split('T')[0]
  );
  const [metodeBayar, setMetodeBayar] = useState<'Tunai' | 'Transfer'>(
    initialData.metodeBayar || 'Tunai'
  );
  const [catatan, setCatatan] = useState<string>(initialData.catatan || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [phoneSavedNotice, setPhoneSavedNotice] = useState<boolean>(false);

  // Sync state whenever initialData changes
  useEffect(() => {
    if (initialData) {
      setPhoneInput(initialData.noHp || '');
      setSelectedBulan(
        initialData.bulanList && initialData.bulanList.length > 0
          ? initialData.bulanList
          : [new Date().getMonth() + 1]
      );
      setNominalPerBln(initialData.nominalPerBulan || profil.iuranBulananNominal || 10000);
      setTanggalBayar(initialData.tanggalBayar || new Date().toISOString().split('T')[0]);
      setMetodeBayar(initialData.metodeBayar || 'Tunai');
      setCatatan(initialData.catatan || '');
      setCopied(false);
      setPhoneSavedNotice(false);
    }
  }, [initialData, profil.iuranBulananNominal]);

  const totalNominal = useMemo(() => {
    return selectedBulan.length * nominalPerBln;
  }, [selectedBulan.length, nominalPerBln]);

  const nomorKwitansi = useMemo(() => {
    return generateNomorKwitansi(
      initialData.tahun || new Date().getFullYear(),
      selectedBulan,
      initialData.anggotaId
    );
  }, [initialData.tahun, selectedBulan, initialData.anggotaId]);

  const terbilangText = useMemo(() => {
    return angkaKeTerbilang(totalNominal);
  }, [totalNominal]);

  const payload: KwitansiIuranPayload = useMemo(() => {
    return {
      nomorKwitansi,
      tanggalBayar,
      namaPenerimaIuran: initialData.namaPenerimaIuran,
      noHp: phoneInput.trim(),
      jabatan: initialData.jabatan || 'Anggota PKK',
      dasawisma: initialData.dasawisma,
      bulanList: selectedBulan,
      tahun: initialData.tahun || new Date().getFullYear(),
      nominalPerBulan: nominalPerBln,
      totalNominal,
      metodeBayar,
      catatan: catatan.trim(),
      namaBendahara: profil.namaBendahara || 'Bendahara TP PKK',
    };
  }, [
    nomorKwitansi,
    tanggalBayar,
    initialData,
    phoneInput,
    selectedBulan,
    nominalPerBln,
    totalNominal,
    metodeBayar,
    catatan,
    profil.namaBendahara,
  ]);

  const whatsappMessage = useMemo(() => {
    return formatPesanWhatsAppKwitansi(payload, profil);
  }, [payload, profil]);

  const cleanPhone = cleanWhatsAppNumber(phoneInput);
  const isPhoneValid = cleanPhone.length >= 10;

  const handleSavePhoneClick = () => {
    if (onSavePhone && initialData.anggotaId) {
      onSavePhone(initialData.anggotaId, phoneInput.trim());
      setPhoneSavedNotice(true);
      setTimeout(() => setPhoneSavedNotice(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!phoneInput.trim()) {
      alert('Silakan masukkan nomor HP / WhatsApp Ibu terlebih dahulu sebelum mengirim.');
      const el = document.getElementById('kwitansi-phone-input');
      if (el) el.focus();
      return;
    }

    // Auto save phone if handler provided
    if (onSavePhone && initialData.anggotaId && phoneInput.trim() !== (initialData.noHp || '')) {
      onSavePhone(initialData.anggotaId, phoneInput.trim());
    }

    const waUrl = getWhatsAppDirectUrl(phoneInput, whatsappMessage);
    window.open(waUrl, '_blank');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = whatsappMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    printKwitansiIuran(payload, profil);
  };

  const toggleBulan = (m: number) => {
    setSelectedBulan((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bukti Kwitansi & Kirim WhatsApp Iuran PKK"
      size="xl"
    >
      <div className="space-y-5">
        {/* Top Info Banner */}
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 shadow-2xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Kwitansi Digital Terintegrasi WhatsApp
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                Kirim bukti setoran iuran langsung ke nomor WhatsApp <strong>Ibu {initialData.namaPenerimaIuran}</strong> atau cetak lembar fisik.
              </p>
            </div>
          </div>
          <Badge variant="emerald" size="sm">
            {profil.namaRT} / {profil.namaRW}
          </Badge>
        </div>

        {/* Form Quick Editor: Phone Number & Period */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No. HP / WhatsApp Ibu</span>
                  <span className="text-rose-500">*</span>
                </label>
                {phoneSavedNotice && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tersimpan
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    id="kwitansi-phone-input"
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-3 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {isPhoneValid && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {onSavePhone && (
                  <button
                    type="button"
                    onClick={handleSavePhoneClick}
                    title="Simpan nomor HP ini ke data anggota"
                    className="px-2.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Simpan</span>
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {isPhoneValid ? (
                  <span className="text-emerald-600 font-medium">
                    Format WA: +{cleanPhone} ({formatPhoneDisplay(phoneInput)})
                  </span>
                ) : (
                  <span className="text-amber-600">
                    Masukkan nomor HP aktif untuk mengirim kwitansi langsung ke WhatsApp.
                  </span>
                )}
              </p>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Bayar
                </label>
                <input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Bayar
                </label>
                <select
                  value={metodeBayar}
                  onChange={(e) => setMetodeBayar(e.target.value as 'Tunai' | 'Transfer')}
                  className="w-full px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer Bank / QRIS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Month Selection Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Bulan yang Masuk Kwitansi ({selectedBulan.length} Bulan Terpilih):
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedBulan([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                >
                  Pilih 12 Bulan
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedBulan([new Date().getMonth() + 1])}
                  className="text-[10px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Bulan Ini Saja
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
              {NAMA_BULAN_LENGKAP.map((nama, idx) => {
                const mNum = idx + 1;
                const isSelected = selectedBulan.includes(mNum);
                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => toggleBulan(mNum)}
                    className={`py-1.5 px-1 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{nama.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus Kwitansi (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Titip lewat Bu RT / Pembayaran arisan & kas..."
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* PREVIEW KARTU KWITANSI DIGITAL */}
        <div className="relative border-2 border-emerald-600/70 dark:border-emerald-600/50 bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden">
          {/* Lunas Stamp */}
          <div className="absolute right-4 top-4 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase px-3 py-1 rounded-lg -rotate-6 select-none bg-emerald-50/80 dark:bg-emerald-950/60 shadow-xs">
            ✓ LUNAS
          </div>

          {/* Kwitansi Header */}
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Pemberdayaan dan Kesejahteraan Keluarga (PKK)
            </h4>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              TIM PENGGERAK PKK {profil.namaRT} / {profil.namaRW}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kelurahan {profil.namaKelurahan || 'Setempat'}, {profil.namaKota}
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-emerald-600 text-white rounded-full font-bold text-[11px] uppercase tracking-wide">
              Kwitansi Tanda Terima Iuran
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              No: <strong>{nomorKwitansi}</strong>
            </p>
          </div>

          {/* Kwitansi Body Rows */}
          <div className="py-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="sm:col-span-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                Ibu {initialData.namaPenerimaIuran}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Jabatan / Kelompok</span>
              <span className="sm:col-span-2 font-semibold">
                {initialData.jabatan || 'Anggota PKK'}
                {initialData.dasawisma ? ` · ${initialData.dasawisma}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">No. WhatsApp Ibu</span>
              <span className="sm:col-span-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {phoneInput ? formatPhoneDisplay(phoneInput) : '(Belum diisi)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="sm:col-span-2 font-semibold text-slate-900 dark:text-slate-100">
                Iuran Rutin Anggota PKK Tahun {initialData.tahun || new Date().getFullYear()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Rincian Bulan</span>
              <div className="sm:col-span-2 flex flex-wrap gap-1">
                {selectedBulan.length === 0 ? (
                  <span className="text-rose-500 font-semibold">Pilih minimal 1 bulan</span>
                ) : (
                  selectedBulan.map((b) => (
                    <span
                      key={b}
                      className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-semibold text-[11px]"
                    >
                      {NAMA_BULAN_LENGKAP[b - 1]}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Metode Pembayaran</span>
              <span className="sm:col-span-2 font-medium">{metodeBayar}</span>
            </div>

            {catatan && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <span className="text-slate-500 font-medium">Catatan / Keterangan</span>
                <span className="sm:col-span-2 italic text-slate-600 dark:text-slate-400">
                  {catatan}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Terbilang</span>
              <span className="sm:col-span-2 font-bold italic text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border-l-3 border-emerald-600">
                "{terbilangText}"
              </span>
            </div>
          </div>

          {/* Kwitansi Footer: Total Box & Signature */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="w-full sm:w-auto p-3.5 bg-emerald-100/70 dark:bg-emerald-950/70 rounded-xl border border-emerald-300 dark:border-emerald-800 text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Total Nominal Terbayar
              </p>
              <h3 className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                Rp {totalNominal.toLocaleString('id-ID')}
              </h3>
            </div>

            <div className="text-center sm:text-right text-xs">
              <p className="text-slate-400 text-[11px]">
                {profil.namaKota || 'Jakarta'}, {tanggalBayar}
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Bendahara TP PKK {profil.namaRT}
              </p>
              <div className="h-9" />
              <p className="font-bold underline text-slate-900 dark:text-slate-100">
                {profil.namaBendahara || 'Bendahara'}
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Message Preview Collapsible / Card */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Preview Teks Format WhatsApp:</span>
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {whatsappMessage}
          </pre>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kwitansi</span>
            </button>

            <button
              id="btn-kirim-kwitansi-wa"
              type="button"
              onClick={handleSendWhatsApp}
              disabled={selectedBulan.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim ke WhatsApp Ibu {initialData.namaPenerimaIuran.split(' ')[0]}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
